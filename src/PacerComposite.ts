import maxBy from "lodash/maxBy";
import type { Pacer, PacerOutcome } from "./Pacer";

/**
 * A result of the PacerComposite's pace() or rateLimit() work.
 */
export interface PacerCompositeOutcome extends PacerOutcome {
  pacer: Pacer | null;
}

/**
 * A Pacer which runs all sub-pacers and chooses the largest delay.
 */
export class PacerComposite implements Pacer {
  readonly key = "";

  constructor(private pacers: Pacer[]) {}

  /**
   * Calls pace() on all sub-pacers and chooses the largest delay.
   */
  async pace(weight: number = 1): Promise<PacerCompositeOutcome> {
    return this.call("pace", weight);
  }

  /**
   * Calls rateLimit() on all sub-pacers and chooses the largest delay.
   */
  async rateLimit(weight: number = 1): Promise<PacerCompositeOutcome> {
    return this.call("rateLimit", weight);
  }

  private async call(
    method: "pace" | "rateLimit",
    weight: number = 1,
  ): Promise<PacerCompositeOutcome> {
    const outcomes = await Promise["all"](
      this.pacers.map(async (pacer) => ({
        ...(await pacer[method](weight)),
        pacer,
      })),
    );
    const outcome = maxBy(outcomes, ({ delayMs }) => delayMs);
    return outcome && outcome.delayMs > 0
      ? {
          ...outcome,
          reason: outcome.pacer.key
            ? `${outcome.pacer.constructor.name} ${outcome.pacer.key}\n${outcome.reason}`
            : outcome.reason,
        }
      : {
          delayMs: 0,
          reason: outcome ? "no delay" : "no pacers",
          pacer: null,
        };
  }
}
