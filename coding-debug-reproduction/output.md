## Symptom and expected behavior

Reported symptom: during one browser session, requesting ascending prices in one view changes `original.map(x => x.name)` from `Bo,Ada` to `Ada,Bo`. The signup-order view should continue showing `Bo,Ada`; the price view should show `Ada,Bo`.

This points toward mutation or replacement of shared ordering, but the helper implementation is unavailable. No cause or fix is confirmed.

## Competing hypotheses and discriminating checks

| Hypothesis | Cheapest discriminating check | Evidence that distinguishes it |
|---|---|---|
| The helper sorts its argument in place. | Call the real helper once, outside either component; snapshot input order immediately before and after. | Input order changes synchronously in the helper-only test. |
| The helper is pure, but the price component sorts or assigns the shared list afterward. | Compare helper-only behavior with the component handler; snapshot before helper, after helper, and after state update. | Input stays unchanged after helper but shared ordering changes later. |
| A subscriber, computed value, or effect reacts to the price request and changes shared state. | Timestamp state writes and effect entry/exit around one request. | Ordering changes in a later callback, rather than in the helper call. |
| The two views read an alias or the wrong selector rather than independent ordering projections. | Record reference equality between original, store list, helper result, and each view's selected list. | Both views select the same sorted result; raw original may or may not change. |
| The apparent change is a browser console live-object display artifact. | Log serialized scalar snapshots, not expandable array references. | Captured strings stay `Bo,Ada` even though an expanded old array appears sorted. This would not explain a genuinely captured changed string. |
| A separate data refresh changes order without reloading the page. | Record network activity and store-write origin for one price request. | A response or unrelated store write precedes the changed order. No reload alone does not exclude this. |

## Ordered checks and required logs

1. Begin with a fresh two-record fixture. Capture `JSON.stringify(original)` and `original.map(x => x.name).join(',')` before the price request.
2. Invoke the actual sorting helper directly on that fixture. Capture both input and output immediately afterward and record `result === original`. Equal references alone do not prove mutation; changed input order does.
3. If helper-only behavior does not reproduce the issue, repeat through the price component handler and instrument state writes, subscribers, and both view selectors. Record a sequence number, `performance.now()`, operation label, names, cents, reference-equality booleans, and write origin. Snapshot immediately after the handler and after the next render.
4. If ordering changes outside the synchronous call, inspect the corresponding callback or network response. If raw data remains correct but rendered order is wrong, reduce to the two selectors/components and inspect their actual selected lists and rendered names.

Use synthetic records only. Serialized snapshots avoid console reference ambiguity.

## Minimal reproduction

This runnable baseline reproduces the reported behavior with native `sort`; it is a diagnostic comparison, not evidence that the missing helper uses this implementation. TypeScript accepts this JavaScript-compatible snippet, which also runs directly in a browser console:

```ts
const original = [
  { name: "Bo", cents: 900 },
  { name: "Ada", cents: 400 },
];
const before = original.map(x => x.name).join(",");
const prices = original.sort((a, b) => a.cents - b.cents);
const after = original.map(x => x.name).join(",");
console.log(JSON.stringify({
  before,
  after,
  priceOrder: prices.map(x => x.name).join(","),
  sameReference: prices === original,
}));
if (after !== "Bo,Ada") {
  throw new Error(`Signup order changed: expected Bo,Ada; got ${after}`);
}
```

Expected baseline observation: `before` is `Bo,Ada`, `after` and `priceOrder` are `Ada,Bo`, and the assertion throws. I have not executed this snippet here.

For the project reproduction, replace only the native-sort expression with the real helper invocation using its actual signature. Keep the fixture, snapshots, and assertion. If that passes, add the real price-request handler, then the store/subscriber path, then both components until the assertion or rendered-order check fails.

## Evidence needed before a fix

The helper source and signature; the shared-array/store declaration; both selectors and relevant event handlers; captured before/after snapshots; the first operation that changes order; and a failing reproduction using the real project path. Stop at diagnosis until that path is isolated.
