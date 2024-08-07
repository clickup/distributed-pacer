[@clickup/distributed-pacer](../README.md) / [Exports](../modules.md) / DistributedPacerOptions

# Interface: DistributedPacerOptions

Options which identify each lightweight pacer instance.

## Properties

### key

• **key**: `string`

Redis key for the pacer.

#### Defined in

[src/DistributedPacer.ts:23](https://github.com/clickup/distributed-pacer/blob/master/src/DistributedPacer.ts#L23)

___

### qps

• **qps**: `number`

Target maximum allowed QPS.

#### Defined in

[src/DistributedPacer.ts:25](https://github.com/clickup/distributed-pacer/blob/master/src/DistributedPacer.ts#L25)

___

### maxBurst

• `Optional` **maxBurst**: `number`

How much accumulated weight of the requests is allowed on top of an idle
pacer before turning on pacing.

#### Defined in

[src/DistributedPacer.ts:28](https://github.com/clickup/distributed-pacer/blob/master/src/DistributedPacer.ts#L28)

___

### burstAllowanceFactor

• `Optional` **burstAllowanceFactor**: `number`

At what factor of QPS do we earn back burst allowance. This makes sense
for pacing use case; for rate limiting, the common value passed here is 1,
since we start rejecting requests after the bucket is full and do not queue
them above the bucket.

#### Defined in

[src/DistributedPacer.ts:33](https://github.com/clickup/distributed-pacer/blob/master/src/DistributedPacer.ts#L33)
