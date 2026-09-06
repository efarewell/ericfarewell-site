(function(){
  const form=document.querySelector('[data-guided-start]');
  if(!form)return;
  const steps=[...form.querySelectorAll('.journey-step')];
  const progress=form.querySelector('.journey-progress-bar');
  const counter=form.querySelector('[data-step-count]');
  const result=document.querySelector('[data-guided-result]');
  let index=0;
  let startMeasured=false;
  function errorBox(){return steps[index].querySelector('.journey-error')}

  function measure(eventName,toolId){
    const payload={eventName:eventName,source:'guided-start'};
    if(toolId)payload.toolId=toolId;
    fetch('/api/journey/event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>undefined);
  }

  const details={
    decision:['I know the options and cannot hear my own answer.','I am avoiding a conversation.','I want advice, but I may first need to understand the question.','The decision affects people I care about.'],
    time:['I am working too much.','I do not know where the time is going.','I know I should delegate and cannot see what to move.','My calendar and what I say matters do not match.'],
    ai:['I keep starting over with every new chat.','The output is generic because the tool does not know enough.','I want help building a useful first workspace.','I am unsure what should remain private.'],
    voice:['The writing is polished and I do not recognize myself in it.','I want AI help without losing my language.','My team or tools need a clear voice guide.','I have examples but do not know what makes them mine.'],
    harvest:['I have recordings and no useful system for them.','Good ideas disappear after calls.','I create too much raw material and cannot decide what matters.','I want a private archive before I decide what becomes public.'],
    unsure:['I need a question more than a system.','I feel overloaded and cannot tell what the real problem is.','Several of these are connected.','I would rather describe it in my own words.']
  };
  const recommendations={
    decision:{id:'hotseat',name:'The Solo Hot Seat',url:'hotseat.html?from=guided-start',reason:'The people around you may all have reasonable opinions, and every added voice can make your own harder to hear. The Solo Hot Seat asks you to set aside twenty-five quiet minutes, return to your body, and find what is actually true for you.',question:'What can you hear when nobody else gets a vote for twenty-five minutes?'},
    time:{id:'time-audit',name:'The Royals Time Audit',url:'/time-audit?from=guided-start',reason:'Your calendar reflects your true priorities. The Time Audit tracks importance and joy beside the hours so you can see what matters most, what brings you alive, and which responsibilities may be ready to change hands.',question:'Where are your hours going that your stated priorities are not?'},
    ai:{id:'first-hour',name:'The First Hour',url:'first-hour.html?from=guided-start',reason:'AI can increase your output, but it can also create more noise or become another place to outsource your judgment. The First Hour begins with your real week and shows you where the tool can challenge your thinking, carry context, and make useful work easier.',question:'Where could AI amplify your work without replacing your wisdom?'},
    voice:{id:'find-your-voice',name:'Find Your Voice',url:'find-your-voice.html?from=guided-start',reason:'AI can expand your reach while making every sentence sound like it came from a computer. Find Your Voice builds a standard from your own language, rhythm, edges, and choices so the tool can amplify your impact without sanding your soul out of the work.',question:'Which piece of your writing sounds unmistakably like you?'},
    harvest:{id:'harvest',name:'The Harvest',url:'harvest.html?from=guided-start',reason:'Your best ideas may be spoken once in a real conversation and never used again. The Harvest finds the wisdom inside calls you already recorded and gives those words more work to do through writing, marketing, a book, or an idea worth saving.',question:'Which conversations contain ideas that deserve to travel farther?'},
    unsure:{id:'hotseat',name:'The Solo Hot Seat',url:'hotseat.html?from=guided-start',reason:'You do not need to understand the whole problem before you begin. The Solo Hot Seat creates twenty-five quiet minutes to return to your body and hear your own answer without adding another opinion.',question:'What can you hear when nobody else gets a vote for twenty-five minutes?'}
  };

  function selected(name){const el=form.querySelector(`[name="${name}"]:checked`);return el?el.value:''}
  function renderDetails(){
    const need=selected('primary_need');
    const wrap=form.querySelector('[data-detail-choices]');
    wrap.innerHTML=(details[need]||details.unsure).map((label,i)=>`<label class="choice"><input type="radio" name="need_detail" value="${label.replace(/"/g,'&quot;')}"><span>${label}</span></label>`).join('');
  }
  function show(i,shouldScroll=true){
    index=Math.max(0,Math.min(i,steps.length-1));
    steps.forEach((step,n)=>step.classList.toggle('active',n===index));
    progress.style.width=`${((index+1)/steps.length)*100}%`;
    counter.textContent=`${index+1} of ${steps.length}`;
    if(errorBox())errorBox().textContent='';
    if(shouldScroll)form.querySelector('.journey-card').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function valid(){
    const required=[...steps[index].querySelectorAll('[required]')];
    for(const field of required){
      if(field.type==='radio'){
        if(!selected(field.name)){errorBox().textContent='Choose the answer that comes closest.';return false}
      }else if(field.type==='checkbox'&&!field.checked){errorBox().textContent='Please confirm this choice to continue.';return false}
      else if(!field.value.trim()){errorBox().textContent='Add a response before continuing.';field.focus();return false}
      else if(field.type==='email'&&!field.validity.valid){errorBox().textContent='Check the email address and try again.';field.focus();return false}
    }
    return true;
  }
  form.addEventListener('click',e=>{
    const next=e.target.closest('[data-next]');
    const back=e.target.closest('[data-back]');
    if(next){
      if(!valid())return;
      if(!startMeasured){startMeasured=true;measure('guided_start_started')}
      if(index===0)renderDetails();
      show(index+1);
    }
    if(back)show(index-1);
  });
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!valid())return;
    const need=selected('primary_need')||'unsure';
    const rec=recommendations[need];
    if(!startMeasured){startMeasured=true;measure('guided_start_started')}
    measure('guided_start_completed',rec.id);
    result.querySelector('[data-result-name]').textContent=rec.name;
    result.querySelector('[data-result-reason]').textContent=rec.reason;
    result.querySelector('[data-result-question]').textContent=rec.question;
    const access=new URL('/auth/sign-in','https://tools.ericfarewell.com');
    access.searchParams.set('tool',rec.id);
    access.searchParams.set('need',need);
    access.searchParams.set('next','/tools-library');
    access.searchParams.set('source','guided-start');
    result.querySelector('[data-result-link]').setAttribute('href',access.href);
    form.style.display='none';
    result.classList.add('active');
    result.scrollIntoView({behavior:'smooth',block:'start'});
  });
  document.querySelector('[data-restart]')?.addEventListener('click',()=>{
    form.reset();result.classList.remove('active');form.style.display='block';show(0,false);window.scrollTo({top:0,behavior:'smooth'});
  });
  show(0,false);
})();
