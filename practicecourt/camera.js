// Identity is calibrated from a tap on a distinctive patch of the ball.
const canvas = $('view'), ctx = canvas.getContext('2d',{willReadFrequently:true}), feed = $('feed');
let stream, token = 0, signature, previous, pixels, frameId, lastFrame, game, current, locked;
function detect(data,w,h,color,prior) {
  const mask = new Uint8Array(w*h), queue = new Int32Array(w*h);
  for(let i=0;i<mask.length;i++){
    const k=i*4;
    const d=Math.hypot(data[k]-color[0],data[k+1]-color[1],data[k+2]-color[2]);
    if(d<57) mask[i]=1;
  }
  let best=null, bestScore=0;
  for(let i=0;i<mask.length;i++) {
    if(!mask[i]) continue;
    let n=1,sx=0,sy=0,minX=w,maxX=0,minY=h,maxY=0;
    mask[i]=0;queue[0]=i;
    for(let j=0;j<n;j++){
      const k=queue[j], x=k%w, y=Math.floor(k/w);
      sx+=x;sy+=y;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(const v of [x?k-1:-1,x<w-1?k+1:-1,k-w,k+w]){
        if(v>=0 && v<mask.length && mask[v]) {mask[v]=0;queue[n++]=v;}
      }
    }
    const bw=maxX-minX+1,bh=maxY-minY+1,ratio=bw/bh;
    if(n<9 || n>w*h*.09 || ratio<.38 || ratio>2.5 || n/(bw*bh)<.25) continue;
    const x=sx/n/w,y=sy/n/h,dist=prior?Math.hypot(x-prior.x,y-prior.y):0;
    if(prior && (dist>.40 || n/prior.size>4 || n/prior.size<.22)) continue;
    const score=Math.sqrt(n)/(1+18*dist);
    if(score>bestScore){bestScore=score;best={x,y,size:n};}
  }
  return best;
}
function releaseCam(){
  token++;cancelAnimationFrame(frameId);
  if(stream)stream.getTracks().forEach(t=>t.stop());
  stream=null;feed.srcObject=null;game=null;signature=null;pixels=null;previous=null;current=null;locked=0;
  $('camPanel').hidden=true;
  for(const id of ['camera','guided','soccer','basketball'])$(id).disabled=false;
}
function finishCamera(){
  const g=game,seconds=Math.min(30,Math.round((performance.now()-g.start)/1000));
  const coverage=Math.round(100*g.seen/Math.max(1,g.frames));
  lastId=String(Date.now());
  practiceHistory.unshift({id:lastId,sport,drill:g.id,trace:{version:1,source:"camera",sport,drill:g.id,frames:g.trace},seconds,cue:$('cue').value.trim(),note:'',camera:true,focus:$('focus').value,interval:g.times.length?g.times.reduce((a,b)=>a+b,0)/g.times.length/1000:null,hits:g.hits,attempts:g.attempts,coverage});
  releaseCam();$('result').hidden=false;$('note').value='';$('figures').replaceChildren();$('debrief').textContent='';
  $('summary').textContent=g.hits+' on target out of '+g.attempts+' observed crossings. Target accuracy: '+(g.attempts?Math.round(100*g.hits/g.attempts)+'%':'unavailable')+'. Tracking coverage: '+coverage+'%.'+(coverage<75?' Partial tracking. Some movements may be missing.':'');
  $('saved').textContent=persist()?'Round saved.':'Device storage unavailable.';renderHistory();
  $('mode').textContent='COMPLETE';$('coach').textContent='What helped you reach the target?';
}
function paint(t){
  if(!stream)return;
  if(game && t-game.start>=30000){finishCamera();return;}
  if(feed.readyState>=2 && feed.currentTime!==lastFrame){
    lastFrame=feed.currentTime;
    const height=Math.round(canvas.width*feed.videoHeight/feed.videoWidth);
    if(canvas.height!==height)canvas.height=height;
    const w=canvas.width,h=canvas.height;
    ctx.drawImage(feed,0,0,w,h);pixels=ctx.getImageData(0,0,w,h).data;
    current=signature?detect(pixels,w,h,signature,previous):null;
    if(current){previous=current;locked++;}else{locked=0;previous=null;}
    const {y,edge,height:band}=game || activeDrill();
    ctx.strokeStyle='#d5ee86';ctx.lineWidth=2;
    ctx.strokeRect(1,(y-band)*h,edge*w-1,2*band*h);ctx.strokeRect((1-edge)*w,(y-band)*h,edge*w-1,2*band*h);
    if(current){ctx.beginPath();ctx.arc(current.x*w,current.y*h,Math.max(5,Math.sqrt(current.size/Math.PI)),0,2*Math.PI);ctx.strokeStyle='#ffbb51';ctx.stroke();}
    if(game){
      game.trace.push([Math.round(t-game.start),current?+current.x.toFixed(4):null,current?+current.y.toFixed(4):null]);scoreFrame(game,current,t);$('seconds').textContent=Math.ceil(Math.max(0,30000-t+game.start)/1000);
      $('metrics').textContent=game.attempts+' crossings · '+game.hits+' on target';
      $('setup').textContent=current?'Alternate sides and aim inside the boxes.':'Tracking lost. Bring the ball back to its last position.';
    }else{
      $('go').disabled=locked<3;
      $('setup').textContent=signature?(current?'Check the ring follows your ball. Tap again to recalibrate.':'Hold the ball still and tap a distinctive patch again.'):'Face the phone, frame both gates, then tap a distinctive patch on the ball.';
    }
  }
  frameId=requestAnimationFrame(paint);
}
canvas.onclick=e=>{
  if(!pixels||game)return;
  const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height;
  const i=4*(Math.min(canvas.height-1,Math.floor(y*canvas.height))*canvas.width+Math.min(canvas.width-1,Math.floor(x*canvas.width)));
  signature=Array.from(pixels.slice(i,i+3));previous=null;
  current=detect(pixels,canvas.width,canvas.height,signature,null);
  // Acquire at the selected location, even when the background contains similar colors.
  previous={x,y,size:current?.size||100};locked=0;
};
$('camera').onclick=async()=>{
  const ticket=++token;
  for(const id of ['camera','guided','basketball','soccer'])$(id).disabled=true;
  $('camPanel').hidden=false;$('result').hidden=true;$('go').hidden=false;$('go').disabled=true;$('closeCam').textContent='Close camera';$('metrics').textContent='';
  $('setup').textContent='Waiting for camera access…';$('camPanel').scrollIntoView();
  try{
    const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640}},audio:false});
    if(ticket!==token){acquired.getTracks().forEach(t=>t.stop());return;}
    stream=acquired;feed.srcObject=stream;await feed.play();if(ticket!==token)return;
    lastFrame=-1;frameId=requestAnimationFrame(paint);
  }catch(err){if(ticket!==token)return;releaseCam();$('coach').textContent='Camera unavailable. Open this site in Safari or Chrome and allow camera access, then try again.';}
};
$('go').onclick=()=>{
  if(!current||locked<3)return;
  game={start:performance.now(),...activeDrill(),trace:[],seen:0,frames:0,side:null,pending:null,hits:0,attempts:0,times:[]};
  $('mode').textContent='CAMERA ROUND';$('go').hidden=true;$('closeCam').textContent='Finish round';$('seconds').textContent=30;
};
$('closeCam').onclick=()=>game?finishCamera():releaseCam();
window.addEventListener('pagehide',releaseCam);
