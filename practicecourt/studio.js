function stopFilm(){ $('studyFilm').pause(); }
function setupFilm(asset){
 const film=$('studyFilm');
 film.pause();film.poster=asset+'-study.webp';film.src=asset+'-study.mp4';film.load();
 film.onplay=()=>$('lesson').pause();
}
function activeDrill(){return drills.find(d=>d.sport===sport && d.id===$('drillPicker').value)||drills.find(d=>d.sport===sport);}
function showDrill(){const d=activeDrill();$('drill').textContent=d.title;$('instructions').textContent=d.instruction;
 const player=$('lesson'),asset=d.sport+'-'+d.id;
 setupFilm(asset);$('gateGuide').open=false;player.pause();player.poster=asset+'.webp';player.src=asset+'.mp4';
 player.setAttribute('aria-label',d.title+' animated demonstration');player.load();
 $('sportSetup').textContent=d.sport==='soccer'?'Keep both feet and the floor in view.':'Leave room for the bounce at floor level and the return to your hand.';
 }
function listDrills(){const options=drills.filter(d=>d.sport===sport).map(d=>new Option(d.title+' · '+d.focus,d.id));$('drillPicker').replaceChildren(...options);showDrill();}
listDrills();$('drillPicker').onchange=showDrill;
for(const id of ['basketball','soccer'])$(id).addEventListener('click',listDrills);
new MutationObserver(()=>{$('drillPicker').disabled=$('camera').disabled;}).observe($('camera'),{attributes:true,attributeFilter:['disabled']});
const sample={version:1,source:'synthetic',sport:'basketball',drill:'cross',frames:Array.from({length:181},(_,i)=>[i*50,...(i>72&&i<81?[null,null]:[.5+.34*Math.cos(i*Math.PI/15),.55+.19*Math.sin(i/17)])])};
let replay;
function refreshSessions(){const value=$('session').value;$('session').replaceChildren(...practiceHistory.filter(r=>r.trace).map(r=>new Option((drills.find(d=>d.sport===r.sport&&d.id===r.drill)?.title||r.sport)+' · '+new Date(+r.id).toLocaleString(),r.id)),new Option('Sample crossover · simulated','sample'));if([...$('session').options].some(o=>o.value===value))$('session').value=value;}
refreshSessions();new MutationObserver(refreshSessions).observe($('entries'),{childList:true});
function selectedTrace(){return practiceHistory.find(r=>r.id===$('session').value)?.trace||sample;}
$('session').onchange=()=>{$('labReport').hidden=true;$('labStatus').textContent='';};
$('download').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(selectedTrace())],{type:'application/json'}));a.href=url;a.download='practice-trace.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function plot(){
 const frames=replay.frames,idx=+$('scrub').value,c=$('plot'),p=c.getContext('2d'),end=frames.at(-1)[0]||1;
 p.fillStyle='#0a1720';p.fillRect(0,0,c.width,c.height);p.strokeStyle='#52e4c6';p.lineWidth=3;p.beginPath();let connected=false;
 for(const [t,x] of frames){if(x===null){connected=false;continue;}const px=t/end*720,py=(1-x)*164+8;if(connected)p.lineTo(px,py);else p.moveTo(px,py);connected=true;}p.stroke();
 const [t,x]=frames[idx];p.fillStyle='#ffb247';p.fillRect(t/end*718,0,2,180);$('readout').textContent=(t/1000).toFixed(2)+' s · '+(x===null?'Tracking gap':'Ball at '+Math.round(x*100)+'% of frame width');
}
$('scrub').oninput=plot;
$('analyze').onclick=async()=>{
 const trace=selectedTrace();$('analyze').disabled=true;$('session').disabled=true;$('labReport').hidden=true;$('labStatus').textContent='Analyzing position samples…';
 try{const data=analyze(trace);
 replay=trace;$('scrub').max=trace.frames.length-1;$('scrub').value=0;$('labReport').hidden=false;plot();
 $('breakdown').replaceChildren();for(const [label,value] of [['Crossings',data.attempts],['On target',data.hits],['Frames tracked',data.coverage+'%'],['Left arrivals',data.left],['Right arrivals',data.right],['Tracking gaps',data.gaps]]){const d=document.createElement('div'),n=document.createElement('strong'),l=document.createElement('small');n.textContent=value;l.textContent=label;d.append(n,l);$('breakdown').append(d);}
 $('labStatus').textContent=(trace.source==='synthetic'?'Simulated sample':'Camera round')+' · rules '+data.rules;
 }catch{$('labStatus').textContent='The report could not run. You can export the trace and retry.';}finally{$('analyze').disabled=false;$('session').disabled=false;}
};

for(const id of ['guided','camera'])$(id).addEventListener('click',()=>$('lesson').pause());

for(const id of ['guided','camera'])$(id).addEventListener('click',stopFilm);
$('lesson').addEventListener('play',stopFilm);
