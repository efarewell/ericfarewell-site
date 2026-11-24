import {FeetTracker,visibleFeet} from './feet-rules.mjs';
const $=id=>document.getElementById(id),tracker=new FeetTracker();
const curriculum={basketball:[['step-slide','Step and slide','Take one or two small slides right, pause, then return left. Lead with the foot in the direction of travel. Keep the feet apart.','Keep space between your feet.'],['front-pivot','Front pivot','Start stationary. Keep your chosen pivot foot in place as you make a small quarter-turn with the free foot. Return slowly. Swap pivot foot next round.','Turn around the foot on the marker.'],['jab-reset','Jab and reset','Choose a pivot foot. Take a short jab with the other foot, then return to your starting stance. Begin without the ball.','Show the step. Find your base again.']],soccer:[['inside-exchange','Inside-foot exchange','Begin with small side steps without the ball. Add gentle inside-foot touches when ready, repositioning the supporting foot to stay within reach.','Move your feet with the ball.'],['sole-roll','Sole roll and follow','Roll the ball a short distance across your body with the sole. Follow with your feet, settle, then reverse. Walk through without a ball first.','Roll, follow, settle.'],['v-pull','V-pull footwork','Pull the ball back with the sole, adjust your supporting foot, then push diagonally away with the inside of that same foot. Pause between parts.','Pull it in. Open the next lane.']]};
let worker,ready=false,stream,sourceUrl,sessionToken=0,pending=false,raf,run,lastSend=0,lastResult=0,lastPoses=[],modelWait,lastSample=0,latency=0;
const inputCanvas=document.createElement('canvas'),inputCtx=inputCanvas.getContext('2d');
const video=$('footFeed'),canvas=$('footView'),ctx=canvas.getContext('2d'),key='practice-court-feet-v1';
let history=[];try{history=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(history))history=[];}catch{}
function persist(){try{localStorage.setItem(key,JSON.stringify(history.slice(0,100)));return true;}catch{return false;}}
function renderHistory(){
 $('footHistory').replaceChildren();
 for(const row of history){const li=document.createElement('li');li.textContent=new Date(row.id).toLocaleString()+' · '+row.sport+' · '+row.title+' · '+row.seconds+'s · '+(row.mode==='timer'?'Timer only':row.leftReturns+' left / '+row.rightReturns+' right foot returns · '+row.coverage+'% estimated coverage'+(row.coverage<75?' · Incomplete tracking':''));$('footHistory').append(li);}
}
function pick(){const options=curriculum[$('footSport').value];$('footDrill').replaceChildren(...options.map(d=>new Option(d[1],d[0])));describe();}
function selected(){return curriculum[$('footSport').value].find(d=>d[0]===$('footDrill').value);}
function describe(){const d=selected();$('footInstruction').textContent=d[2];$('footCue').textContent='Optional cue: '+d[3];}
$('footSport').onchange=pick;$('footDrill').onchange=describe;pick();renderHistory();
function lock(on){for(const id of ['footSport','footDrill','footCamera','footFile','footTimer'])$(id).disabled=on;}
function stopResources(){
 sessionToken++;cancelAnimationFrame(raf);clearTimeout(modelWait);worker?.terminate();worker=null;ready=false;pending=false;lastPoses=[];lastResult=0;lastSend=0;lastSample=0;tracker.calibrating=false;tracker.baseline=null;
 stream?.getTracks().forEach(t=>t.stop());stream=null;video.pause();video.srcObject=null;video.removeAttribute('src');video.load();if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl=null;$('footFile').value='';
 $('footStage').hidden=true;$('footCalibrate').disabled=true;$('footStart').disabled=true;lock(false);
}
function finish(){
 if(!run)return;const now=performance.now(),seconds=Math.min(30,Math.round((now-run.start)/1000));
 const result=run.mode==='timer'?{}:tracker.report(now);
 if(run.mode!=='timer'){$('footCoverage').textContent=result.coverage+'%';$('footLeft').textContent=result.leftReturns;$('footRight').textContent=result.rightReturns;}
 history.unshift({id:Date.now(),sport:run.sport,drill:run.drill,title:run.title,mode:run.mode,seconds,...result,inferenceMs:Math.round(latency)});history=history.slice(0,100);
 $('footResult').textContent=run.mode==='timer'?seconds+' seconds of guided footwork. No camera measurement.':result.leftReturns+' left and '+result.rightReturns+' right foot returns observed. Estimated coverage '+result.coverage+'%.'+(result.coverage<75?' Incomplete tracking. Do not compare this round with a fully tracked round.':' These are movement observations, not technique scores.');
 $('footHistoryStatus').textContent=persist()?'Saved on this device.':'Device storage is unavailable. Export before leaving.';
 run=null;tracker.active=false;$('footStop').hidden=true;stopResources();renderHistory();
}
function fail(message){if(run)finish();else stopResources();$('footStatus').textContent=message+' Timer practice is still available.';}
function draw(){
 if(video.readyState<2)return;
 canvas.height=Math.round(canvas.width*video.videoHeight/video.videoWidth);ctx.drawImage(video,0,0,canvas.width,canvas.height);
 const feet=visibleFeet(lastPoses),fresh=performance.now()-lastResult<500;
 if(tracker.baseline){for(const [side,p] of Object.entries(tracker.baseline)){ctx.strokeStyle=side==='left'?'#89efd2':'#ffb15f';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x*canvas.width,p.y*canvas.height,tracker.threshold*canvas.width,tracker.threshold*canvas.height,0,0,Math.PI*2);ctx.stroke();}}
 if(!feet||!fresh)return;
 for(const [name,ids,color] of [['Your left',[27,29,31],'#89efd2'],['Your right',[28,30,32],'#ffb15f']]){
  ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<ids.length;i++){const p=feet.landmarks[ids[i]];if(i)ctx.lineTo(p.x*canvas.width,p.y*canvas.height);else ctx.moveTo(p.x*canvas.width,p.y*canvas.height);}ctx.closePath();ctx.stroke();
  for(const id of ids){const p=feet.landmarks[id];ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x*canvas.width,p.y*canvas.height,4,0,Math.PI*2);ctx.fill();}
  const p=feet.landmarks[ids[0]];ctx.font='16px system-ui';ctx.fillStyle='#07151c';ctx.fillRect(p.x*canvas.width-28,p.y*canvas.height-34,90,23);ctx.fillStyle=color;ctx.fillText(name,p.x*canvas.width-24,p.y*canvas.height-17);
 }
}
function updateDisplay(){
 if(!run)return;
 const now=performance.now();$('footSeconds').textContent=Math.max(0,Math.ceil(30-(now-run.start)/1000));
 if(run.mode!=='timer'){const r=tracker.report(now);$('footLeft').textContent=r.leftReturns;$('footRight').textContent=r.rightReturns;$('footCoverage').textContent=r.coverage+'%';}
 if(now-run.start>=30000)finish();
}
function loop(now){
 updateDisplay();if(!worker)return;
 draw();
 if(lastResult&&now-lastResult>500){tracker.update(null,now);lastPoses=[];$('footStart').disabled=true;$('footSignal').textContent='Tracking paused. Bring both legs and shoes into view, then return to the starting stance.';}
 if(ready&&!pending&&video.readyState>=2&&now-lastSend>=100){
  pending=true;lastSend=now;const ticket=sessionToken;
  inputCanvas.width=640;inputCanvas.height=Math.round(640*video.videoHeight/video.videoWidth);inputCtx.drawImage(video,0,0,inputCanvas.width,inputCanvas.height);
  createImageBitmap(inputCanvas).then(frame=>{if(ticket!==sessionToken||!worker){frame.close();return;}worker.postMessage({type:'frame',t:now,frame},[frame]);}).catch(error=>{console.warn('Frame read/transfer:',String(error));fail('This browser could not read a video frame.');});
 }
 raf=requestAnimationFrame(loop);
}
async function initialize(file){
 if(run)finish();stopResources();lock(true);$('footResult').textContent='';$('footStatus').textContent='Loading the on-device pose model…';$('footStage').hidden=false;
 const ticket=sessionToken;
 try{
  if(file){sourceUrl=URL.createObjectURL(file);video.src=sourceUrl;await new Promise((resolve,reject)=>{const wait=setTimeout(()=>reject(Error('Video load timed out')),15000);video.onloadeddata=()=>{clearTimeout(wait);resolve();};video.onerror=()=>{clearTimeout(wait);reject(Error('Video format is not supported'));};});video.onloadeddata=null;await video.play();await new Promise(resolve=>{if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(resolve);else setTimeout(resolve,100);});video.pause();}
  else {const acquired=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}});if(ticket!==sessionToken){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;video.srcObject=stream;await video.play();}
  if(ticket!==sessionToken)return;
  worker=new Worker(new URL('./pose-worker.mjs',import.meta.url));
  modelWait=setTimeout(()=>fail('The pose model did not load in time. Check your connection and retry.'),45000);
  worker.onerror=()=>fail('The pose model could not start in this browser.');
  worker.onmessage=({data})=>{
   if(data.type==='ready'){clearTimeout(modelWait);ready=true;$('footStatus').textContent=file?'Local video review. Calibrate on a clear standing frame; the video plays when the round begins.':'Live foot tracking. Stand where both feet are visible, then calibrate.';}
   else if(data.type==='error'){console.warn('Pose startup/inference error:',data.message);fail('Foot tracking encountered a model error.');}
   else if(data.type==='pose'){
    pending=false;lastResult=performance.now();latency=lastResult-data.t;lastPoses=data.poses;
    const feet=visibleFeet(lastPoses),state=tracker.update(feet,data.t);
    $('footCalibrate').disabled=!!run||!feet||tracker.calibrating;
    $('footStart').disabled=!!run||!feet||!tracker.baseline||tracker.calibrating;
    $('footSignal').textContent=!feet?(data.poses.length>1?'More than one person detected. Practise alone in the frame.':'Both feet are not confidently visible. Move back, improve lighting, and keep both shoes in frame.'):state.calibrating?'Hold your starting stance… '+Math.round(state.progress*100)+'%':state.calibrated?'Starting stance saved. Take a slow step out and back after starting.':state.reacquiring?'Return both feet to the start and hold still.':tracker.baseline?'Feet visible. Mint is your left foot; amber is your right.':'Both feet visible. Calibrate your starting stance.';
   }
  };
  worker.postMessage({type:'init'});raf=requestAnimationFrame(loop);
 }catch{if(ticket===sessionToken)fail('Camera or video unavailable. Check access and try again.');}
}
$('footCamera').onclick=()=>initialize();$('footFile').onchange=()=>{const file=$('footFile').files[0];if(file)initialize(file);};
$('footCalibrate').onclick=()=>{if(!visibleFeet(lastPoses))return;tracker.calibrate();$('footStart').disabled=true;$('footSignal').textContent='Hold both feet still for calibration.';};
function start(mode){const d=selected(),t=performance.now();run={mode,start:t,sport:$('footSport').value,drill:d[0],title:d[1]};$('footSeconds').textContent=30;$('footLeft').textContent='0';$('footRight').textContent='0';$('footCoverage').textContent='Unavailable';$('footStop').hidden=false;$('footResult').textContent='';lock(true);if(mode==='pose'){tracker.start(t);$('footCalibrate').disabled=true;$('footStart').disabled=true;if(sourceUrl)video.play().catch(()=>fail('The local video could not play.'));}else{const tick=()=>{if(!run||run.mode!=='timer')return;updateDisplay();raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);}}
$('footStart').onclick=()=>{if(tracker.baseline&&visibleFeet(lastPoses))start('pose');};
$('footTimer').onclick=()=>{stopResources();start('timer');$('footStatus').textContent='Guided footwork. Count your own repetitions if you want to.';};
$('footStop').onclick=finish;$('footClose').onclick=()=>{if(run)finish();else stopResources();$('footStatus').textContent='Tracker closed. Camera released.';};
video.onended=()=>{if(run)finish();};
function exportHistory(){const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,rounds:history},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='practice-court-footwork.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('footExport').onclick=exportHistory;$('footClear').onclick=()=>{history=[];persist();renderHistory();$('footHistoryStatus').textContent='Footwork history cleared on this device.';};
window.addEventListener('pagehide',stopResources);document.addEventListener('visibilitychange',()=>{if(document.hidden){if(run)finish();else stopResources();}});
