import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const data=readFileSync(new URL('../augustsignature/autographs.js',import.meta.url),'utf8');
const studio=readFileSync(new URL('../augustsignature/studio.js',import.meta.url),'utf8');
const context=vm.createContext({window:{},peoplePicks:[]});
vm.runInContext(data,context);
context.people=context.window.augustAutographs;
// Exercise the exact pure ranking code used by the browser, without a DOM.
const start=studio.indexOf('  const tastePool = [');
const end=studio.indexOf('  let tastes = buildTasteOptions();',start);
assert.ok(start>0&&end>start,'ranking code is present');
vm.runInContext(studio.slice(start,end)+'\nthis.rank=buildTasteOptions;',context);
const people=context.people;
assert.equal(people.length,17);
assert.equal(new Set(people.map(p=>p.id)).size,17);
assert.equal(people[1].kind,'study','street study is visible in the initial options');
for(const person of people){
  assert.ok(person.image.startsWith('https://')||person.kind==='study');
  assert.ok(person.source?.startsWith('https://')||person.kind==='study');
  assert.equal(person.features.length,3);
  assert.doesNotMatch(person.image,/logo/i);
}
function rank(ids){context.peoplePicks=ids;return context.rank();}
const sharp=rank(['curry','joji','hayley','lebron','ronaldo']);
const looping=rank(['damon','billie','harry','lana','olivia']);
assert.notDeepEqual(Array.from(sharp,t=>t.id),Array.from(looping,t=>t.id));
assert.equal(sharp[0].name,'Sharp & fast');
assert.equal(looping[0].name,'Soft & looping');
let combinations=0;
const differentDirections=new Set();
function chooseFive(from=0,picked=[]){
  if(picked.length===5){
    const ids=picked.map(i=>people[i].id),options=rank(ids);
    assert.equal(options.length,6);
    assert.equal(new Set(options.map(t=>t.id)).size,6);
    assert.equal(options[1].name,'Street handstyle','street edge is always near the start');
    assert.equal(options[3].name,'Fine & flowing','flow remains available for angular preferences');
    assert.equal(options.filter(t=>t.contrast).length,2);
    for(const option of options){
      assert.ok(Number.isFinite(option.score));
      assert.ok(option.path&&option.families.length);
      assert.ok(option.contrast?option.basis.startsWith('Outside your picks'):picked.some(i=>option.basis.includes(people[i].name))||option.basis==='Another direction to explore','matches have provenance and contrasts are honestly labeled');
    }
    differentDirections.add(options.map(t=>t.id).join(','));combinations++;return;
  }
  for(let i=from;i<=people.length-(5-picked.length);i++)chooseFive(i+1,[...picked,i]);
}
chooseFive();
assert.equal(combinations,6188);
assert.ok(differentDirections.size>30,'selection produces genuinely different option sets');
console.log(`PASS: ${combinations} five-mark combinations; ${differentDirections.size} tailored sequences; street and flowing contrasts guaranteed; 16 sourced autographs and one original study.`);
