function analyze(trace){
 const drill=drills.find(d=>d.sport===trace?.sport&&d.id===trace.drill);
 if(!drill||trace.version!==1||!['camera','synthetic'].includes(trace.source)||!Array.isArray(trace.frames)||!trace.frames.length||trace.frames.length>5000)throw Error('Invalid trace');
 const state={...drill,events:[],frames:0,seen:0,hits:0,attempts:0,times:[]};
 let last=-1,gaps=0,missing=false;
 for(const frame of trace.frames){
   if(!Array.isArray(frame)||frame.length!==3)throw Error('Invalid frame');
   const [t,x,y]=frame;
   if(!Number.isInteger(t)||t<last||t<0||t>120000)throw Error('Invalid time');
   last=t;
   const lost=x===null&&y===null;
   if(!lost&&![x,y].every(v=>Number.isFinite(v)&&v>=0&&v<=1))throw Error('Invalid coordinates');
   if(lost&&!missing)gaps++;missing=lost;
   scoreFrame(state,lost?null:{x,y},t);
 }
 const result={rules:'gates-1',attempts:state.attempts,hits:state.hits,coverage:Math.round(state.seen/state.frames*100),left:state.events.filter(e=>e.side==='left').length,right:state.events.filter(e=>e.side==='right').length,gaps,events:state.events};
 if(trace.labels!==undefined){
   if(!Array.isArray(trace.labels)||trace.labels.length>2000||trace.labels.some((t,i)=>!Number.isInteger(t)||t<0||t>last||i&&t<trace.labels[i-1]))throw Error('Invalid labels');
   let i=0,j=0,matched=0;const detected=state.events;
   while(i<trace.labels.length&&j<detected.length){const d=detected[j].t-trace.labels[i];if(d< -250)j++;else if(d>250)i++;else{matched++;i++;j++;}}
   result.validation={toleranceMs:250,matched,missed:trace.labels.length-matched,extra:detected.length-matched};
 }
 return result;
}
