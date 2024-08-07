import type { PacerOutcome, Pacer } from "../Pacer";
import { PacerComposite } from "../PacerComposite";

class PacerMock implements Pacer {
  constructor(
    readonly key: string,
    private delayMs: number,
  ) {}

  async pace(): Promise<PacerOutcome> {
    return { delayMs: this.delayMs, reason: `because: ${this.key}` };
  }

  async rateLimit(): Promise<PacerOutcome> {
    return { delayMs: this.delayMs, reason: `because: ${this.key}` };
  }
}

test("chooses outcome with largest delay", async () => {
  const pacers = [
    new PacerMock("a", 100),
    new PacerMock("b", 300),
    new PacerMock("c", 200),
  ];
  const pacerComposite = new PacerComposite(pacers);
  expect(await pacerComposite.pace()).toEqual({
    delayMs: 300,
    reason: "PacerMock b\nbecause: b",
    pacer: pacers[1],
  });
  expect(await pacerComposite.rateLimit()).toEqual({
    delayMs: 300,
    reason: "PacerMock b\nbecause: b",
    pacer: pacers[1],
  });
});

test("works when no pacers returned nonzero delay", async () => {
  const pacers = [
    new PacerMock("a", 0),
    new PacerMock("b", 0),
    new PacerMock("c", 0),
  ];
  const pacerComposite = new PacerComposite(pacers);
  expect(await pacerComposite.pace()).toEqual({
    delayMs: 0,
    reason: "no delay",
    pacer: null,
  });
  expect(await pacerComposite.rateLimit()).toEqual({
    delayMs: 0,
    reason: "no delay",
    pacer: null,
  });
});

test("works with empty list of pacers", async () => {
  const pacerComposite = new PacerComposite([]);
  expect(await pacerComposite.pace()).toEqual({
    delayMs: 0,
    reason: "no pacers",
    pacer: null,
  });
  expect(await pacerComposite.rateLimit()).toEqual({
    delayMs: 0,
    reason: "no pacers",
    pacer: null,
  });
});
