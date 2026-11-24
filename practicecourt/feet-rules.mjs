// Image-space movement observations only. Not joint mechanics or technique assessment.
export const FEET_RULESET='feet-return-1';
export function visibleFeet(poses){
 if(!Array.isArray(poses)||poses.length!==1)return null;
 const p=poses[0], indices=[23,24,25,26,27,28,29,30,31,32];
 if(indices.some(i=>!p[i]||!Number.isFinite(p[i].x)||!Number.isFinite(p[i].y)||p[i].x<.025||p[i].x>.975||p[i].y<.025||p[i].y>.975||(p[i].visibility??0)<.65||(p[i].presence??1)<.65))return null;
 const point=ids=>({x:ids.reduce((s,i)=>s+p[i].x,0)/ids.length,y:ids.reduce((s,i)=>s+p[i].y,0)/ids.length});
 return {left:point([27,29,31]),right:point([28,30,32]),landmarks:p};
}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export class FeetTracker{
 constructor(){this.baseline=null;this.calibrating=false;this.stillSince=null;this.candidate=null;this.lastT=null;this.resetRound();}
 resetRound(){this.counts={left:0,right:0};this.events=[];this.validMs=0;this.active=false;this.lastT=null;this.reacquireSince=null;this.resetPhases();}
 resetPhases(){this.phases={left:{armed:false,outSince:null,homeSince:null},right:{armed:false,outSince:null,homeSince:null}};}
 calibrate(){this.baseline=null;this.calibrating=true;this.stillSince=null;this.candidate=null;this.resetRound();}
 start(t){if(!this.baseline)throw Error('Calibrate first');this.resetRound();this.active=true;this.startT=t;}
 update(feet,t){
  if(!Number.isFinite(t)||(this.lastT!==null&&t<=this.lastT))return {valid:false,reason:'stale'};
  const gap=this.lastT===null?0:t-this.lastT;this.lastT=t;
  if(!feet){this.stillSince=null;this.candidate=null;this.reacquireSince=null;this.resetPhases();return {valid:false,reason:'visibility'};}
  if(this.calibrating){
   if(gap>350||!this.candidate||['left','right'].some(k=>distance(feet[k],this.candidate[k])>.018)){this.candidate={left:{...feet.left},right:{...feet.right}};this.stillSince=t;}
   if(t-this.stillSince>=1500){this.baseline={...this.candidate};this.calibrating=false;this.threshold=Math.max(.045,distance(feet.left,feet.right)*.38);return {valid:true,calibrated:true};}
   return {valid:true,calibrating:true,progress:Math.min(1,(t-this.stillSince)/1500)};
  }
  if(!this.active)return {valid:true};
  if(gap>350){this.reacquireSince=null;this.resetPhases();}
  this.validMs+=Math.min(gap,200);
  // After occlusion or a slow frame, require a fresh still home stance before counting again.
  if(this.reacquireSince===null){
   if(['left','right'].every(k=>distance(feet[k],this.baseline[k])<this.threshold*.55))this.reacquireSince=t;
   return {valid:true,reacquiring:true};
  }
  if(t-this.reacquireSince<500){
   if(['left','right'].some(k=>distance(feet[k],this.baseline[k])>=this.threshold*.55))this.reacquireSince=null;
   return {valid:true,reacquiring:true};
  }
  for(const side of ['left','right']){
   const d=distance(feet[side],this.baseline[side]),s=this.phases[side];
   if(d>this.threshold){s.homeSince=null;if(s.outSince===null)s.outSince=t;if(t-s.outSince>=200)s.armed=true;}
   else if(d<this.threshold*.55){s.outSince=null;if(s.armed){if(s.homeSince===null)s.homeSince=t;if(t-s.homeSince>=250){this.counts[side]++;this.events.push({t:Math.round(t-this.startT),side,type:'return'});s.armed=false;s.homeSince=null;}}}
   else{s.homeSince=null;s.outSince=null;}
  }
  return {valid:true};
 }
 report(t){const elapsed=Math.max(1,t-this.startT);return {rules:FEET_RULESET,leftReturns:this.counts.left,rightReturns:this.counts.right,coverage:Math.min(100,Math.round(this.validMs/elapsed*100)),events:this.events.slice()};}
}
