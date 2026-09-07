1. **[P1] Divide the percentage by 100 before applying it — `src/tickets.ts:2`.** The contract supplies a value from 0 to 100, but the expression treats it as a fraction. For 1,000 cents at 20%, it returns −19,000 cents instead of 800; at 1%, it returns zero. This breaks ordinary pricing inputs and can produce negative prices. Change the expression to `Math.round(cents * (1 - percent / 100))`, subject to confirming the rounding rule below.

2. **[P1] Sort a copy to preserve the caller's array — `src/tickets.ts:5`.** `Array.prototype.sort` reorders `items` in place and returns that same array. Calling this with `[200, 100]` changes the caller's sequence to `[100, 200]`, directly violating the explicit ownership contract and potentially changing other displays or processing that share it. Use `[...items].sort((a, b) => a.cents - b.cents)`. A shallow array copy is enough to prevent this sort from reordering the original; it does not promise independent item objects.

Questions to resolve from the surrounding contract, not assumed defects:

- What rounding rule applies to fractional-cent discount results? Whole-cent output does not specify nearest versus floor/ceiling or tie handling.
- Are nonfinite numbers, negative prices, fractional percentages and values outside 0–100 rejected by callers or by these functions? The diff does not establish validation responsibility.
- What maximum cents value is supported? JavaScript number precision may matter at large values, but no such input range is supplied.
- Are returned objects intended to be shared with the input, or does the API promise a deep copy? Only preservation of the original array is stated.

Focused verification plan:

- Discount boundaries: `discountedCents(1000, 0) === 1000`, `(1000, 100) === 0`, `(1000, 20) === 800`, `(1000, 1) === 990`, and zero cents at valid discounts remains zero.
- Add fractional-cent cases after agreeing the rounding rule; for nearest-cent rounding, `(101, 50) === 51`.
- For `[a:{cents:200}, b:{cents:100}]`, assert ascending result `[b,a]`, original order still `[a,b]`, and result array is a different reference. Repeat with a frozen input array to expose accidental mutation.
- Cover empty, single-item and equal-price arrays. Check any explicit tie-order requirement if one exists.
- Run the repository's existing type check and tests, then examine call sites for discount validation, pricing expectations and array ownership. No tests or call-site inspection were performed from this supplied diff; no security exploit or actual data loss is established.
