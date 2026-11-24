const tips={
 basketball:['Let the ball travel past the far edge of the marker.','Try the same width on both sides. Notice which crossing feels easier.','Give yourself one slow crossing before you pick up the pace.'],
 soccer:['Roll the ball through the gate and bring it back under control.','Keep the next touch close enough to change direction.','Choose one gate to look up after. Then find the ball again.']
};
let index=0, audioEnabled=false;
function say(line){
 $('message').textContent=line;
 if(audioEnabled && $('voice').value!=='quiet' && window.speechSynthesis){
   speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(line));
 }
}
function offer(){
 const line=tips[sport][index++%tips[sport].length];
 say($('voice').value==='playful'?'Try this with me. '+line:line);
}
$('hint').onclick=offer;
$('voice').onchange=()=>{if($('voice').value==='quiet'){window.speechSynthesis?.cancel();say('I’ll leave the round to you. Ask for a cue whenever you want one.');}else offer();};
$('speak').onclick=()=>{
 if(!window.speechSynthesis){say('Your browser supports written cues here.');return;}
 audioEnabled=!audioEnabled;$('speak').textContent=audioEnabled?'Voice on':'Voice off';$('speak').setAttribute('aria-pressed',audioEnabled);
 if(audioEnabled)say($('message').textContent);else speechSynthesis.cancel();
};
$('choose').onclick=()=>$('practice').scrollIntoView();
$('again').onclick=()=>{const last=practiceHistory.find(r=>r.id===lastId);$(last?.camera?'camera':'guided').click();};
for(const name of Object.keys(sports))$(name).addEventListener('click',()=>{index=0;if($('voice').value!=='quiet')offer();});
$('go').addEventListener('click',()=>{if(game && $('focus').value!=='recall' && $('voice').value!=='quiet')say($('cue').value.trim()?'Your cue is '+$('cue').value.trim()+'. Begin when you see the target.':tips[sport][0]);});
new MutationObserver(()=>{
 if($('result').hidden)return;
 const item=practiceHistory.find(r=>r.id===lastId);if(!item)return;
 $('figures').replaceChildren();
 const stats=item.camera?[[item.attempts,'Crossings'],[item.attempts?Math.round(100*item.hits/item.attempts)+'%':'—','On target'],[item.coverage+'%','Tracking coverage']]:[[item.seconds+'s','Time practiced']];
 if(item.interval && item.focus==='rhythm')stats.push([item.interval.toFixed(2)+'s','Mean crossing interval']);
 for(const [value,label] of stats){const cell=document.createElement('div'),number=document.createElement('strong'),caption=document.createElement('small');number.textContent=value;caption.textContent=label;cell.append(number,caption);$('figures').append(cell);}
 updateReminder();
 const feedback=!item.camera?'What did you notice when you changed sides?':item.coverage<75?'I lost sight of part of that round. Let’s bring the markers into better light.':!item.attempts?'Start inside one gate and travel all the way to the other.':item.hits===item.attempts?'Every observed crossing landed in the gate. Want to try it again and see how it feels?':item.hits+' of '+item.attempts+' observed crossings reached the target. Try the same width with a slower first move.';
 $('debrief').textContent=$('voice').value==='quiet'?'':feedback;
 if($('voice').value!=='quiet')say(feedback);
 $('result').scrollIntoView();
}).observe($('result'),{attributes:true,attributeFilter:['hidden']});

function updateReminder(){
 const last=practiceHistory.find(r=>r.sport===sport && r.cue);
 $('reuse').hidden=!last;
 if(last){$('reuse').textContent='Use last cue · '+last.cue;$('reuse').onclick=()=>{$('cue').value=last.cue;};}
}
$('focus').onchange=()=>say({control:'Pick one spot inside each gate. Send the ball there.',rhythm:'Try to leave the same space between crossings. Find a beat you can keep.',recall:'Choose your own rhythm. I’ll keep the count.'}[$('focus').value]);
for(const name of Object.keys(sports))$(name).addEventListener('click',updateReminder);
new MutationObserver(()=>{$('focus').disabled=$('camera').disabled;$('cue').disabled=$('camera').disabled;$('reuse').disabled=$('camera').disabled;}).observe($('camera'),{attributes:true,attributeFilter:['disabled']});
updateReminder();
