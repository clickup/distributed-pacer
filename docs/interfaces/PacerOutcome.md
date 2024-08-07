[@clickup/distributed-pacer](../README.md) / [Exports](../modules.md) / PacerOutcome

# Interface: PacerOutcome

A result of the pace() or rateLimit() work.

## Hierarchy

- **`PacerOutcome`**

  ↳ [`PacerCompositeOutcome`](PacerCompositeOutcome.md)

## Properties

### delayMs

• **delayMs**: `number`

For pacing use case, how much time a worker needs to wait before sending
the request. For rate limiting use case, when can the client retry the
request and expect it not being rate limited.

#### Defined in

[src/Pacer.ts:31](https://github.com/clickup/distributed-pacer/blob/master/src/Pacer.ts#L31)

___

### reason

• **reason**: `string`

Debug information about why that `delayMs` value was returned.

#### Defined in

[src/Pacer.ts:33](https://github.com/clickup/distributed-pacer/blob/master/src/Pacer.ts#L33)
