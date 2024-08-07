/**
 * An interface representing distributed pacing and rate limiting algorithms.
 */
export interface Pacer {
  /** Human readable name of the pacer, used when composing multiple pacers. */
  readonly key: string;

  /**
   * Calling this method signals the pacer that we want to send a request. The
   * method predicts the delay on which the worker needs to await before
   * actually sending the request.
   */
  pace(weight?: number): Promise<PacerOutcome>;

  /**
   * Implements rare limiting use case (i.e. on receiver side), when the
   * requests which go out of qps & maxBurst quote are rejected instead of being
   * delayed. For rate limiting, we use the same algorithm which handles bursts
   * in pace() method.
   */
  rateLimit(weight?: number): Promise<PacerOutcome>;
}

/**
 * A result of the pace() or rateLimit() work.
 */
export interface PacerOutcome {
  /** For pacing use case, how much time a worker needs to wait before sending
   * the request. For rate limiting use case, when can the client retry the
   * request and expect it not being rate limited. */
  delayMs: number;
  /** Debug information about why that `delayMs` value was returned. */
  reason: string;
}
