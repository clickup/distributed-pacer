import sortBy from "lodash/sortBy";
import { ioRedis } from ".";
import { DistributedPacer } from "../DistributedPacer";

let pacer: DistributedPacer;
let now: number;

beforeEach(() => {
  pacer = new DistributedPacer(
    ioRedis,
    { key: "key", qps: 10 },
    `${DistributedPacer.name}.${Date.now()}`,
  );
  now = Date.now();
  jest.spyOn(pacer, "now").mockImplementation(() => now);
});

describe("pace", () => {
  test("no delay when requests are too far away", async () => {
    expect(await pacer.pace()).toMatchObject({ delayMs: 0 });
    now += 1234;
    expect(await pacer.pace()).toMatchObject({ delayMs: 0 });
  });

  test("requests coming quickly are delayed sequentially", async () => {
    expect(await pacer.pace()).toMatchObject({ delayMs: 0 });
    now += 10;
    expect(await pacer.pace()).toMatchObject({ delayMs: 90 });
    now += 10;
    expect(await pacer.pace()).toMatchObject({ delayMs: 180 });
    now += 10;
    expect(await pacer.pace()).toMatchObject({ delayMs: 270 });
    now += 1234;
    expect(await pacer.pace()).toMatchObject({ delayMs: 0 });
  });

  test("simultaneous requests are delayed sequentially", async () => {
    const outcomes = sortBy(
      await Promise.all([pacer.pace(), pacer.pace(), pacer.pace()]),
      (outcome) => outcome.delayMs,
    );
    expect(outcomes).toMatchObject([
      { delayMs: 0 },
      { delayMs: 100 },
      { delayMs: 200 },
    ]);
  });

  test("bursts handling", async () => {
    pacer.options.maxBurst = 2;
    expect(await pacer.pace()).toMatchObject({
      delayMs: 0,
      reason: "watermark=0.00/2 + weight=1, delayMs=0",
    });
    expect(await pacer.pace()).toMatchObject({
      reason: "watermark=1.00/2 + weight=1, delayMs=0",
      delayMs: 0,
    });
    expect(await pacer.pace()).toMatchObject({
      delayMs: 0,
      reason: "watermark=2.00/2 + weight=1, delayMs=0",
    });
    now += 10;
    expect(await pacer.pace()).toMatchObject({ delayMs: 90 });
    now += 10;
    expect(await pacer.pace()).toMatchObject({ delayMs: 180 });
    now += 1234;
    expect(await pacer.pace()).toMatchObject({ delayMs: 0 });
    expect(await pacer.pace()).toMatchObject({ delayMs: 0 });
    expect(await pacer.pace()).toMatchObject({ delayMs: 0 });
  });
});

describe("rateLimit", () => {
  test("no delay when requests are too far away", async () => {
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 0 });
    now += 1234;
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 0 });
  });

  test("requests coming quickly are rejected", async () => {
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 0 });
    now += 10;
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 90 });
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 90 });
    now += 10;
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 80 });
    now += 79;
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 1 });
    now += 2;
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 0 });
  });

  test("no burst allowance", async () => {
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 0 });
    now += 100;
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 0 });
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 100 });
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 100 });
    now += 100;
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 0 });
  });

  test("bursts handling", async () => {
    pacer.options.maxBurst = 2;
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 0 });
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 0 });
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 0 });
    expect(await pacer.rateLimit()).toMatchObject({ delayMs: 100 });
    now += 10;
    expect(await pacer.pace()).toMatchObject({ delayMs: 90 });
    now += 1234;
    expect(await pacer.pace()).toMatchObject({ delayMs: 0 });
  });
});
