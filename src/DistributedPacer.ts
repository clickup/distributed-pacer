import type Redis from "ioredis";
import type { Cluster } from "ioredis";
import type { Pacer, PacerOutcome } from "./Pacer";

/** This value forces the pacer to not fall back to burst allowing mode too
 * often after it exited from that mode. */
const DEFAULT_PACE_BURST_ALLOWANCE_FACTOR = 0.5;

/** The value is high enough to correct possible clock skew between Redis server
 * and local Node process, and also, to make unit tests happy. It also helps
 * with debugging. */
const EXTRA_EXPIRE_SEC = 120;

/** Version of the storage format; when we modify the format in an incompatible
 * way, we increase this value. */
const DB_FORMAT_VERSION = "1";

/**
 * Options which identify each lightweight pacer instance.
 */
export interface DistributedPacerOptions {
  /** Redis key for the pacer. */
  key: string;
  /** Target maximum allowed QPS. */
  qps: number;
  /** How much accumulated weight of the requests is allowed on top of an idle
   * pacer before turning on pacing. */
  maxBurst?: number;
  /** At what factor of QPS do we earn back burst allowance. This makes sense
   * for pacing use case; for rate limiting, the common value passed here is 1,
   * since we start rejecting requests after the bucket is full and do not queue
   * them above the bucket. */
  burstAllowanceFactor?: number;
}

/**
 * A lightweight class which wraps a Redis client and implements distributed
 * pacing algorithm on top of it.
 */
export class DistributedPacer implements Pacer {
  private redis: Redis & {
    distributedPacerPush: (
      key: string,
      /** Internally, we use float seconds timestamps and not milliseconds,
       * since it simplifies QPS related logic in the Lua code. */
      timeNow: number, // float seconds unix timestamp
      weight: number,
      qps: number,
      maxBurst: number,
      /** Makes sense for pacing use case only (for rate limiting, it is
       * typically 1). */
      burstAllowanceFactor: number,
      /** If 0 (aka false), the DB won't be updated in case the call causes a
       * nonzero delay being returned (rate limiting use case). */
      saveOnDelay: number,
      extraExpire: number,
    ) => Promise<[timeOfShot: string, watermark: string, notice: string]>;
  };

  /**
   * Initializes a pacer instance. You can create instances of this class as
   * often as you want.
   */
  constructor(
    /** Redis client instance (connection) to use. */
    redis: Redis | Cluster,
    /** Configuration options. */
    readonly options: DistributedPacerOptions,
    /** Namespace to prepend all the keys with. */
    readonly namespace?: string,
  ) {
    this.redis = redis as any;
    // For debug printing, use redis.log(redis.LOG_WARNING, tostring(...))
    typeof this.redis.distributedPacerPush !== "function" &&
      this.redis.defineCommand("distributedPacerPush", {
        numberOfKeys: 1,
        lua: `
          local KEY, timeNow, weight, qps, maxBurst, burstAllowanceFactor, saveOnDelay, extraExpire =
            KEYS[1], tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3]), tonumber(ARGV[4]), tonumber(ARGV[5]), tonumber(ARGV[6]), tonumber(ARGV[7])

          local dbWatermark, dbTimeOfLastDrip, dbTimeOfNextShot = unpack(
            redis.call("HMGET", KEY, "watermark", "timeOfLastDrip", "timeOfNextShot")
          )
          dbWatermark = tonumber(dbWatermark) or 0
          dbTimeOfLastDrip = tonumber(dbTimeOfLastDrip) or timeNow
          dbTimeOfNextShot = math.max(tonumber(dbTimeOfNextShot) or 0, timeNow)

          local timeOfShot
          local notice

          -- Leak water from the bucket at a constant rate, but only if there
          -- are no requests scheduled in the future (i.e. no requests are
          -- sitting waiting on top of the bucket).
          if dbTimeOfNextShot <= timeNow then
            dbWatermark = math.max(
              0,
              dbWatermark - (timeNow - dbTimeOfLastDrip) * qps * burstAllowanceFactor
            )
          end
          dbTimeOfLastDrip = timeNow

          -- Add water (request weight) to the bucket.
          local watermark = dbWatermark
          dbWatermark = dbWatermark + weight

          -- Decide whether we should send the request to the future or not.
          local overflow = dbWatermark - maxBurst
          if overflow <= 0 then
            -- We have room in the bucket, process the request immediately and
            -- don't let it defer the next requests.
            timeOfShot = timeNow
          else
            -- Set the time to shoot the CURRENT request.
            timeOfShot = dbTimeOfNextShot
            -- Calculate the time for the NEXT request; it should go after the
            -- current request allocated end time.
            dbTimeOfNextShot = timeOfShot + (1 / qps) * weight
          end

          -- Don't allow the bucket to overflow.
          dbWatermark = math.min(maxBurst, dbWatermark)

          -- Save the state back to the DB for pacing use case or when there
          -- will be no delay returned (i.e. the request won't be rejected in
          -- case of rate limiting use case).
          if saveOnDelay == 1 or timeOfShot <= timeNow then
            redis.call(
              "HMSET", KEY,
              "watermark", tostring(dbWatermark),
              "timeOfLastDrip", tostring(dbTimeOfLastDrip),
              "timeOfNextShot", tostring(dbTimeOfNextShot)
            )
          end

          -- To save memory, expire this key at the moment when we know for sure
          -- that we won't need the data from it anymore.
          local shotIn = dbTimeOfNextShot - timeNow
          local maxBurstDripsIn = maxBurst / (qps * burstAllowanceFactor)
          redis.call(
            "EXPIRE", KEY,
            math.ceil(math.max(shotIn, maxBurstDripsIn) + extraExpire)
          )

          return {
            tostring(timeOfShot),
            tostring(watermark),
            tostring(notice or "")
          }
        `,
      });
  }

