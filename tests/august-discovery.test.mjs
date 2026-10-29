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

// The same ranking must support one inspiration or every inspiration, not
// just the previous exactly-five contract. An empty set is safe to render.
for(let count=0;count<=people.length;count++){
  const options=rank(people.slice(0,count).map(p=>p.id));
  assert.equal(options.length,6);
  assert.equal(options[1].name,'Street handstyle');
  assert.equal(options[3].name,'Fine & flowing');
  assert.ok(options.every(t=>Number.isFinite(t.score)));
}
for(const person of people)assert.equal(rank([person.id]).length,6);

function sourceBetween(first,last){
  const from=studio.indexOf(first),to=studio.indexOf(last,from);
  assert.ok(from>=0&&to>from,`production section exists: ${first}`);
  return studio.slice(from,to);
}

const gateContext=vm.createContext({peoplePicks:[],tastePicks:[],favorites:[],reviews:{}});
vm.runInContext(sourceBetween('  function stageReady(stage)', '  function updateStageNavigation()')+'\nthis.ready=stageReady;',gateContext);
for(const peopleCount of [0,1,5,17])for(const tasteCount of [0,1,3,6])for(const favoriteCount of [0,1,6,20]){
  gateContext.peoplePicks=Array.from({length:peopleCount},(_,i)=>i);
  gateContext.tastePicks=Array.from({length:tasteCount},(_,i)=>i);
  gateContext.favorites=Array.from({length:favoriteCount},(_,i)=>i);
  gateContext.reviews={};
  assert.equal(gateContext.ready('people'),true);
  assert.equal(gateContext.ready('style-discovery'),peopleCount>0);
  assert.equal(gateContext.ready('collection'),peopleCount>0,'styles are optional');
  assert.equal(gateContext.ready('review'),peopleCount>0&&favoriteCount>0);
  assert.equal(gateContext.ready('practice'),false,'an approval is still required');
  gateContext.reviews={0:{approved:true}};
  assert.equal(gateContext.ready('practice'),peopleCount>0&&favoriteCount>0);
}

const restored=vm.createContext({
  saved:{favorites:[...Array.from({length:20},(_,i)=>i),0,-1,20],people:[...people.map(p=>p.id),'invalid'],tastes:[0,1,2,3,4,5,5,6]},
  validId:id=>Number.isInteger(id)&&id>=0&&id<20,people
});
const declarations=studio.split('\n').filter(line=>/^  const (favorites =|peoplePicks =|peopleBasis =|tastePicks =)/.test(line));
vm.runInContext(declarations.slice(0,3).join('\n')+'\nsaved.tasteBasis=peopleBasis();\n'+declarations[3]+'\nthis.restored={favorites,peoplePicks,tastePicks};',restored);
assert.equal(restored.restored.favorites.length,20,'all valid saved favorites survive reload');
assert.equal(restored.restored.peoplePicks.length,17);
assert.equal(restored.restored.tastePicks.length,6);

const toggleContext=vm.createContext({
  favorites:[],peoplePicks:[],tastePicks:[],people,designs:Array.from({length:20},(_,id)=>({name:`Design ${id}`})),filter:'all',tastes:[],
  announce:()=>{},persist:()=>{},renderFavorites:()=>{},renderGallery:()=>{},renderPeople:()=>{},renderTastes:()=>{},buildTasteOptions:()=>[],
  document:{querySelector:()=>({focus:()=>{}})},
  $:()=>({addEventListener:(_event,callback)=>{toggleContext.styleClick=callback;}})
});
vm.runInContext(sourceBetween('  function toggleFavorite(id)', '  function draftKey()')+sourceBetween('  function togglePerson(id)', '  function renderTastes()')+studio.split('\n').find(line=>line.startsWith("  $('taste-grid').addEventListener"))+'\nthis.toggleFavorite=toggleFavorite;this.togglePerson=togglePerson;',toggleContext);
for(let id=0;id<20;id++)toggleContext.toggleFavorite(id);
for(const person of people)toggleContext.togglePerson(person.id);
for(let id=0;id<6;id++)toggleContext.styleClick({target:{closest:()=>({dataset:{taste:String(id)}})}});
assert.equal(toggleContext.favorites.length,20,'no five-favorite ceiling');
assert.equal(toggleContext.peoplePicks.length,17,'no five-person ceiling');
assert.equal(toggleContext.tastePicks.length,6,'no three-style ceiling');
toggleContext.toggleFavorite(0);toggleContext.togglePerson(people[0].id);
assert.equal(toggleContext.favorites.length,19);
assert.equal(toggleContext.peoplePicks.length,16);
assert.equal(toggleContext.tastePicks.length,0,'changed inspiration refreshes style choices');

const gallery=sourceBetween('  function renderGallery()', '  function toggleFavorite(id)');
const galleryClick=sourceBetween("  $('style-grid').addEventListener", "  $('favorite-slots').addEventListener");
assert.doesNotMatch(gallery,/data-practice=/,'all three card controls select, rather than opening');
assert.doesNotMatch(galleryClick,/openReview/,'gallery clicks never navigate into editing');
assert.match(galleryClick,/toggleFavorite/);
assert.match(studio,/Your inspiration picks include/);
assert.match(studio,/Your \$\{picks.length===1\?'pick has':'picks include'\}/);
console.log('PASS: 64 stage-gate combinations; optional zero-style continuation; 17 inspiration / 6 style / 20 signature picks; reload validation; selection-only gallery; detail coaching.');
