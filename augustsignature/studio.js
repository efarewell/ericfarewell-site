(async () => {
  'use strict';
  // Optional session tools must never prevent the original studio from opening.
  const sessionInk = await import('./ink-session.mjs?v=own-hand-1').catch(() => null);

  // Original generated ink artwork. Each crop is measured around one complete
  // signature, with white breathing room; neighboring rows are never included.
  const families = {everyday:'Everyday', quick:'Quick & simple', calligraphy:'Calligraphy', tag:'Street tag'};
  const designs = [
    {name:'Easy flow',family:'everyday',text:'August Farewell',note:'Open letters. An easy everyday rhythm.',crop:[278,66,696,170],motion:'plain'},
    {name:'The go-to',family:'everyday',text:'August Farewell',note:'Tall capitals. Compact and confident.',crop:[271,276,715,196],motion:'angular'},
    {name:'Open book',family:'everyday',text:'August Farewell',note:'Round, relaxed, and unmistakably yours.',crop:[258,521,738,194],motion:'loop'},
    {name:'Fast lane',family:'everyday',text:'August Farewell',note:'Low letters. One long, quick exit.',crop:[274,760,725,195],motion:'angular'},
    {name:'Good energy',family:'everyday',text:'August Farewell',note:'A looping A and a little finishing sweep.',crop:[222,1003,813,211],motion:'loop'},
    {name:'Short & sure',family:'quick',text:'A. Farewell',note:'One initial. A clean, flowing surname.',crop:[331,60,591,175],motion:'plain'},
    {name:'First-name basis',family:'quick',text:'August F.',note:'A relaxed first name with a bold F.',crop:[335,290,572,202],motion:'loop'},
    {name:'Sharp start',family:'quick',text:'A Farewell',note:'A pointed A. A smooth finish.',crop:[327,532,615,185],motion:'angular'},
    {name:'Two-letter legend',family:'quick',text:'AF',note:'Two initials sharing one confident line.',crop:[439,768,430,214],motion:'plain'},
    {name:'The shortcut',family:'quick',text:'Aug. Farewell',note:'A shorter first name. All your character.',crop:[288,1018,702,194],motion:'loop'},
    {name:'Fine line',family:'calligraphy',text:'August Farewell',note:'Light loops and a graceful rhythm.',crop:[189,52,840,199],motion:'loop'},
    {name:'Brush rush',family:'calligraphy',text:'August Farewell',note:'Bold downstrokes. Easy movement.',crop:[223,289,805,213],motion:'plain'},
    {name:'The flourish',family:'calligraphy',text:'A. Farewell',note:'An expressive A with one long sweep.',crop:[223,542,808,207],motion:'loop'},
    {name:'Little bounce',family:'calligraphy',text:'August F.',note:'A lively first name and a strong finish.',crop:[329,785,611,218],motion:'plain'},
    {name:'Cut above',family:'calligraphy',text:'August Farewell',note:'Crisp angles with broad-nib character.',crop:[260,1028,742,194],motion:'angular'},
    {name:'After hours',family:'tag',text:'August Farewell',note:'Sharp marker energy. A low, fast sweep.',crop:[260,38,736,208],motion:'angular'},
    {name:'Round trip',family:'tag',text:'August F',note:'Round, chunky, and full of personality.',crop:[340,289,574,196],motion:'loop'},
    {name:'Lightning',family:'tag',text:'A Farewell',note:'Forward angles. A decisive exit.',crop:[282,520,716,221],motion:'angular'},
    {name:'The stamp',family:'tag',text:'AF',note:'A bold two-letter mark in a few moves.',crop:[420,783,419,217],motion:'angular'},
    {name:'Loose cannon',family:'tag',text:'Aug. Farewell',note:'Playful curves with a marker feel.',crop:[214,1030,840,196],motion:'loop'}
  ].map((d,id) => ({...d,id,asset:`assets/${d.family}-ink.png`,features:[
    ['open','connected'],['tall','compact'],['loops','open'],['compact','sweep'],['loops','sweep'],
    ['compact','connected'],['open','bold'],['angles','connected'],['compact','connected'],['compact','loops'],
    ['fine','loops'],['bold','connected'],['loops','sweep'],['playful','bold'],['angles','bold'],
    ['angles','sweep'],['loops','bold'],['angles','sweep'],['bold','compact'],['playful','loops']
  ][id]}));

  const steps = [
    {short:'Warm-up',title:'An optional warm-up.',instruction:'Try the loose loops, or skip straight to your signature.',hint:'A separate warm-up, not a part of the selected artwork.',goal:3,time:'at your own pace',win:'First spark.',message:'You showed up and got moving. That counts.'},
    {short:'Your A',title:'Practice your chosen A.',instruction:'Use the actual A focus area from your selected artwork.',hint:'Notice the main shape and slant. Crossing strokes may still be visible.',goal:3,time:'at your own pace',win:'A is yours.',message:'One letter. Three attempts. A real little win.'},
    {short:'Your F',title:'Practice your chosen F.',instruction:'Use the actual F focus area from the same artwork.',hint:'Try its main shape. There is no guessed pen order to follow.',goal:3,time:'at your own pace',win:'Two strong starts.',message:'Your A and F now have something to build on.'},
    {short:'Together',title:'Put the main shapes together.',instruction:'Use the selected artwork to place its main shapes. Do not force a join.',hint:'Practice their size, slant, and spacing. A pen lift is fine.',goal:3,time:'at your own pace',win:'Finding your rhythm.',message:'You practiced the main shapes in their places.'},
    {short:'Trace',title:'Bring your name together.',instruction:'Trace your chosen signature once, at your own speed.',hint:'Start with the A and work across. Lift between words. Leave dots, cross-strokes, or an underline until the end if that feels natural. Simple letters first; extra flair can wait.',goal:2,time:'about 40 sec',win:'Your name, in motion.',message:'The little moves are becoming one whole signature.'},
    {short:'Copy',title:'Look. Then let it flow.',instruction:'Look at the reference, then copy it on the empty space.',hint:'Look back as often as you like. Keep the big A, the F, and the general rhythm. Small differences are part of handwriting.',goal:2,time:'about 40 sec',win:'Less help. More you.',message:'You made it with your own hand and a little reference.'},
    {short:'Own it',title:'This one is all you.',instruction:'Write your signature once from memory.',hint:'Take a quick look if you want one. Then try again when you feel ready. Keep the parts that feel comfortable.',goal:1,time:'one brave try',win:'You made your mark.',message:'You wrote it. Your next small win is waiting.'}
  ];

  const $ = id => document.getElementById(id);
  const storageKey = 'august-signature-studio-v3';
  let storageWorks = true;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { storageWorks = false; }
  const validId = id => Number.isInteger(id) && id >= 0 && id < designs.length;
  const favorites = Array.isArray(saved.favorites) ? [...new Set(saved.favorites.filter(validId))] : [];
  let selected = validId(saved.selected) ? saved.selected : 0;
  let filter = 'all';
  let paperMode = false;
  let freeMode = false;
  let state = {};
  for (const design of designs) {
    const record = saved.progress && saved.progress[design.id];
    const counts = steps.map((step,i) => Math.min(step.goal,Math.max(0,Number.isInteger(record?.counts?.[i]) ? record.counts[i] : 0)));
    state[design.id] = {counts, step:Number.isInteger(record?.step) && record.step >= 0 && record.step < 7 ? record.step : 0};
  }
  if (Number.isFinite(saved.pen) && saved.pen >= 1 && saved.pen <= 8) $('pen-size').value = saved.pen;
  $('pen-value').value = $('pen-size').value;
  const canvas = $('practice-canvas');
  const ctx = canvas.getContext('2d');
  const drafts = new Map();
  const inkComparisons = new Map();
  let strokes = [], activeStroke = null, pointerId = null, hasNewInk = false;
  let artSerial = 0, artworkReady = false;
  let toastTimeout, timerInterval = null, timerEnds = 0, timerRemaining = 30;
  const reviews = saved.reviews && typeof saved.reviews === 'object' ? saved.reviews : {};
  const people = window.augustAutographs || [];
  const peoplePicks = Array.isArray(saved.people) ? [...new Set(saved.people.filter(id=>people.some(p=>p.id===id)))] : [];
  // Version the ranking contract so saved numeric picks never change meaning.
  const peopleBasis = () => 'contrast-v2:' + [...peoplePicks].sort().join('|');
  const tastePicks = saved.tasteBasis === peopleBasis() && Array.isArray(saved.tastes) ? [...new Set(saved.tastes.filter(x => Number.isInteger(x) && x >= 0 && x < 6))] : [];
  let currentStage = 'people';
  const customArtwork = new Map();
  let reviewing = favorites[0] ?? 0, busyRedraw = false, recognition = null;
  const tastePool = [
    {name:'Sharp & fast',note:'Corners, points, forward energy.',families:['tag','quick'],path:'M30 85 L82 20 L64 94 L40 70 L127 43 L101 88 L148 62 L130 92 L205 76',width:5},
    {name:'Soft & looping',note:'Round shapes with room to breathe.',families:['everyday','calligraphy'],path:'M25 80 C70 65 100 5 80 18 C40 40 50 101 93 78 C115 66 132 32 117 32 C96 32 98 93 140 78 C180 65 173 21 155 36 C139 50 159 95 205 72',width:3},
    {name:'Bold marker',note:'Thick lines and a little attitude.',families:['tag','calligraphy'],path:'M28 88 Q55 10 74 33 L63 86 Q83 54 97 56 Q113 61 104 85 L133 48 L126 87 Q151 61 165 70 L196 65 M34 99 Q118 87 205 93',width:10},
    {name:'Fine & flowing',note:'Light lines, long sweeps.',families:['calligraphy','everyday'],path:'M22 83 C68 65 94 3 77 13 C55 26 53 102 92 80 C114 69 111 44 103 53 C92 68 118 90 143 75 C173 55 193 28 181 20 C164 10 145 100 205 73 M48 99 Q132 85 210 94',width:2},
    {name:'Small & simple',note:'A compact mark. Fewer moves.',families:['quick','everyday'],path:'M70 76 L97 41 L92 78 Q107 51 113 64 Q113 79 124 67 L142 50 L136 78 L165 66',width:4},
    {name:'Loose & playful',note:'Bounce, curves, a surprising finish.',families:['tag','everyday'],path:'M25 77 C29 28 67 19 65 50 C63 83 31 97 39 74 C45 58 70 78 83 63 C107 35 105 91 128 71 C141 58 134 34 149 37 C167 42 155 90 181 73 Q198 61 210 70',width:6},
    {name:'Tall & narrow',note:'High strokes, a small footprint.',families:['quick','tag'],path:'M65 91 L86 17 L82 88 Q107 15 108 23 L100 89 Q118 67 123 75 L119 90 L145 21 L138 92 L169 75',width:4},
    {name:'The long exit',note:'Light movement and one finishing sweep.',families:['calligraphy','quick'],path:'M25 78 C68 59 71 32 58 36 C43 41 51 92 82 78 Q102 57 110 78 Q124 91 142 70 L157 81 Q184 98 218 53 M47 103 Q117 81 214 97',width:2},
    {name:'Round & bold',note:'Marker weight. Softer corners.',families:['tag','calligraphy'],path:'M25 82 C29 27 65 19 65 52 C65 88 32 97 39 73 Q57 48 79 70 C101 29 127 48 108 78 Q123 94 143 62 C157 30 180 55 160 77 Q185 91 211 65',width:9},
    {name:'Open & airy',note:'Light strokes with room between them.',families:['everyday','calligraphy'],path:'M18 86 C49 53 71 16 64 35 C54 69 42 97 78 80 M103 80 C111 44 134 44 130 65 Q126 86 145 76 M170 83 C181 62 199 56 215 72',width:2},
    {name:'One joined rhythm',note:'Let one movement lead into the next.',families:['everyday','calligraphy'],path:'M20 81 Q35 48 46 77 C50 88 60 51 65 67 Q72 90 83 70 C97 42 104 79 117 70 C138 55 132 17 124 30 C107 53 133 100 155 75 Q177 50 187 76 Q197 91 217 69',width:4},
    {name:'Angles with a flourish',note:'Sharp starts. A sweeping finish.',families:['tag','quick'],path:'M25 86 L70 24 L56 89 L111 50 L94 88 L147 43 L132 89 L180 61 Q218 36 211 58 Q205 88 92 102',width:5},
    {name:'Street handstyle',note:'Hard corners, stacked strokes, marker edge.',families:['tag'],path:'M20 31 L73 22 M54 27 L36 83 M14 89 L76 73 M69 81 L97 20 L109 82 L146 16 M130 83 L160 20 M145 60 L199 18 L169 59 L197 83 M20 105 L219 88 L208 76 M219 88 L206 102',width:7}
  ].map((t,id)=>({...t,id,features:[['angles','compact'],['loops','open'],['bold','angles'],['fine','connected'],['compact','connected'],['playful','open'],['tall','compact'],['sweep','fine'],['loops','bold'],['open','fine'],['connected','loops'],['angles','sweep'],['bold','angles']][id]}));
  function buildTasteOptions() {
    const picks=people.filter(p=>peoplePicks.includes(p.id));
    const votes={};picks.forEach(p=>p.features.forEach(f=>votes[f]=(votes[f]||0)+1));
    const ranked=tastePool.map(t=>({...t,score:t.features.reduce((sum,f)=>sum+(votes[f]||0),0)+picks.filter(p=>t.features.every(f=>p.features.includes(f))).length*.6}))
      .sort((a,b)=>b.score-a.score||a.id-b.id);
    // Four preference matches plus two deliberate contrasts. Interleave them
    // near the start, not beneath a wall of similar flowing options.
    const matched=ranked.filter(t=>t.id!==12&&t.id!==3).slice(0,4);
    const street=ranked.find(t=>t.id===12),flow=ranked.find(t=>t.id===3);
    return [matched[0],street,matched[1],flow,matched[2],matched[3]].map(t=>{
        const echoes=picks.map(p=>({person:p,match:t.features.filter(f=>p.features.includes(f)).length})).filter(x=>x.match).sort((a,b)=>b.match-a.match).slice(0,2).map(x=>x.person.name);
        const contrast=t.id===12||t.id===3;
        return {...t,contrast,basis:contrast?'Outside your picks · a contrast to explore':echoes.length?`Echoes of ${echoes.join(' + ')}`:'Another direction to explore'};
      });
  }
  let tastes = buildTasteOptions();
  const featureLabels = {angles:'sharp corners',compact:'compact shapes',loops:'rounded loops',open:'open spacing',bold:'bold strokes',fine:'fine lines',connected:'joined letters',sweep:'long finishing sweeps',playful:'playful details',tall:'tall strokes'};
  function preferenceClues(items) {
    const votes={};
    items.forEach(item=>item.features.forEach(feature=>votes[feature]=(votes[feature]||0)+1));
    return Object.keys(votes).sort((a,b)=>votes[b]-votes[a]||a.localeCompare(b)).slice(0,3).map(feature=>featureLabels[feature]).join(', ');
  }
  function renderSignatureClues() {
    const picks=favorites.map(id=>designs[id]);
    $('signature-clues').textContent=picks.length
      ? `Your ${picks.length===1?'pick has':'picks include'} ${preferenceClues(picks)}. Is one of those details what you like? You get to decide. Next, try: “Keep the A, but change the finish.”`
      : 'Tap the artwork, star, or “Pick this one” to save a favorite. Nothing opens yet. One favorite is enough to continue.';
  }
  const artDB = new Promise(resolve => {
    if (!window.indexedDB) return resolve(null);
    const request = indexedDB.open('august-signature-artwork',1);
    request.onupgradeneeded = () => request.result.createObjectStore('art');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
  async function writeArtwork(id, blob) {
    const db = await artDB;
    if (!db) throw new Error('Artwork could not be saved. Allow browser storage and try again.');
    await new Promise((resolve,reject) => {const tx=db.transaction('art','readwrite');tx.objectStore('art').put(blob,id);tx.oncomplete=resolve;tx.onerror=()=>reject(new Error('Artwork could not be saved. Please try again.'));});
  }

  function persist() {
    try { localStorage.setItem(storageKey,JSON.stringify({favorites,selected,reviews,people:peoplePicks,tasteBasis:peopleBasis(),tastes:tastePicks,stage:currentStage,progress:state,pen:Number($('pen-size').value)})); }
    catch { storageWorks = false; }
    if (!storageWorks) document.querySelector('footer span').textContent = 'Browser storage is unavailable. Keep this page open to retain your picks and progress. Drawings stay in memory.';
  }
  function announce(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => $('toast').classList.remove('show'),3500);
  }
  function art(design, decorative = false, original = false, focus = null, boxes = []) {
    if (!original && reviews[design.id]?.useCustom) {
      if (!customArtwork.has(design.id)) return `<span class="artwork-status">${artworkReady ? 'Your revised artwork is unavailable here. Return to Refine to reload it or choose the original.' : 'Loading your approved revision…'}</span>`;
      return `<img class="custom-signature" src="${customArtwork.get(design.id)}" alt="${decorative ? '' : 'Your revised signature; full artwork shown without guessed letter crops'}" ${decorative ? 'aria-hidden="true"' : ''}>`;
    }
    const accessibility = decorative ? 'aria-hidden="true"' : `role="img" aria-label="${focus ? 'Actual artwork focus area; crossing strokes may be visible. ' : ''}Handwritten ${design.text}, ${design.name} design"`;
    const crop = focus || design.crop;
    const [x,y,width,height] = crop, clipId = `ink-crop-${++artSerial}`;
    const [ox,oy,ow,oh] = design.crop;
    const overlay = boxes.map(([left,top,w,h])=>`<rect class="focus-window" x="${ox+ow*left}" y="${oy+oh*top}" width="${ow*w}" height="${oh*h}"/>`).join('');
    return `<svg class="signature-art" viewBox="${crop.join(' ')}" preserveAspectRatio="xMidYMid meet" ${accessibility}><defs><clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath></defs><image href="${design.asset}" width="1254" height="1254" clip-path="url(#${clipId})"/>${overlay}</svg>`;
  }
  function renderFavorites() {
    $('favorite-count').textContent = favorites.length;
    $('filter-count').textContent = favorites.length;
    $('practice-favorites').disabled = favorites.length === 0;
    $('review-picks-bottom').disabled = favorites.length === 0;
    $('practice-favorites').innerHTML = 'Review my picks <span aria-hidden="true">↗</span>';
    $('favorite-slots').innerHTML = favorites.map(id=>`<button type="button" class="favorite-slot filled" data-remove="${id}" aria-label="Remove ${designs[id].name} from favorites" title="${designs[id].name} · tap to remove">${String(id+1).padStart(2,'0')}</button>`).join('');
    document.querySelectorAll('.style-card').forEach(card => {
      const liked = favorites.includes(Number(card.dataset.id));
      card.classList.toggle('is-favorite',liked);
      card.querySelectorAll('[data-favorite]').forEach(button=>{
        button.setAttribute('aria-pressed',String(liked));
        button.setAttribute('aria-label',`${liked ? 'Remove' : 'Pick'} ${designs[card.dataset.id].name}${liked ? ' from favorites' : ' as a favorite'}`);
        if(button.classList.contains('star-button'))button.textContent=liked?'★':'☆';
        if(button.classList.contains('practice-card-button'))button.textContent=liked?'Picked ✓':'Pick this one ☆';
      });
    });
    renderSignatureClues();
    if(!favorites.includes(selected) || !reviews[selected]?.approved)$('practice').hidden=true;
    if(!busyRedraw)updatePracticeOptions();
    updateStageNavigation();
  }
  function renderGallery() {
    const mixed = [0,15,10,5,16,1,6,11,12,17,2,7,8,13,18,3,19,9,4,14];
    const score = d => tastePicks.reduce((sum,t) => sum + (tastes[t]?.families.includes(d.family) ? 1 : 0),0);
    // Keep every family interleaved; preference changes the first choice in
    // each round, never pushes an entire style into a block at the bottom.
    const rounds={};
    const shown = mixed.map(id=>designs[id]).filter(d => filter === 'all' || filter === d.family || (filter === 'favorites' && favorites.includes(d.id))).map(d=>({...d,round:(rounds[d.family]=(rounds[d.family]||0)+1)-1})).sort((a,b)=>a.round-b.round||score(b)-score(a));
    $('style-grid').innerHTML = shown.map(d => `<article class="style-card" data-id="${d.id}">
      <div class="card-top"><span class="design-number">NO. ${String(d.id+1).padStart(2,'0')}</span><button type="button" class="star-button" data-favorite="${d.id}" aria-pressed="false" aria-label="Pick ${d.name} as a favorite">☆</button></div>
      <button class="card-art" type="button" data-favorite="${d.id}" aria-pressed="false" aria-label="Pick ${d.name} as a favorite">${art(d,true)}</button>
      <div class="card-meta"><h3>${d.name}</h3><p>${d.note}</p><p class="detail-cue">Look for: ${d.features.map(feature=>featureLabels[feature]).join(' + ')}. Keep either detail, not necessarily both.</p></div>
      <div class="card-bottom"><span class="family-chip" data-family="${d.family}">${families[d.family]}</span><button type="button" class="practice-card-button" data-favorite="${d.id}" aria-pressed="false" aria-label="Pick ${d.name} as a favorite">Pick this one ☆</button></div>
    </article>`).join('');
    $('empty-message').hidden = shown.length > 0;
    renderFavorites();
  }
  function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index >= 0) {
      favorites.splice(index,1);
      announce(`${designs[id].name} unpicked. Keep only what you like.`);
    } else {
      favorites.push(id);
      announce(`${designs[id].name} picked. ${favorites.length===1?'One is enough to continue.':'Keep browsing, or review your picks when you’re ready.'}`);
    }
    persist();
    if (filter === 'favorites') {
      renderGallery();
      const remainingButton = $('style-grid').querySelector('.star-button');
      (remainingButton || document.querySelector('[data-filter="favorites"]')).focus({preventScroll:true});
    } else renderFavorites();
  }

  function draftKey() { return `${selected}:${state[selected].step}`; }
  function rememberDraft() { drafts.set(draftKey(),{strokes,hasNewInk}); }
  function loadDraft() {
    const draft = drafts.get(draftKey());
    strokes = draft?.strokes || [];
    hasNewInk = draft?.hasNewInk || false;
    activeStroke = null;
    pointerId = null;
  }
  function selectDesign(id, shouldScroll = false) {
    if (!validId(id)) return;
    if (!favorites.includes(id) || !reviews[id]?.approved) { openReview(id); return; }
    finishActiveStroke();
    rememberDraft();
    stopTimer();
    if(selected!==id){$('everyday-check').checked=false;$('everyday-feedback').textContent='';document.querySelectorAll('[data-reflection]').forEach(button=>button.setAttribute('aria-pressed','false'));$('reflection-cue').textContent='Choose one detail, if you want. The next try does not have to fix everything.';}
    selected = id;
    freeMode = false;
    loadDraft();
    persist();
    renderLesson();
    if (shouldScroll) {
      $('practice').scrollIntoView({behavior:reducedMotion() ? 'auto' : 'smooth',block:'start'});
      $('lesson-title').focus({preventScroll:true});
    }
  }
  function setStep(index, focus = true) {
    if (index < 0 || index >= steps.length) return;
    finishActiveStroke();
    rememberDraft();
    stopTimer();
    state[selected].step = index;
    freeMode = false;
    loadDraft();
    persist();
    renderLesson();
    if (focus) $('lesson-title').focus({preventScroll:true});
  }
  function reducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function warmupDemonstration() {
    return '<svg viewBox="65 10 330 175" role="img" aria-label="Optional loose-loop warm-up, not part of the selected signature"><path class="demo-path" d="M100 142 C117 128 155 53 138 49 C110 44 107 143 159 142 C182 141 224 53 206 49 C177 43 177 145 229 142 C254 140 293 54 278 49 C250 43 247 144 300 142 C323 140 347 120 373 117"/><circle class="demo-start" cx="100" cy="142" r="5"/><text class="demo-start-label" x="92" y="164">start</text></svg>';
  }
  const lessons = window.augustSignatureLessons;
  function revisedDesign() { return !!reviews[selected]?.useCustom; }
  function lessonSteps() { return lessons.planFor(designs[selected],steps,revisedDesign()); }
  function courseProgress(record) { return lessons.progress(record.counts,steps); }
  function updateGuides() {
    const current = state[selected].step;
    const design = designs[selected];
    const revised = revisedDesign(), isDemo = current === 0;
    const crop = lessons.focusCrop(design,current,revised);
    const example = isDemo ? warmupDemonstration() : art(design,false,false,crop);
    $('guide-layer').innerHTML = current < 5 ? example : '';
    $('guide-layer').classList.toggle('has-demo',isDemo);
    $('guide-layer').classList.toggle('has-artwork',!isDemo);
    $('guide-layer').classList.remove('demonstrating');
    $('reference-art').innerHTML = example;
    const memory = current === 6 && !freeMode;
    const peeking = memory && $('hint-button').getAttribute('aria-expanded') === 'true';
    $('selected-art').style.visibility = memory && !peeking ? 'hidden' : 'visible';
    $('selected-art').setAttribute('aria-hidden',String(memory && !peeking));
    $('reference-strip').hidden = !(paperMode && !memory) && current !== 5 && !peeking && !freeMode;
    $('reference-strip').classList.toggle('is-focus',!!crop);
    $('reference-label').textContent = isDemo ? 'OPTIONAL WARM-UP' : crop ? `YOUR ${current===1?'A':'F'} · FOCUS AREA` : 'YOUR APPROVED ARTWORK';
    $('lesson-map').hidden = current >= 5;
    $('lesson-map').innerHTML = current < 5 ? art(design,false,false,null,lessons.focusBoxes(design,current,revised)) : '';
    $('lesson-map-caption').textContent = revised ? 'Revised artwork shown whole. No automatic letter crop or verified pen order is available.' : current===0 ? 'Your selected signature, for comparison. The loops below are a separate, optional warm-up.' : crop ? 'Blue box: the area enlarged below. Crossing strokes may overlap it. This is the actual image, not a pen-order diagram.' : current===3 ? 'Blue boxes: the main letters in your actual design. The guide below shows the whole mark—no invented connection.' : current===4 ? 'The guide is your selected artwork, not a substitute practice shape.' : 'A suggested practice sequence, not a verified recording of the artist’s pen order.';
    $('lesson-source').textContent = `YOUR SELECTED DESIGN · ${design.name}${revised?' · revised':''}`;
    $('lesson-why').textContent = lessons.explanation(design,current,revised);
    $('skip-warmup').hidden = current!==0 || freeMode;
    $('draw-wrap').hidden = paperMode;
    $('paper-card').hidden = !paperMode;
    $('drawing-tools').hidden = paperMode;
    $('save-drawing').hidden = paperMode;
    $('canvas-caption').textContent = isDemo ? 'Optional warm-up · not part of your mark.' : crop ? `Your selected ${current===1?'A':'F'} area. Try just the main letter.` : current < 5 ? 'Your actual design. Any comfortable pace.' : current === 5 || freeMode ? 'Look above. Make it your own here.' : 'Try it from memory, or take a quick peek.';
  }
  function renderLesson() {
    const design = designs[selected], record = state[selected], index = record.step, plan = lessonSteps(), step = plan[index];
    $('practice-style').value = String(selected);
    $('selected-art').innerHTML = art(design);
    $('selected-description').textContent = design.note;
    $('ladder-count').textContent = `${courseProgress(record).completed} / 6`;
    $('ladder').innerHTML = plan.map((item,i) => `<li><button type="button" data-step="${i}" ${i===index ? 'aria-current="step"' : ''} class="${record.counts[i] >= item.goal ? 'is-done' : ''}" aria-label="${i===0?'Optional warm-up':`Signature step ${i}`}: ${item.short}${record.counts[i] >= item.goal ? ', completed' : ''}"><span class="step-number" aria-hidden="true">${record.counts[i] >= item.goal ? '✓' : i===0?'↝':i}</span><span>${item.short}${i===0?'<small class="warmup-label"> · optional</small>':''}</span></button></li>`).join('');
    $('step-kicker').textContent = freeMode ? 'YOUR SPACE TO PLAY' : index===0 ? 'OPTIONAL WARM-UP' : `SIGNATURE STEP ${index} OF 6`;
    $('goal-chip').textContent = freeMode ? 'No target. Just you.' : `${step.goal} ${step.goal === 1 ? 'try' : 'tries'} · ${step.time}`;
    $('lesson-title').textContent = freeMode ? 'Keep making it yours.' : step.title;
    $('instruction').textContent = freeMode ? 'Try a smaller version, a faster version, or a new little twist.' : step.instruction;
    $('hint').textContent = step.hint;
    $('hint').hidden = true;
    $('hint-button').setAttribute('aria-expanded','false');
    $('hint-button').innerHTML = `${index === 6 ? 'Take a quick peek' : 'A little hint'} <span aria-hidden="true">+</span>`;
    $('micro-note').textContent = index===0 ? 'Skipping this warm-up does not block the six signature steps or award practice tries.' : 'Practice counts effort, not accuracy. Your earlier tries stay saved; the references now use your selected artwork.';
    updateGuides();
    updateLessonProgress();
    resizeCanvas();
    renderInkJournal();
  }
  function updateLessonProgress() {
    const record = state[selected], index = record.step, plan = lessonSteps(), step = plan[index], count = record.counts[index];
    const done = count >= step.goal;
    const allDone = courseProgress(record).allDone;
    $('rep-dots').innerHTML = Array.from({length:step.goal},(_,i) => `<span class="${i<count?'filled':''}"></span>`).join('');
    $('rep-caption').textContent = freeMode ? 'You set the pace' : `${count} of ${step.goal} ${step.goal === 1 ? 'try' : 'tries'}`;
    $('count-try').disabled = done || (!paperMode && !hasNewInk);
    $('count-try').hidden = freeMode;
    $('keep-session-ink').hidden = !freeMode || paperMode;
    $('keep-session-ink').disabled = !hasNewInk;
    $('step-win').hidden = !done || allDone || freeMode;
    $('finish-card').hidden = !allDone || freeMode;
    $('win-title').textContent = step.win;
    $('win-message').textContent = step.message;
    $('next-step').innerHTML = `${index === 6 ? 'Find my next win' : 'Next tiny win'} <span aria-hidden="true">→</span>`;
    $('lesson-feedback').textContent = freeMode ? 'No score. No finish line. Just a little room to play.' : done ? 'Small win collected. Take a breath.' : count === 0 ? 'One small move is all you need to start.' : count === 1 ? 'That counts. Give it one more easy go.' : 'You are building the feeling. One more.';
    $('ladder-count').textContent = `${courseProgress(record).completed} / 6`;
    document.querySelectorAll('[data-step]').forEach(button => {
      const i = Number(button.dataset.step), complete = record.counts[i] >= steps[i].goal;
      button.classList.toggle('is-done',complete);
      button.querySelector('.step-number').textContent = complete ? '✓' : i===0?'↝':i;
      button.setAttribute('aria-label',`${i===0?'Optional warm-up':`Signature step ${i}`}: ${plan[i].short}${complete ? ', completed' : ''}`);
    });
  }

  function resizeCanvas() {
    if (paperMode) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(3,Math.max(1,window.devicePixelRatio || 1));
    const width = Math.round(rect.width * ratio), height = Math.round(rect.height * ratio);
    if (canvas.width !== width || canvas.height !== height) {canvas.width=width;canvas.height=height;}
    ctx.setTransform(ratio,0,0,ratio,0,0);
    redraw();
  }
  function drawStroke(context,stroke,width,height) {
    const points = stroke.points;
    if (!points.length) return;
    context.save();
    context.strokeStyle = context.fillStyle = '#000000';
    context.lineCap = 'round'; context.lineJoin = 'round';
    if (points.length === 1) {
      context.beginPath();context.arc(points[0].x*width,points[0].y*height,stroke.size/2,0,Math.PI*2);context.fill();
    } else {
      for (let i=1;i<points.length;i++) {
        const previous = points[i-1], point = points[i];
        context.lineWidth = stroke.size * (stroke.pressure ? .55 + (previous.p+point.p)*.65 : 1);
        context.beginPath();context.moveTo(previous.x*width,previous.y*height);context.lineTo(point.x*width,point.y*height);context.stroke();
      }
    }
    context.restore();
  }
  function redraw() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      ctx.clearRect(0,0,rect.width,rect.height);
      strokes.forEach(stroke => drawStroke(ctx,stroke,rect.width,rect.height));
      if (activeStroke) drawStroke(ctx,activeStroke,rect.width,rect.height);
    }
    $('undo').disabled = strokes.length === 0;
    $('save-drawing').disabled = strokes.length === 0;
    $('count-try').disabled = state[selected].counts[state[selected].step] >= steps[state[selected].step].goal || (!paperMode && !hasNewInk);
    $('keep-session-ink').disabled = !hasNewInk || !!activeStroke;
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return {x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height)),p:event.pressure || .5};
  }
  function finishActiveStroke(event) {
    if (!activeStroke || (event && event.pointerId !== pointerId)) return;
    if (event && event.type !== 'pointerup') {
      activeStroke=null;pointerId=null;rememberDraft();redraw();return;
    }
    if (event?.type === 'pointerup') activeStroke.points.push(point(event));
    strokes.push(activeStroke);
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    activeStroke = null; pointerId = null; hasNewInk = true;
    rememberDraft(); redraw();
  }
  canvas.addEventListener('pointerdown',event => {
    if (pointerId !== null || event.button > 0 || !event.isPrimary || strokes.length >= 128) return;
    event.preventDefault();
    pointerId = event.pointerId;
    canvas.setPointerCapture(pointerId);
    activeStroke = {size:Number($('pen-size').value),pressure:event.pointerType === 'pen',points:[point(event)]};
    redraw();
  });
  canvas.addEventListener('pointermove',event => {
    if (event.pointerId !== pointerId || !activeStroke) return;
    event.preventDefault();
    const events = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event];
    (events.length ? events : [event]).forEach(item=>{if(activeStroke.points.length<8192)activeStroke.points.push(point(item));});
    redraw();
  });
  canvas.addEventListener('pointerup',finishActiveStroke);
  canvas.addEventListener('pointercancel',finishActiveStroke);
  canvas.addEventListener('lostpointercapture',finishActiveStroke);
  function clearInk() {
    finishActiveStroke(); strokes=[]; activeStroke=null;pointerId=null;hasNewInk=false;rememberDraft();redraw();
  }
  function renderInkJournal() {
    const comparison=inkComparisons.get(selected);
    $('download-comparison').disabled=$('forget-comparison').disabled=!comparison;
    if(!comparison){
      $('ink-comparison').innerHTML='<p class="journal-empty">Your first whole mark will go here. No score. Just your own handwriting to look back on.</p>';
      $('ink-session-status').textContent=sessionInk?paperMode?'Paper stays on your paper. Keep the first try beside the latest.':'Whole-mark screen attempts will appear when you count them.':'The comparison tool did not load. Your gallery, drawing pad and progress still work. Refresh to try the comparison again.';
      return;
    }
    $('ink-comparison').innerHTML=[['First whole-mark try',comparison.first],['Latest whole-mark try',comparison.latest]].map(([label,shot])=>`<figure><figcaption>${label}<small>${shot.label}</small></figcaption><svg class="own-ink" viewBox="0 0 1000 ${shot.height}" role="img" aria-label="${label}">${shot.paths.map(path=>`<path d="${path.d}" stroke-width="${path.width}"/>`).join('')}</svg></figure>`).join('');
    $('ink-session-status').textContent=`${comparison.count} whole-mark ${comparison.count===1?'attempt kept':'attempts seen'} this session. Guidance levels are labeled, not graded.`;
  }
  function keepWholeInk() {
    if(!sessionInk || paperMode || activeStroke || !hasNewInk)return;
    const index=state[selected].step;
    if(!freeMode && index<4)return;
    const rect=canvas.getBoundingClientRect();
    const visible=index<6 || $('hint-button').getAttribute('aria-expanded')==='true' || freeMode;
    const snapshot=sessionInk.captureInk(strokes,{width:rect.width,height:rect.height,mode:freeMode?'open':index===4?'trace':index===5?'copy':'memory',guideVisible:visible});
    if(snapshot)inkComparisons.set(selected,sessionInk.keepInk(inkComparisons.get(selected),snapshot));
    renderInkJournal();
  }
  function setFocusMode(on) {
    $('practice').classList.toggle('is-focused',on);
    $('focus-move').setAttribute('aria-pressed',String(on));
    $('focus-move').textContent=on?'Show my practice path':'Focus on this move';
    $('focus-caption').textContent=on?'One move in view. Escape brings back the path.':'Less on screen. Same saved progress.';
    resizeCanvas();
  }

  function stageReady(stage) {
    const peopleDone=peoplePicks.length>0;
    return stage==='people'||(stage==='style-discovery'&&peopleDone)||(stage==='collection'&&peopleDone)||(stage==='review'&&peopleDone&&favorites.length>0)||(stage==='practice'&&peopleDone&&favorites.some(id=>reviews[id]?.approved));
  }
  function updateStageNavigation() {
    document.querySelectorAll('.studio-journey [data-stage]').forEach(button=>{
      button.disabled=!stageReady(button.dataset.stage);
      if(button.dataset.stage===currentStage)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    });
  }
  function showStage(stage,focus=true) {
    if(busyRedraw&&stage!=='review'){announce('Your redraw is still working. Your original is safe.');return false;}
    if(!stageReady(stage)){announce(!peoplePicks.length?'Pick one inspiration mark first. One is enough.':!favorites.length?'Pick one signature first. You don’t need more than one.':'Approve a favorite in Refine before learning it.');return false;}
    if(currentStage==='practice'&&stage!=='practice'){finishActiveStroke();rememberDraft();stopTimer();}
    if(currentStage==='review'&&stage!=='review')recognition?.stop();
    currentStage=stage;
    ['people','style-discovery','collection','review','practice'].forEach(id=>$(id).hidden=id!==stage);
    updateStageNavigation();persist();
    if(stage==='style-discovery')renderTastes();
    if(stage==='collection')renderGallery();
    if(stage==='review'){if(!favorites.includes(reviewing))reviewing=favorites[0];renderReview();}
    if(stage==='practice'){
      const approved=updatePracticeOptions();
      selectDesign(approved.includes(selected)?selected:approved[0],false);
    }
    if(focus){
      const heading=$(stage).querySelector('h1,h2');
      $(stage).scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});
      heading?.focus({preventScroll:true});
    }
    return true;
  }
  function autographImage(p) {
    if(!p.crop)return `<img src="${p.image}" alt="${p.kind==='study'?'Original street handstyle study':p.name+'’s handwritten autograph sample'}">`;
    const [x,y,width,height]=p.crop.trim().split(/\s+/).map(Number),clipId=`autograph-crop-${++artSerial}`;
    // A viewBox scales content but does not clip its letterboxed margins.
    // Explicit clipping keeps the book edge/surroundings out of the sample.
    return `<svg viewBox="${p.crop}" role="img" aria-label="${p.name}’s handwritten autograph"><defs><clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath></defs><image href="${p.image}" width="${p.size[0]}" height="${p.size[1]}" clip-path="url(#${clipId})"/></svg>`;
  }
  function renderPeople() {
    if(!$('people-grid').children.length){
      $('people-grid').innerHTML=people.map(p=>`<article data-person-card="${p.id}"><span class="inspiration-kind">${p.kind==='study'?'STREET-STYLE WILDCARD':'AUTOGRAPH SAMPLE'} · ${p.group}</span><button type="button" class="autograph-pick" data-person="${p.id}" aria-pressed="false" aria-label="Pick ${p.name}"><span class="people-art">${autographImage(p)}</span><span class="pick-label">Pick this mark ☆</span></button><h3>${p.name}</h3><p>${p.note}</p><details class="autograph-source"><summary>Source &amp; attribution</summary>${p.source?`<a href="${p.source}" target="_blank" rel="noopener noreferrer">${p.credit}</a><p>Display normalized to black ink on white. Original source linked above.</p>`:`<p>${p.credit}</p>`}${p.license?`<a href="https://creativecommons.org/licenses/by-sa/${p.license}/" target="_blank" rel="noopener noreferrer">CC BY-SA ${p.license} · monochrome display treatment</a>`:''}</details></article>`).join('');
    }
    people.forEach(p=>{
      const picked=peoplePicks.includes(p.id),button=document.querySelector(`[data-person="${p.id}"]`);
      button.setAttribute('aria-pressed',String(picked));
      button.setAttribute('aria-label',`${picked?'Remove':'Pick'} ${p.name}`);
      button.querySelector('.pick-label').textContent=picked?'Picked ✓ · tap to unpick':'Pick this mark ☆';
      button.closest('article').classList.toggle('is-picked',picked);
    });
    $('people-count').textContent=`${peoplePicks.length} picked`;
    $('people-next').disabled=$('people-next-bottom').disabled=peoplePicks.length===0;
    $('people-status').textContent=peoplePicks.length?'Ready when you are. Keep exploring, or continue with these picks.':'Pick one that catches your eye. No need to fill a quota.';
    updateStageNavigation();
  }
  function togglePerson(id) {
    if(!people.some(p=>p.id===id))return;
    const index=peoplePicks.indexOf(id);
    if(index>=0)peoplePicks.splice(index,1);
    else peoplePicks.push(id);
    const hadStyles=tastePicks.length>0;
    tastePicks.splice(0);tastes=buildTasteOptions();
    renderPeople();renderTastes();persist();
    announce(hadStyles?'Your style options are refreshed. Pick any you like, or skip that round.':peoplePicks.length?`${peoplePicks.length} picked. You can continue whenever you’re ready.`:'No picks yet. Find one detail you like.');
  }
  function renderTastes() {
    $('taste-grid').innerHTML=tastes.map((t,i)=>`<button class="taste-choice" type="button" data-taste="${i}" data-profile="${t.id}" aria-pressed="${tastePicks.includes(i)}"><svg viewBox="0 0 240 120" aria-hidden="true"><path d="${t.path}" stroke-width="${t.width}"/></svg><strong>${t.name}</strong><span>${t.note}</span><span class="detail-cue">Notice: ${t.features.map(feature=>featureLabels[feature]).join(' + ')}. Which detail would you keep?</span><span class="taste-origin">${t.basis}</span><span class="taste-check">${tastePicks.includes(i)?'Picked ✓ · tap to unpick':'Pick this feel ☆'}</span></button>`).join('');
    $('taste-explanation').textContent='Four directions explore details in your inspiration picks. Two contrasts keep street-style edge and fine, flowing lines in view. Pick just the ones you like, or skip ahead if none feel right. All 20 signature designs will still be there.';
    $('taste-clues').textContent=peoplePicks.length?`Your inspiration picks include ${preferenceClues(people.filter(p=>peoplePicks.includes(p.id)))}. Maybe one of those details drew you in. Compare the shapes below and see if that fits.`:'Look for a shape or movement you would enjoy making. You decide what fits.';
    $('taste-reflection').textContent=tastePicks.length?`In your style picks: ${preferenceClues(tastePicks.map(index=>tastes[index]))}. If that sounds right, look for those parts in your name next. These are clues, not rules.`:'No need to choose just to move on. Your inspiration picks are already enough to start.';
    $('taste-count').textContent=`${tastePicks.length} picked · optional`;
    ['show-signatures','show-signatures-bottom'].forEach(id=>{
      $(id).disabled=peoplePicks.length===0;
      $(id).textContent=tastePicks.length?'See my signatures →':'Skip to my signatures →';
    });
    $('taste-status').textContent=tastePicks.length?'Ready whenever you are. One style is enough; more are welcome.':'Nothing here? You can go straight to your name.';
    updateStageNavigation();
  }
  function reviewRecord(id) {return reviews[id] || (reviews[id]={feedback:'',approved:false,useCustom:false});}
  function openReview(id) {
    if (busyRedraw) return;
    if (!favorites.includes(id)) {
      toggleFavorite(id);
    }
    reviewing=id;
    showStage('review');
  }
  function renderReview() {
    const record=reviewRecord(reviewing),design=designs[reviewing];
    $('review-design').innerHTML='';
    favorites.forEach(id=>{const option=document.createElement('option');option.value=id;option.textContent=designs[id].name+(reviews[id]?.approved?' ✓':'');$('review-design').appendChild(option);});
    $('review-design').value=String(reviewing);
    $('review-original').innerHTML=art(design,false,true);
    $('review-current').innerHTML=art(design);
    $('revision-label').textContent=record.useCustom?'Your revised version':'Your starting version';
    $('revision-feedback').value=record.feedback||'';
    const approved=favorites.filter(id=>reviews[id]?.approved).length;
    $('review-count').textContent=`${approved} of ${favorites.length} approved`;
    $('start-approved').disabled=approved===0;
    $('approve-signature').textContent=record.approved?'Approved ✓':'I like this one ✓';
  }
  function updatePracticeOptions() {
    const approved=favorites.filter(id=>reviews[id]?.approved);
    $('practice-style').innerHTML='';
    approved.forEach(id=>{const option=document.createElement('option');option.value=id;option.textContent=designs[id].name+(reviews[id]?.useCustom?' · Your revision':'');$('practice-style').appendChild(option);});
    return approved;
  }
  async function revisionSource(id) {
    const design=designs[id],image=new Image();
    image.src=reviews[id]?.useCustom&&customArtwork.has(id)?customArtwork.get(id):design.asset;
    await image.decode();
    const source=document.createElement('canvas');source.width=1536;source.height=1024;
    const context=source.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,1536,1024);
    const crop=reviews[id]?.useCustom&&customArtwork.has(id)?[0,0,image.naturalWidth,image.naturalHeight]:design.crop;
    const scale=Math.min(1400/crop[2],740/crop[3]),width=crop[2]*scale,height=crop[3]*scale;
    context.drawImage(image,...crop,(1536-width)/2,(1024-height)/2,width,height);
    return new Promise((resolve,reject)=>source.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not prepare the signature.')), 'image/png'));
  }
  async function redrawSignature() {
    if(busyRedraw)return;
    const feedback=$('revision-feedback').value.trim(),code=$('family-code').value;
    if(!feedback){$('revision-status').textContent='Tell us one thing you would like to change first.';$('revision-feedback').focus();return;}
    if(!code){$('revision-status').textContent='Ask Eric to enter your family code under Family setup first.';document.querySelector('.family-setup').open=true;$('family-code').focus();return;}
    const id=reviewing;
    busyRedraw=true;
    ['redraw-signature','approve-signature','keep-original','review-design','dictate-feedback','start-approved','back-gallery'].forEach(key=>$(key).disabled=true);
    $('revision-status').dataset.error='false';
    $('revision-status').textContent='Drawing your new version. This can take a minute or two. Your original is safe.';
    $('redraw-signature').setAttribute('aria-busy','true');
    try {
      const form=new FormData();form.append('image',await revisionSource(id),'signature.png');form.append('feedback',feedback);form.append('text',designs[id].text);form.append('code',code);
      const response=await fetch('/api/augustsignature/redraw',{method:'POST',body:form,signal:AbortSignal.timeout(240000)});
      if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.error||'The redraw could not finish. Your feedback is saved; try again.');}
      const blob=await response.blob();
      if(!blob.type.startsWith('image/'))throw new Error('The redraw did not return artwork. Please try again.');
      await writeArtwork(id,blob);
      inkComparisons.delete(id);
      const old=customArtwork.get(id);if(old)URL.revokeObjectURL(old);
      customArtwork.set(id,URL.createObjectURL(blob));
      Object.assign(reviewRecord(id),{feedback,approved:false,useCustom:true});
      state[id]={counts:steps.map(()=>0),step:0};
      for(const key of drafts.keys())if(key.startsWith(`${id}:`))drafts.delete(key);
      if(selected===id){strokes=[];hasNewInk=false;renderLesson();}
      persist();renderGallery();renderReview();
      $('revision-status').textContent='Here’s your revision. Check the letters and spelling. Keep it, ask for another change, or use the original.';
    } catch(error){$('revision-status').dataset.error='true';$('revision-status').textContent=error.name==='TimeoutError'?'That took too long. Your original and feedback are saved. Please try again.':error.message;}
    finally{busyRedraw=false;['redraw-signature','approve-signature','keep-original','review-design','dictate-feedback','back-gallery'].forEach(key=>$(key).disabled=false);$('redraw-signature').removeAttribute('aria-busy');renderReview();}
  }
  $('taste-grid').addEventListener('click',event=>{const button=event.target.closest('[data-taste]');if(!button)return;const id=Number(button.dataset.taste),index=tastePicks.indexOf(id);if(index>=0)tastePicks.splice(index,1);else tastePicks.push(id);persist();renderTastes();renderGallery();document.querySelector(`[data-taste="${id}"]`).focus({preventScroll:true});announce(tastePicks.length?`${tastePicks.length} picked. Continue whenever you’re ready.`:'No styles picked. You can skip straight to your signatures.');});
  $('show-signatures').addEventListener('click',()=>showStage('collection'));
  $('show-signatures-bottom').addEventListener('click',()=>showStage('collection'));
  $('people-grid').addEventListener('click',event=>{const button=event.target.closest('[data-person]');if(button)togglePerson(button.dataset.person);});
  $('people-next').addEventListener('click',()=>showStage('style-discovery'));
  $('people-next-bottom').addEventListener('click',()=>showStage('style-discovery'));
  document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>showStage(button.dataset.stage)));
  $('review-design').addEventListener('change',event=>{recognition?.stop();reviewing=Number(event.target.value);renderReview();$('revision-status').textContent='Keep what you love, or ask for a little change.';});
  $('revision-feedback').addEventListener('input',()=>{reviewRecord(reviewing).feedback=$('revision-feedback').value;persist();});
  $('redraw-signature').addEventListener('click',redrawSignature);
  $('keep-original').addEventListener('click',()=>{Object.assign(reviewRecord(reviewing),{useCustom:false,approved:false});inkComparisons.delete(reviewing);state[reviewing]={counts:steps.map(()=>0),step:0};for(const key of drafts.keys())if(key.startsWith(`${reviewing}:`))drafts.delete(key);if(selected===reviewing){strokes=[];hasNewInk=false;renderLesson();}persist();renderReview();renderGallery();$('revision-status').textContent='Back to the original. You can approve it or ask for a different change.';});
  $('approve-signature').addEventListener('click',()=>{reviewRecord(reviewing).approved=true;persist();renderReview();updatePracticeOptions();updateStageNavigation();const next=favorites.find(id=>!reviews[id]?.approved);$('revision-status').textContent=next===undefined?'Your picks are ready. Let’s learn one small move at a time.':'Small decision, big step. Your next favorite is ready to review.';if(next!==undefined){reviewing=next;renderReview();}});
  $('start-approved').addEventListener('click',()=>showStage('practice'));
  $('back-gallery').addEventListener('click',()=>showStage('collection'));
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  $('dictate-feedback').addEventListener('click',()=>{
    if(!Speech){$('speech-status').textContent='Voice input is unavailable here. On your Chromebook, you can also use keyboard dictation, or type your changes.';return;}
    if(recognition){recognition.stop();return;}
    const target=reviewing,base=$('revision-feedback').value.trim();
    const speech=new Speech();recognition=speech;speech.lang='en-US';speech.interimResults=true;speech.continuous=false;
    speech.onstart=()=>{$('dictate-feedback').setAttribute('aria-pressed','true');$('dictate-feedback').textContent='Stop listening ■';$('speech-status').textContent='Listening. Say the changes you want. Nothing sends until you tap Redraw.';};
    speech.onresult=event=>{if(target!==reviewing)return;const words=Array.from(event.results).map(result=>result[0].transcript).join(' ');$('revision-feedback').value=[base,words].filter(Boolean).join(' ').slice(0,1000);reviewRecord(target).feedback=$('revision-feedback').value;persist();};
    speech.onerror=event=>{$('speech-status').textContent=event.error==='not-allowed'?'Microphone permission was not granted. You can type your changes instead.':'Voice input stopped. Your words are saved. You can type or try again.';};
    speech.onend=()=>{recognition=null;$('dictate-feedback').setAttribute('aria-pressed','false');$('dictate-feedback').textContent='Speak my changes 🎙';};
    try{speech.start();}catch{recognition=null;$('speech-status').textContent='Could not start the microphone. Please type or try again.';}
  });
  artDB.then(async db=>{
    if(db){
      const records=await new Promise(resolve=>{const request=db.transaction('art').objectStore('art').getAllKeys();request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve([]);});
      for(const id of records){
        if(!validId(id))continue;
        const blob=await new Promise(resolve=>{const request=db.transaction('art').objectStore('art').get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);});
        if(blob instanceof Blob)customArtwork.set(id,URL.createObjectURL(blob));
      }
    }
    artworkReady=true;renderGallery();if(!$('review').hidden)renderReview();renderLesson();
  });
  fetch('/api/augustsignature/redraw').then(response=>response.json()).then(data=>{$('service-status').textContent=data.ready?'Automatic redraws are ready. Enter the family code to use them.':'Automatic redraws need Eric to finish the image-service setup. Feedback and favorites can still be saved.';if(!data.ready){$('revision-status').textContent='Redraws are waiting for Eric to connect the image service. Save your ideas here, or approve an original to practice for now.';}}).catch(()=>{$('service-status').textContent='The redraw service could not be reached. Your ideas can still be saved.';});

  function stopTimer() {
    clearInterval(timerInterval);timerInterval=null;timerEnds=0;timerRemaining=30;
    $('timer-label').textContent = 'Optional 30-second focus';
    $('timer-button').setAttribute('aria-label','Start an optional 30 second practice timer');
  }
  function startTimer() {
    if (timerInterval) {stopTimer();announce('Timer stopped. Keep your own pace.');return;}
    timerEnds = Date.now()+timerRemaining*1000;
    const tick = () => {
      const remaining = Math.max(0,Math.ceil((timerEnds-Date.now())/1000));
      $('timer-label').textContent = `${remaining}s · stop timer`;
      $('timer-button').setAttribute('aria-label',`${remaining} seconds remaining. Stop timer`);
      if (remaining===0) {
        stopTimer();
        $('lesson-feedback').textContent = 'Thirty seconds for you. Nice. Rest your hand whenever you like.';
        announce('Focus time complete. Take a little hand stretch.');
      }
    };
    timerInterval=setInterval(tick,250);tick();
  }

  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    filter=button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    renderGallery();
  }));
  $('style-grid').addEventListener('click',event=>{
    const favoriteButton=event.target.closest('[data-favorite]');
    if(favoriteButton) toggleFavorite(Number(favoriteButton.dataset.favorite));
  });
  $('favorite-slots').addEventListener('click',event=>{
    const button=event.target.closest('[data-remove]');
    if(button){toggleFavorite(Number(button.dataset.remove));$('practice-favorites').focus({preventScroll:true});}
  });
  $('practice-favorites').addEventListener('click',()=>{if(favorites.length)openReview(favorites[0]);});
  $('review-picks-bottom').addEventListener('click',()=>{if(favorites.length)openReview(favorites[0]);});
  $('practice-style').innerHTML = Object.entries(families).map(([key,label])=>`<optgroup label="${label}">${designs.filter(d=>d.family===key).map(d=>`<option value="${d.id}">${String(d.id+1).padStart(2,'0')} · ${d.name}</option>`).join('')}</optgroup>`).join('');
  $('practice-style').addEventListener('change',event=>selectDesign(Number(event.target.value)));
  $('ladder').addEventListener('click',event=>{const button=event.target.closest('[data-step]');if(button)setStep(Number(button.dataset.step));});
  $('hint-button').addEventListener('click',()=>{
    const expanded=$('hint-button').getAttribute('aria-expanded')!=='true';
    $('hint-button').setAttribute('aria-expanded',String(expanded));$('hint').hidden=!expanded;
    $('hint-button').querySelector('span').textContent=expanded?'−':'+';
    updateGuides();
    if(expanded && state[selected].step===0 && !reducedMotion()){
      $('guide-layer').classList.remove('demonstrating');
      requestAnimationFrame(()=>$('guide-layer').classList.add('demonstrating'));
    }
  });
  $('paper-mode').addEventListener('change',event=>{finishActiveStroke();paperMode=event.target.checked;updateGuides();updateLessonProgress();renderInkJournal();resizeCanvas();});
  $('count-try').addEventListener('click',()=>{
    const record=state[selected],index=record.step;
    if(record.counts[index]>=steps[index].goal || activeStroke || (!paperMode && !hasNewInk))return;
    keepWholeInk();
    record.counts[index]++;
    hasNewInk=false;
    if(record.counts[index]<steps[index].goal)clearInk();else rememberDraft();
    persist();updateLessonProgress();
    if(record.counts[index]>=steps[index].goal){
      announce(lessonSteps()[index].win);
      const allDone=courseProgress(record).allDone;
      (allDone?$('free-practice'):$('next-step')).focus({preventScroll:true});
    }
  });
  $('next-step').addEventListener('click',()=>{
    const record=state[selected];let next=record.step+1;
    if(next>=steps.length)next=record.counts.findIndex((value,i)=>value<steps[i].goal);
    if(next>=0)setStep(next);
  });
  $('skip-warmup').addEventListener('click',()=>{setStep(1);announce('Straight to your selected A. No warm-up tries were added.');});
  $('free-practice').addEventListener('click',()=>{
    setStep(6,false);freeMode=true;clearInk();renderLesson();$('lesson-title').focus({preventScroll:true});
  });
  $('another-style').addEventListener('click',()=>{
    const pool=favorites.filter(id=>reviews[id]?.approved);
    if(!pool.length)return;
    const next=pool[(pool.indexOf(selected)+1)%pool.length];selectDesign(next,true);
  });
  $('undo').addEventListener('click',()=>{finishActiveStroke();strokes.pop();hasNewInk=strokes.length>0;rememberDraft();redraw();});
  $('clear').addEventListener('click',clearInk);
  $('keep-session-ink').addEventListener('click',()=>{keepWholeInk();clearInk();announce('Whole-mark try kept for this session. No course counts were changed.');});
  $('download-comparison').addEventListener('click',()=>sessionInk?.downloadComparison(inkComparisons.get(selected),"August's signature practice"));
  $('forget-comparison').addEventListener('click',()=>{inkComparisons.delete(selected);renderInkJournal();announce('Session pictures forgotten. Practice counts stay saved.');});
  $('focus-move').addEventListener('click',()=>setFocusMode($('focus-move').getAttribute('aria-pressed')!=='true'));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')setFocusMode(false);});
  $('everyday-check').addEventListener('change',event=>{$('everyday-feedback').textContent=event.target.checked?'A useful check. Keep the comfortable parts. This does not add practice counts or claim mastery.':'';});
  if(sessionInk)$('reflection-choices').innerHTML=sessionInk.reflectionChoices.map(choice=>`<button type="button" data-reflection="${choice.id}" aria-pressed="false">${choice.label}</button>`).join('');
  $('reflection-choices').addEventListener('click',event=>{const button=event.target.closest('[data-reflection]');if(!button)return;document.querySelectorAll('[data-reflection]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));$('reflection-cue').textContent=sessionInk.reflectionChoices.find(choice=>choice.id===button.dataset.reflection).cue;});
  $('print-practice').addEventListener('click',()=>{
    const design=designs[selected],step=lessonSteps()[state[selected].step];
    $('practice-print').innerHTML=`<h1>August's signature practice</h1><p>${design.name} · ${step.title}</p><p>${step.instruction}</p><h2>Look, then try.</h2><div class="print-reference">${art(design)}</div><p>Trace the light guide, copy with a reference, then try a blank line. Keep the first try for comparison.</p>${[0,1,2,3].map(i=>`<div class="paper-practice-row">${i<2?art(design):''}</div>`).join('')}<h2>Now try an everyday size.</h2><p>The reference fits in a 72 mm space. Print at 100% for the intended size. Try it three times at a comfortable pace.</p><div class="paper-everyday">${art(design)}<div></div><div></div><div></div></div><p>Small differences are normal. Keep a version you can repeat without carefully drawing each letter.</p>`;
    window.print();
  });
  $('pen-size').addEventListener('input',()=>{$('pen-value').value=$('pen-size').value;persist();});
  $('timer-button').addEventListener('click',startTimer);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden && timerInterval){stopTimer();$('timer-label').textContent='Timer paused · start 30 seconds';}
  });
  $('save-drawing').addEventListener('click',()=>{
    if(!strokes.length)return;
    const output=document.createElement('canvas');const rect=canvas.getBoundingClientRect();
    output.width=1400;output.height=Math.round(1400*(rect.height/rect.width || .4));
    const out=output.getContext('2d');out.fillStyle='#ffffff';out.fillRect(0,0,output.width,output.height);
    const scale=1400/(rect.width || 700);
    strokes.forEach(stroke=>drawStroke(out,{...stroke,size:stroke.size*scale},output.width,output.height));
    const link=document.createElement('a');link.download=`august-${designs[selected].name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-practice.png`;link.href=output.toDataURL('image/png');link.click();
    announce('Your ink is saved as a picture. Nice work.');
  });

  $('hero-signature').innerHTML=`<svg class="signature-art hero-motion" viewBox="0 0 240 120" aria-hidden="true"><path d="${tastes[1].path}" stroke-width="3"/></svg>`;
  $('hero-tag').innerHTML=`<svg class="signature-art hero-motion" viewBox="0 0 240 120" aria-hidden="true"><path d="${tastes[0].path}" stroke-width="6"/></svg>`;
  renderPeople();renderTastes();renderGallery();loadDraft();renderLesson();updatePracticeOptions();
  showStage(stageReady(saved.stage)?saved.stage:'people',false);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resizeCanvas).observe($('draw-wrap'));
  else window.addEventListener('resize',resizeCanvas);
})();