  /**
   * Returns the Redis key (aka name) of this pacer.
   */
  get key(): string {
    return this.options.key;
  }

  /**
   * Calling this method signals the pacer that we want to send a request. The
   * method predicts the delay on which the worker needs to await before
   * actually sending the request.
   */
  async pace(
    /** If the request is a batch of sub-operations, and its timing or execution
     * cost depends on the batch size, pass the size of the batch here. */
    weight = 1,
  ): Promise<PacerOutcome> {
    return this.push(weight, true);
  }

  /**
   * Implements rare limiting use case (i.e. on receiver side), when the
   * requests which go out of qps & maxBurst quote are rejected instead of being
   * delayed. For rate limiting, we use the same algorithm which handles bursts
   * in pace() method.
   */
  async rateLimit(
    /** If the request is a batch of sub-operations, and its timing or execution
     * cost depends on the batch size, pass the size of the batch here. */
    weight = 1,
  ): Promise<PacerOutcome> {
    return this.push(weight, false);
  }

  /**
   * @ignore
   * Returns the current timestamp in milliseconds. Useful for mocking in tests.
   */
  now(): number {
    return Date.now();
  }

  /**
   * Builds a namespaced key for the Redis storage.
   */
  private buildNamespacedKey(key: string): string {
    return (
      (this.namespace ? `${this.namespace}:` : "") +
      `${key}#${DB_FORMAT_VERSION}`
    );
  }

  /**
   * Handles both pacing and rate limiting use cases. For rate limiting, we pass
   * saveOnDelay=true flag to denote that the rejected requests (aka
   * requests with nonzero delay returned) should not alter the bucket state in
   * the database (since we reject them, we are not gonna process them, thus,
   * they should not add water to the bucket).
   */
  private async push(
    weight: number,
    saveOnDelay: boolean,
  ): Promise<PacerOutcome> {
    const timeNow = this.now() / 1000;
    const maxBurst = this.options.maxBurst ?? 0;
    const [timeOfShot, watermark, notice] =
      await this.redis.distributedPacerPush(
        this.buildNamespacedKey(this.options.key),
        timeNow,
        weight,
        this.options.qps,
        maxBurst,
        this.options.burstAllowanceFactor ??
          (saveOnDelay ? DEFAULT_PACE_BURST_ALLOWANCE_FACTOR : 1),
        saveOnDelay ? 1 : 0,
        EXTRA_EXPIRE_SEC,
      );
    const delayMs = Math.round(
      Math.max(0, parseFloat(timeOfShot) - timeNow) * 1000,
    );
    return {
      delayMs,
      reason:
        `watermark=${parseFloat(watermark).toFixed(2)}/${maxBurst} + weight=${weight}, delayMs=${delayMs}` +
        (notice ? ` ${notice}` : ""),
    };
  }
}
