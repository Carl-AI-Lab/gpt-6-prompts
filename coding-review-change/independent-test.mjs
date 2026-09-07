import assert from 'node:assert/strict';
import fs from 'node:fs';
const beforeDiscount=(cents,percent)=>Math.round(cents*(1-percent));
const afterDiscount=(cents,percent)=>Math.round(cents*(1-percent/100));
const beforeSort=items=>items.sort((a,b)=>a.cents-b.cents);
const afterSort=items=>[...items].sort((a,b)=>a.cents-b.cents);
const failures=[];
try{assert.equal(beforeDiscount(1000,20),800)}catch{failures.push('Percentage result -19000 instead of 800')}
const input=[{name:'Bo',cents:900},{name:'Ada',cents:400}];beforeSort(input);
try{assert.equal(input[0].name,'Bo')}catch{failures.push('Caller order mutated from Bo,Ada to Ada,Bo')}
assert.equal(failures.length,2);
for(const [c,p,want] of [[1000,0,1000],[1000,100,0],[1000,20,800],[1000,1,990],[0,20,0],[101,50,51]])assert.equal(afterDiscount(c,p),want);
const frozen=Object.freeze([{name:'Bo',cents:900},{name:'Ada',cents:400}]);const sorted=afterSort(frozen);assert.deepEqual(sorted.map(x=>x.name),['Ada','Bo']);assert.deepEqual(frozen.map(x=>x.name),['Bo','Ada']);assert.notEqual(sorted,frozen);assert.deepEqual(afterSort([]),[]);
const result={ranAt:new Date().toISOString(),seededDefects:2,reproduced:failures,afterFix:'all discount boundaries and immutable sorting assertions passed',passed:true};
fs.writeFileSync(new URL('./independent-test.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
