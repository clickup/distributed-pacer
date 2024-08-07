@clickup/distributed-pacer / [Exports](modules.md)

# distributed-pacer: A concurrency aware Redis-backed rate limiter with pacing delay prediction and Token Bucket bursts handling

See also [Full API documentation](https://github.com/clickup/distributed-pacer/blob/master/docs/modules.md).

![CI run](https://github.com/clickup/distributed-pacer/actions/workflows/ci.yml/badge.svg?branch=main)

## Pacing

Pacing controls the rate at which concurrent clients perform some operations. It
introduces deliberate delays between client requests. The primary goal of pacing
is to ensure that the rate of operations (such as outgoing requests) does not
exceed a certain threshold (e.g. QPS - "queries per second").

Use Cases:

- **Outgoing Requests.** Pacing is typically used by clients to manage the rate
  at which they send requests to an external service that imposes rate limits.
- **Load Management.** In scenarios where the external service might be
  sensitive to sudden spikes in traffic, pacing helps in distributing the load
  more evenly over time.

Notice that the term "pacing" is typically used for outgoing requests from
clients (to slow down the requests flow without dropping them), whilst "rate
limiting" is for incoming requests on servers (to reject non-conforming
requests).

### Pacing Usage Example

```ts
import { DistributedPacer } from "@clickup/distributed-pacer";
import { Redis } from "ioredis";
import { setTimeout } from "timers/promises";

const myIoRedis = new Redis();

async function mySendApiRequest() {
  // sends an API request somewhere
}

async function myWorkerRunningOnMultipleMachines() {
  while (true) {
    const lightweightPacer = new DistributedPacer(myIoRedis, {
      key: "myKey",
      qps: 10,
      maxBurst: 1, // optional
      burstAllowanceFactor: 0.5, // optional
    });
    const outcome = await lightweightPacer.pace(1 /* weight */);

    console.log(outcome.reason);
    await setTimeout(outcome.delayMs);

    await mySendApiRequest();
  }
}
```

### How it Works

`DistributedPacer` spreads the requests issued by some concurrent workers or
processes uniformly into the future to satisfy the desired downstream QPS
(queries per second) exactly. The implementation is inspired by Leaky Bucket for
Queues algorithm.

The general use case is to introduce some artificial back-pressure when sending
requests to external services, to avoid overloading them, e.g.:

- Pacing outgoing requests to some external API to meet its rate limits.
- Protecting the local database from overloading with concurrent writes done by
  multiple workers.

Imagine we have a time machine, and we can send requests (events) into the exact
provided moment of time in the future. To send a request into the future, the
Lua script in Redis returns that moment's timestamp, and then the worker needs
to call delay() to wake up at that moment. We also store the last moment of the
future to where we sent a previous request, so next requests coming (if they
come too quickly) will be sent further and further away.

Another analogy is booking a meeting in the calendar. When a new request
arrives, it's not executed immediately, but instead scheduled in the calendar
according to the QPS allowance.

Thus, after the returned `delayMs` is awaited, the request will happen in at
least 1/QPS seconds after the previous request; thus, it will satisfy the target
QPS. Also, if there were no requests in the past within 1/QPS seconds from the
present time, then `delayMs` returned will be 0.

### Bursts Allowance

Imagine that each call to `pace(weight)` adds `weight` of water to the bucket of
`maxBurst` volume, and every second, `1/qps*burstAllowanceFactor` of water leaks
out of the bucket at a constant rate (but only when the pacer is idle, i.e.
there are no requests scheduled to the future on top of the bucket). If the
bucket is not yet full (its watermark is below `maxBurst` level), then the
returned `delayMs` will be 0, so the worker can proceed with the request
immediately. Otherwise, pacing will start to happen. I.e. we pace only the
requests which cause the bucket to overflow (Leaky Bucket algorithm).

The default value of `burstAllowanceFactor` is less than 1, which forces the
burst allowance to be earned slightly slower than the target QPS.

## Rate Limiting

Although pacing is the primary use case for this module, it also supports "rate
limiting" mode, where it's expected that requests out of quota will be rejected
(instead of being delayed). This is useful for handling *incoming* requests on
servers (as opposed to pacing, where the requests *originate* from workers).

To use `DistributedPacer` in rate limiting mode, call `rateLimit()` method on
it. Logically, it works exactly the same way as `pace()`, but when it returns a
non-zero `delayMs`, it doesn't alter the state in Redis, assuming that the
request will be rejected and won't contribute to `maxBurst` allowance.

To utilize the power of Leaky Bucket algorithm (or its equivalent here, Token
Bucket), pass a nonzero value to `maxBurst`. With the default value (which is
0), no bursts will be allowed, so the requests will need to come in not less
than `1/qps` seconds in between.

### Rate Limiting Usage Example

Disclaimer: here, we use Express just as an illustration: there is obviously a
ready middleware module for Express rate limiting use case. Use
`DistributedPacer` in other applications, like GraphQL processing, WebSockets,
internal IO services etc.

```ts
import { DistributedPacer } from "@clickup/distributed-pacer";
import { Redis } from "ioredis";
import express from "express";

const myIoRedis = new Redis();

express()
  .get('/', (req, res) => {
    const lightweightPacer = new DistributedPacer(myIoRedis, {
      key: "myKey",
      qps: 10,
      maxBurst: 20,
    });
    const outcome = await lightweightPacer.rateLimit(1 /* weight */);

    if (outcome.delay > 0) {
      console.log(outcome.reason);
      res.status(429).send(`Rate limited, try again in ${outcome.delay} ms.`);
    } else {
      res.send("Hello World!")
    }
  })
  .listen(port);
```

## Performance

This module is cheap and can be put on a critical path in your application.

`DistributedPacer` objects are lightweight, so you can create them as often as
you want (even on every request).

Each call to `pace()` or `rateLimit()` causes one round-trip to Redis (it runs a
custom Lua function), and the timing of that call is O(1).

If you need to use multiple keys, you can use Redis in cluster mode to spread
those keys across multiple Redis nodes (pass an instance of `Redis.Cluster` to
`DistributedPacer` constructor).
