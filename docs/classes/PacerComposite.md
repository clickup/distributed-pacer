[@clickup/distributed-pacer](../README.md) / [Exports](../modules.md) / PacerComposite

# Class: PacerComposite

A Pacer which runs all sub-pacers and chooses the largest delay.

## Implements

- [`Pacer`](../interfaces/Pacer.md)

## Constructors

### constructor

• **new PacerComposite**(`pacers`): [`PacerComposite`](PacerComposite.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `pacers` | [`Pacer`](../interfaces/Pacer.md)[] |

#### Returns

[`PacerComposite`](PacerComposite.md)

#### Defined in

[src/PacerComposite.ts:17](https://github.com/clickup/distributed-pacer/blob/master/src/PacerComposite.ts#L17)

## Properties

### key

• `Readonly` **key**: ``""``

Human readable name of the pacer, used when composing multiple pacers.

#### Implementation of

[Pacer](../interfaces/Pacer.md).[key](../interfaces/Pacer.md#key)

#### Defined in

[src/PacerComposite.ts:15](https://github.com/clickup/distributed-pacer/blob/master/src/PacerComposite.ts#L15)

## Methods

### pace

▸ **pace**(`weight?`): `Promise`\<[`PacerCompositeOutcome`](../interfaces/PacerCompositeOutcome.md)\>

Calls pace() on all sub-pacers and chooses the largest delay.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `weight` | `number` | `1` |

#### Returns

`Promise`\<[`PacerCompositeOutcome`](../interfaces/PacerCompositeOutcome.md)\>

#### Implementation of

[Pacer](../interfaces/Pacer.md).[pace](../interfaces/Pacer.md#pace)

#### Defined in

[src/PacerComposite.ts:22](https://github.com/clickup/distributed-pacer/blob/master/src/PacerComposite.ts#L22)

___

### rateLimit

▸ **rateLimit**(`weight?`): `Promise`\<[`PacerCompositeOutcome`](../interfaces/PacerCompositeOutcome.md)\>

Calls rateLimit() on all sub-pacers and chooses the largest delay.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `weight` | `number` | `1` |

#### Returns

`Promise`\<[`PacerCompositeOutcome`](../interfaces/PacerCompositeOutcome.md)\>

#### Implementation of

[Pacer](../interfaces/Pacer.md).[rateLimit](../interfaces/Pacer.md#ratelimit)

#### Defined in

[src/PacerComposite.ts:29](https://github.com/clickup/distributed-pacer/blob/master/src/PacerComposite.ts#L29)
