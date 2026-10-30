import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const studio=read('../augustsignature/studio.js'), lessonSource=read('../augustsignature/lessons.js');
const html=read('../augustsignature/index.html');
function section(from,to){const start=studio.indexOf(from),end=studio.indexOf(to,start);assert.ok(start>=0&&end>start);return studio.slice(start,end);}
const nodes=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',hidden:false,style:{},attributes:{},classList:{toggle(){},remove(){}},getAttribute(key){return this.attributes[key]},setAttribute(key,value){this.attributes[key]=value}});return nodes.get(id);}
const context=vm.createContext({window:{},$:node,artSerial:0,artworkReady:true,customArtwork:new Map(),reviews:{},state:{},selected:0,paperMode:false,freeMode:false});
vm.runInContext(lessonSource,context);
vm.runInContext(section('  const families =','  const $ =')+'\nthis.allDesigns=designs;this.base=steps;',context);
vm.runInContext(section('  function art(design,','  function renderFavorites()')+section('  function warmupDemonstration()','  function renderLesson()'),context);
const api=context.window.augustSignatureLessons, designs=context.allDesigns, base=context.base;
assert.equal(designs.length,20);
for(const design of designs){
  const plan=api.planFor(design,base);
  assert.equal(plan.length,7);
  assert.deepEqual(Array.from(plan,s=>s.goal),Array.from(base,s=>s.goal),'saved repetition targets remain compatible');
  assert.match(plan[0].instruction,/not part of your signature/);
  assert.doesNotMatch(plan[3].instruction,/low curve|tall loop/);
  for(const index of [1,2]){
    const crop=api.focusCrop(design,index),[x,y,w,h]=design.crop;
    assert.equal(crop.length,4);
    assert.ok(crop.every(Number.isFinite));
    assert.ok(crop[0]>=x&&crop[1]>=y&&crop[2]>0&&crop[3]>0);
    assert.ok(crop[0]+crop[2]<=x+w+.01&&crop[1]+crop[3]<=y+h+.01,'focus crop stays in this one signature, never neighboring rows');
  }
  context.selected=design.id;context.state[design.id]={step:0,counts:Array(7).fill(0)};
  context.updateGuides();
  assert.match(node('guide-layer').innerHTML,/Optional loose-loop warm-up/);
  assert.equal(node('skip-warmup').hidden,false);
  for(let step=1;step<=4;step++){
    context.state[design.id].step=step;context.updateGuides();
    const guide=node('guide-layer').innerHTML;
    assert.ok(guide.includes(`href="${design.asset}"`),'the guide uses exactly the selected artwork asset');
    assert.doesNotMatch(guide,/demo-path|<path /,'no generic letter or connection is substituted');
    const crop=api.focusCrop(design,step)||design.crop;
    assert.ok(guide.includes(`viewBox="${crop.join(' ')}"`));
    assert.equal(node('skip-warmup').hidden,true);
    assert.equal(node('reference-art').innerHTML,guide,'paper and screen use the same exact guide');
  }
  assert.equal(api.focusCrop(design,3),null,'the together step shows the real whole signature');
  assert.equal(api.focusBoxes(design,3).length,2);
  if(design.text==='AF'){
    assert.match(plan[3].instruction,/A, then F/);
    assert.match(api.explanation(design,3),/A \+ F/);
  }
  // New AI artwork is not automatically assigned old letter coordinates.
  context.reviews[design.id]={useCustom:true};context.customArtwork.set(design.id,'blob:test-revision');
  for(let step=1;step<=4;step++){
    assert.equal(api.focusCrop(design,step,true),null);
    context.state[design.id].step=step;context.updateGuides();
    assert.match(node('guide-layer').innerHTML,/src="blob:test-revision"/);
    assert.doesNotMatch(node('guide-layer').innerHTML,/assets\/|<path |viewBox=/);
    assert.match(node('lesson-map-caption').textContent,/No automatic letter crop or verified pen order/);
  }
  context.state[design.id].step=6;node('hint-button').setAttribute('aria-expanded','false');context.updateGuides();
  assert.equal(node('guide-layer').innerHTML,'');assert.equal(node('selected-art').style.visibility,'hidden');
  assert.equal(node('reference-strip').hidden,true);assert.equal(node('lesson-map').innerHTML,'');
  node('hint-button').setAttribute('aria-expanded','true');context.updateGuides();
  assert.equal(node('reference-strip').hidden,false);assert.equal(node('selected-art').style.visibility,'visible');
  context.customArtwork.delete(design.id);context.state[design.id].step=3;context.updateGuides();
  assert.match(node('guide-layer').innerHTML,/unavailable here/,'missing revised art must not masquerade as its original');
  assert.doesNotMatch(node('guide-layer').innerHTML,/assets\//);
  delete context.reviews[design.id];
}
const counts=[0,...base.slice(1).map(s=>s.goal)],before=JSON.stringify(counts);
assert.equal(api.progress(counts,base).allDone,true,'skipping the optional warm-up cannot block completion');
assert.equal(api.progress(counts,base).completed,6);
assert.equal(JSON.stringify(counts),before,'optional skipping never awards or rewrites attempts');
assert.equal(api.progress([3,0,0,0,0,0,0],base).completed,0,'warm-up tries are not signature-step credit');
assert.ok(html.indexOf('lessons.js?')<html.indexOf('studio.js?'));
for(const id of ['lesson-bridge-title','lesson-why','lesson-map','lesson-map-caption','skip-warmup'])assert.ok(html.includes(`id="${id}"`));
assert.doesNotMatch(studio,/These simple shapes build the movement|Follow the low curve into one tall loop/);
assert.match(studio,/state\[selected\]\.step===0 && !reducedMotion/,'only the explicitly separate warm-up can animate a generic path');
console.log('PASS: all 20 designs use exact image focus windows; actual AF assembly; revised/missing-art safety; paper parity; memory/peek; six signature steps with optional, non-crediting warm-up; saved targets preserved.');
