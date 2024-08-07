[@clickup/distributed-pacer](../README.md) / [Exports](../modules.md) / Pacer

# Interface: Pacer

An interface representing distributed pacing and rate limiting algorithms.

## Implemented by

- [`DistributedPacer`](../classes/DistributedPacer.md)
- [`PacerComposite`](../classes/PacerComposite.md)

## Properties

### key

• `Readonly` **key**: `string`

Human readable name of the pacer, used when composing multiple pacers.

#### Defined in

[src/Pacer.ts:6](https://github.com/clickup/distributed-pacer/blob/master/src/Pacer.ts#L6)

## Methods

### pace

▸ **pace**(`weight?`): `Promise`\<[`PacerOutcome`](PacerOutcome.md)\>

Calling this method signals the pacer that we want to send a request. The
method predicts the delay on which the worker needs to await before
actually sending the request.

#### Parameters

| Name | Type |
| :------ | :------ |
| `weight?` | `number` |

#### Returns

`Promise`\<[`PacerOutcome`](PacerOutcome.md)\>

#### Defined in

[src/Pacer.ts:13](https://github.com/clickup/distributed-pacer/blob/master/src/Pacer.ts#L13)

___

### rateLimit

▸ **rateLimit**(`weight?`): `Promise`\<[`PacerOutcome`](PacerOutcome.md)\>

Implements rare limiting use case (i.e. on receiver side), when the
requests which go out of qps & maxBurst quote are rejected instead of being
delayed. For rate limiting, we use the same algorithm which handles bursts
in pace() method.

#### Parameters

| Name | Type |
| :------ | :------ |
| `weight?` | `number` |

#### Returns

`Promise`\<[`PacerOutcome`](PacerOutcome.md)\>

#### Defined in

[src/Pacer.ts:21](https://github.com/clickup/distributed-pacer/blob/master/src/Pacer.ts#L21)
