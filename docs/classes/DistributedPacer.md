[@clickup/distributed-pacer](../README.md) / [Exports](../modules.md) / DistributedPacer

# Class: DistributedPacer

A lightweight class which wraps a Redis client and implements distributed
pacing algorithm on top of it.

## Implements

- [`Pacer`](../interfaces/Pacer.md)

## Constructors

### constructor

• **new DistributedPacer**(`redis`, `options`, `namespace?`): [`DistributedPacer`](DistributedPacer.md)

Initializes a pacer instance. You can create instances of this class as
often as you want.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `redis` | `Redis` \| `Cluster` | Redis client instance (connection) to use. |
| `options` | [`DistributedPacerOptions`](../interfaces/DistributedPacerOptions.md) | Configuration options. |
| `namespace?` | `string` | Namespace to prepend all the keys with. |

#### Returns

[`DistributedPacer`](DistributedPacer.md)

#### Defined in

[src/DistributedPacer.ts:64](https://github.com/clickup/distributed-pacer/blob/master/src/DistributedPacer.ts#L64)

## Properties

### options

• `Readonly` **options**: [`DistributedPacerOptions`](../interfaces/DistributedPacerOptions.md)

Configuration options.

#### Defined in

[src/DistributedPacer.ts:68](https://github.com/clickup/distributed-pacer/blob/master/src/DistributedPacer.ts#L68)

___

### namespace

• `Optional` `Readonly` **namespace**: `string`

Namespace to prepend all the keys with.

#### Defined in

[src/DistributedPacer.ts:70](https://github.com/clickup/distributed-pacer/blob/master/src/DistributedPacer.ts#L70)

## Accessors

### key

• `get` **key**(): `string`

Returns the Redis key (aka name) of this pacer.

#### Returns

`string`

#### Implementation of

[Pacer](../interfaces/Pacer.md).[key](../interfaces/Pacer.md#key)

#### Defined in

[src/DistributedPacer.ts:156](https://github.com/clickup/distributed-pacer/blob/master/src/DistributedPacer.ts#L156)

## Methods

### pace

▸ **pace**(`weight?`): `Promise`\<[`PacerOutcome`](../interfaces/PacerOutcome.md)\>

Calling this method signals the pacer that we want to send a request. The
method predicts the delay on which the worker needs to await before
actually sending the request.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `weight` | `number` | `1` | If the request is a batch of sub-operations, and its timing or execution cost depends on the batch size, pass the size of the batch here. |

#### Returns

`Promise`\<[`PacerOutcome`](../interfaces/PacerOutcome.md)\>

#### Implementation of

[Pacer](../interfaces/Pacer.md).[pace](../interfaces/Pacer.md#pace)

#### Defined in

[src/DistributedPacer.ts:165](https://github.com/clickup/distributed-pacer/blob/master/src/DistributedPacer.ts#L165)

___

### rateLimit

▸ **rateLimit**(`weight?`): `Promise`\<[`PacerOutcome`](../interfaces/PacerOutcome.md)\>

Implements rare limiting use case (i.e. on receiver side), when the
requests which go out of qps & maxBurst quote are rejected instead of being
delayed. For rate limiting, we use the same algorithm which handles bursts
in pace() method.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `weight` | `number` | `1` | If the request is a batch of sub-operations, and its timing or execution cost depends on the batch size, pass the size of the batch here. |

#### Returns

`Promise`\<[`PacerOutcome`](../interfaces/PacerOutcome.md)\>

#### Implementation of

[Pacer](../interfaces/Pacer.md).[rateLimit](../interfaces/Pacer.md#ratelimit)

#### Defined in

[src/DistributedPacer.ts:179](https://github.com/clickup/distributed-pacer/blob/master/src/DistributedPacer.ts#L179)
