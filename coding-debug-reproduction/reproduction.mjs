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
