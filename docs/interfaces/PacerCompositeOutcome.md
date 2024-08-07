[@clickup/distributed-pacer](../README.md) / [Exports](../modules.md) / PacerCompositeOutcome

# Interface: PacerCompositeOutcome

A result of the PacerComposite's pace() or rateLimit() work.

## Hierarchy

- [`PacerOutcome`](PacerOutcome.md)

  ↳ **`PacerCompositeOutcome`**

## Properties

### delayMs

• **delayMs**: `number`

For pacing use case, how much time a worker needs to wait before sending
the request. For rate limiting use case, when can the client retry the
request and expect it not being rate limited.

#### Inherited from

[PacerOutcome](PacerOutcome.md).[delayMs](PacerOutcome.md#delayms)

#### Defined in

[src/Pacer.ts:31](https://github.com/clickup/distributed-pacer/blob/master/src/Pacer.ts#L31)

___

### reason

• **reason**: `string`

Debug information about why that `delayMs` value was returned.

#### Inherited from

[PacerOutcome](PacerOutcome.md).[reason](PacerOutcome.md#reason)

#### Defined in

[src/Pacer.ts:33](https://github.com/clickup/distributed-pacer/blob/master/src/Pacer.ts#L33)

___

### pacer

• **pacer**: ``null`` \| [`Pacer`](Pacer.md)

#### Defined in

[src/PacerComposite.ts:8](https://github.com/clickup/distributed-pacer/blob/master/src/PacerComposite.ts#L8)
