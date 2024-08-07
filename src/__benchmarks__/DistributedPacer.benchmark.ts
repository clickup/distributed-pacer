import { setTimeout } from "timers/promises";
import { inspect } from "util";
import compact from "lodash/compact";
import random from "lodash/random";
import range from "lodash/range";
import round from "lodash/round";
import { ioRedis } from "../__tests__";
import { DistributedPacer } from "../DistributedPacer";

async function main(): Promise<void> {
  const namespace = `${DistributedPacer.name}.${Date.now()}`;
  const timeStart = Date.now();

  let qpsStart = Date.now();
  let qpsCount = 0;
  let qps: number | null = null;

  const outcomes = [];
  await Promise.all(
    range(10).map(async (worker) => {
      for (let i = 1; i <= 100000; i++) {
        const reqPacer = new DistributedPacer(
          ioRedis,
          { key: "high-cardinality", qps: 10, maxBurst: 4 },
          namespace,
        );

        const weight = random(1, 2);
        const outcome = await reqPacer.pace(weight);
        outcomes.push(outcome);

        await setTimeout(outcome.delayMs);

        process.stdout.write(
          compact([
            `w${worker.toString().padStart(2, "0")}`,
            `ms${Math.round(Date.now() - timeStart)}`,
            `req${outcomes.length})`,
            outcome.reason.replace(/\s+/g, " "),
            qps !== null &&
              `(wanted QPS: ${reqPacer.options.qps}, actual QPS: ${qps})`,
          ]).join(" ") + "\n",
        );

        qpsCount += weight;
        if (Date.now() - qpsStart >= 2000) {
          qps = round((qpsCount / (Date.now() - qpsStart)) * 1000, 1);
          qpsCount = 0;
          qpsStart = Date.now();
        }

        if (outcomes.length % 100 === 0) {
          process.stdout.write(
            `w${worker.toString().padStart(2, "0")}) sleeping for a bit...\n`,
          );
          await setTimeout(2000);
          qps = null;
          qpsCount = 0;
          qpsStart = Date.now();
        }
      }
    }),
  );
}

main().catch((e) => process.stdout.write(inspect(e)));
