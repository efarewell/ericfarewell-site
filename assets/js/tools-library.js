(function(){
  const accessKey='royals-journey-access-v1';
  const maxAge=4*60*60*1000;
  const library=document.querySelector('[data-tools-library]');
  if(!library)return;

  const content=library.querySelector('[data-library-content]');
  const gate=library.querySelector('[data-library-gate]');
  const query=new URLSearchParams(window.location.search);
  const isReviewHost=window.location.hostname==='localhost'||window.location.hostname.endsWith('.pages.dev');
  const isReview=isReviewHost&&query.get('review')==='1';
  let handoff=null;

  try{handoff=JSON.parse(sessionStorage.getItem(accessKey)||'null')}catch(error){handoff=null}

  const isCurrent=handoff&&Number.isFinite(handoff.createdAt)&&(Date.now()-handoff.createdAt)<=maxAge;
  const isAllowed=isReview||(isCurrent&&handoff.libraryAccess===true&&handoff.recommendationConsent===true);

  if(!isAllowed){
    if(gate)gate.hidden=false;
    return;
  }

  if(content)content.hidden=false;
  const greeting=library.querySelector('[data-library-greeting]');
  if(greeting&&handoff?.firstName)greeting.textContent=`${handoff.firstName}, these are yours.`;

  library.querySelectorAll('[data-tool-card]').forEach(card=>{
    const tool=card.getAttribute('data-tool-card');
    if(tool===handoff?.recommendedTool){
      card.classList.add('recommended');
      const label=document.createElement('span');
      label.className='library-card-label';
      label.textContent='Your place to begin';
      card.prepend(label);
    }
  });
})();
