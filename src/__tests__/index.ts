import { Redis, type RedisOptions } from "ioredis";

const redisOptions: RedisOptions = {
  host:
    process.env["REDISCLI_HOST"] ||
    process.env["REDIS_WORKER_HOST"] ||
    "127.0.0.1",
  port:
    parseInt(
      process.env["REDISCLI_PORT"] || process.env["REDIS_WORKER_PORT"] || "0",
    ) || undefined,
  password:
    process.env["REDISCLI_AUTH"] ||
    process.env["REDIS_WORKER_PASS"] ||
    undefined,
  keyPrefix: "test:", // do NOT make it dynamic: it is also used in a worker thread
};

export const ioRedis = redisOptions.password?.startsWith("cluster")
  ? new Redis.Cluster([{ host: redisOptions.host, port: redisOptions.port }], {
      redisOptions,
      slotsRefreshTimeout: 10000,
    })
  : new Redis(redisOptions);
