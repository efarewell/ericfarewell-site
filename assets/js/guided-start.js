(function(){
  const form=document.querySelector('[data-guided-start]');
  if(!form)return;
  const steps=[...form.querySelectorAll('.journey-step')];
  const progress=form.querySelector('.journey-progress-bar');
  const counter=form.querySelector('[data-step-count]');
  const result=document.querySelector('[data-guided-result]');
  let index=0;
  function errorBox(){return steps[index].querySelector('.journey-error')}

  const details={
    decision:['I know the options and cannot hear my own answer.','I am avoiding a conversation.','I want advice, but I may first need to understand the question.','The decision affects people I care about.'],
    time:['I am working too much.','I do not know where the time is going.','I know I should delegate and cannot see what to move.','My calendar and what I say matters do not match.'],
    ai:['I keep starting over with every new chat.','The output is generic because the tool does not know enough.','I want help building a useful first workspace.','I am unsure what should remain private.'],
    voice:['The writing is polished and I do not recognize myself in it.','I want AI help without losing my language.','My team or tools need a clear voice guide.','I have examples but do not know what makes them mine.'],
    harvest:['I have recordings and no useful system for them.','Good ideas disappear after calls.','I create too much raw material and cannot decide what matters.','I want a private archive before I decide what becomes public.'],
    unsure:['I need a question more than a system.','I feel overloaded and cannot tell what the real problem is.','Several of these are connected.','I would rather describe it in my own words.']
  };
  const recommendations={
    decision:{id:'hotseat',name:'The Solo Hot Seat',url:'hotseat.html?from=guided-start',reason:'You named a decision or conversation that may need to be heard before it is solved. The Solo Hot Seat slows the question down, keeps ownership with you, and helps you choose one move.',question:'What becomes clearer when nobody rushes to give you the answer?'},
    time:{id:'time-audit',name:'The Royals Time Audit',url:'/time-audit?from=guided-start',reason:'You named time, workload, or delegation. The Time Audit records what the hours actually held, including work a calendar misses, then lets you rate importance and joy before deciding what should move.',question:'Which work requires you, and which work merely keeps returning to you?'},
    ai:{id:'first-hour',name:'The First Hour',url:'first-hour.html?from=guided-start',reason:'You named an AI relationship that lacks context or useful boundaries. The First Hour helps you build one grounded workspace from your own evidence and decide what should remain private.',question:'What would the tool need to know to be useful without pretending to know you completely?'},
    voice:{id:'find-your-voice',name:'Find Your Voice',url:'find-your-voice.html?from=guided-start',reason:'You named writing that no longer feels recognizable. Find Your Voice begins with examples you already trust and turns what is true about them into a guide you can correct.',question:'Which sentence already sounds like you before anybody improves it?'},
    harvest:{id:'harvest',name:'The Harvest',url:'harvest.html?from=guided-start',reason:'You named useful thinking that keeps disappearing. The Harvest helps preserve a call or recording, notice what may matter, and choose whether it belongs in a draft, a tool, a conversation, or a private archive.',question:'What is worth keeping even if it never becomes content?'},
    unsure:{id:'hotseat',name:'The Solo Hot Seat',url:'hotseat.html?from=guided-start',reason:'You do not need a complete diagnosis to begin. The Solo Hot Seat gives the uncertainty a little room and helps you find the first question that is actually yours.',question:'What are you hoping somebody else will name for you?'}
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
    result.querySelector('[data-result-name]').textContent=rec.name;
    result.querySelector('[data-result-reason]').textContent=rec.reason;
    result.querySelector('[data-result-question]').textContent=rec.question;
    result.querySelector('[data-result-link]').setAttribute('href',rec.url);
    form.style.display='none';
    result.classList.add('active');
    result.scrollIntoView({behavior:'smooth',block:'start'});
  });
  document.querySelector('[data-restart]')?.addEventListener('click',()=>{
    form.reset();result.classList.remove('active');form.style.display='block';show(0,false);window.scrollTo({top:0,behavior:'smooth'});
  });
  show(0,false);
})();
