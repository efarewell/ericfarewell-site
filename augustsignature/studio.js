(() => {
  'use strict';

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
  ].map((d,id) => ({...d,id,asset:`assets/${d.family}-ink.png`}));

  const steps = [
    {short:'Flow',title:'Start with a little flow.',instruction:'Follow the three loops once. Keep your hand loose.',hint:'Rest your hand. Let your fingers hold the pen lightly. Follow the blue starting dot into the loops. One pass through all three loops is one try.',goal:3,time:'about 20 sec',win:'First spark.',message:'You showed up and got moving. That counts.'},
    {short:'Your A',title:'Give your A some attitude.',instruction:'Make one A: climb, come down, then cross.',hint:'This is a simple practice shape for your A. Make it big enough to feel the movement. Later, borrow the details you love from your chosen design.',goal:3,time:'about 30 sec',win:'A is yours.',message:'One letter. Three attempts. A real little win.'},
    {short:'Your F',title:'Find your F.',instruction:'Pull the tall stroke down. Add its two cross-strokes.',hint:'Start at the blue dot. Make the long stroke first, then the top and middle strokes. You can lift your pen between them.',goal:3,time:'about 30 sec',win:'Two strong starts.',message:'Your A and F now have something to build on.'},
    {short:'Connect',title:'Make a little connection.',instruction:'Follow the low curve into one tall loop.',hint:'This warm-up is for the way letters connect. Let the curve carry you into the next stroke. It is okay to lift the pen whenever that feels easier.',goal:3,time:'about 20 sec',win:'Finding your rhythm.',message:'You practiced the move between the letters.'},
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
  const favorites = Array.isArray(saved.favorites) ? [...new Set(saved.favorites.filter(validId))].slice(0,5) : [];
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
  let strokes = [], activeStroke = null, pointerId = null, hasNewInk = false;
  let artSerial = 0;
  let toastTimeout, timerInterval = null, timerEnds = 0, timerRemaining = 30;
  const reviews = saved.reviews && typeof saved.reviews === 'object' ? saved.reviews : {};
  const tastePicks = Array.isArray(saved.tastes) ? saved.tastes.filter(x => Number.isInteger(x) && x >= 0 && x < 6).slice(0,3) : [];
  const customArtwork = new Map();
  let reviewing = favorites[0] ?? 0, busyRedraw = false, recognition = null;
  const tastes = [
    {name:'Sharp & fast',note:'Corners, points, forward energy.',families:['tag','quick'],path:'M30 85 L82 20 L64 94 L40 70 L127 43 L101 88 L148 62 L130 92 L205 76',width:5},
    {name:'Soft & looping',note:'Round shapes with room to breathe.',families:['everyday','calligraphy'],path:'M25 80 C70 65 100 5 80 18 C40 40 50 101 93 78 C115 66 132 32 117 32 C96 32 98 93 140 78 C180 65 173 21 155 36 C139 50 159 95 205 72',width:3},
    {name:'Bold marker',note:'Thick lines and a little attitude.',families:['tag','calligraphy'],path:'M28 88 Q55 10 74 33 L63 86 Q83 54 97 56 Q113 61 104 85 L133 48 L126 87 Q151 61 165 70 L196 65 M34 99 Q118 87 205 93',width:10},
    {name:'Fine & flowing',note:'Light lines, long sweeps.',families:['calligraphy','everyday'],path:'M22 83 C68 65 94 3 77 13 C55 26 53 102 92 80 C114 69 111 44 103 53 C92 68 118 90 143 75 C173 55 193 28 181 20 C164 10 145 100 205 73 M48 99 Q132 85 210 94',width:2},
    {name:'Small & simple',note:'A compact mark. Fewer moves.',families:['quick','everyday'],path:'M58 87 L100 27 L91 85 M66 67 L114 57 M111 84 L135 34 M119 44 L166 31 M119 64 L151 55',width:4},
    {name:'Loose & playful',note:'Bounce, curves, a surprising finish.',families:['tag','everyday'],path:'M25 77 C29 28 67 19 65 50 C63 83 31 97 39 74 C45 58 70 78 83 63 C107 35 105 91 128 71 C141 58 134 34 149 37 C167 42 155 90 181 73 Q198 61 210 70',width:6}
  ];
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
    try { localStorage.setItem(storageKey,JSON.stringify({favorites,selected,reviews,tastes:tastePicks,progress:state,pen:Number($('pen-size').value)})); }
    catch { storageWorks = false; }
    if (!storageWorks) document.querySelector('footer span').textContent = 'Browser storage is unavailable. Keep this page open to retain your picks and progress. Drawings stay in memory.';
  }
  function announce(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => $('toast').classList.remove('show'),3500);
  }
  function art(design, decorative = false, original = false) {
    if (!original && customArtwork.has(design.id) && reviews[design.id]?.useCustom) {
      return `<img class="custom-signature" src="${customArtwork.get(design.id)}" alt="${decorative ? '' : 'Your revised signature'}" ${decorative ? 'aria-hidden="true"' : ''}>`;
    }
    const accessibility = decorative ? 'aria-hidden="true"' : `role="img" aria-label="Handwritten ${design.text}, ${design.name} design"`;
    const [x,y,width,height] = design.crop, clipId = `ink-crop-${++artSerial}`;
    return `<svg class="signature-art" viewBox="${design.crop.join(' ')}" preserveAspectRatio="xMidYMid meet" ${accessibility}><defs><clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath></defs><image href="${design.asset}" width="1254" height="1254" clip-path="url(#${clipId})"/></svg>`;
  }
  function renderFavorites() {
    $('favorite-count').textContent = favorites.length;
    $('filter-count').textContent = favorites.length;
    $('practice-favorites').disabled = favorites.length === 0;
    $('practice-favorites').innerHTML = 'Review my picks <span aria-hidden="true">↗</span>';
    $('favorite-slots').innerHTML = Array.from({length:5},(_,i) => {
      const id = favorites[i];
      return id === undefined ? '<span class="favorite-slot" aria-label="Empty favorite slot">✧</span>' : `<button type="button" class="favorite-slot filled" data-remove="${id}" aria-label="Remove ${designs[id].name} from favorites" title="${designs[id].name} · tap to remove">${String(id+1).padStart(2,'0')}</button>`;
    }).join('');
    document.querySelectorAll('.style-card').forEach(card => {
      const liked = favorites.includes(Number(card.dataset.id));
      card.classList.toggle('is-favorite',liked);
      const button = card.querySelector('.star-button');
      button.setAttribute('aria-pressed',String(liked));
      button.setAttribute('aria-label',`${liked ? 'Remove' : 'Add'} ${designs[card.dataset.id].name} ${liked ? 'from' : 'to'} your five favorites`);
      button.textContent = liked ? '★' : '☆';
    });
    if(!favorites.includes(selected) || !reviews[selected]?.approved)$('practice').hidden=true;
    if(!busyRedraw)updatePracticeOptions();
  }
  function renderGallery() {
    const mixed = [0,15,10,5,16,1,6,11,12,17,2,7,8,13,18,3,19,9,4,14];
    const score = d => tastePicks.reduce((sum,t) => sum + (tastes[t].families.includes(d.family) ? 1 : 0),0);
    const shown = mixed.map(id=>designs[id]).filter(d => filter === 'all' || filter === d.family || (filter === 'favorites' && favorites.includes(d.id))).sort((a,b)=>score(b)-score(a));
    $('style-grid').innerHTML = shown.map(d => `<article class="style-card" data-id="${d.id}">
      <div class="card-top"><span class="design-number">NO. ${String(d.id+1).padStart(2,'0')}</span><button type="button" class="star-button" data-favorite="${d.id}" aria-pressed="false" aria-label="Add ${d.name} to your five favorites">☆</button></div>
      <button class="card-art" type="button" data-practice="${d.id}" aria-label="Review ${d.name}: ${d.text}">${art(d,true)}</button>
      <div class="card-meta"><h3>${d.name}</h3><p>${d.note}</p></div>
      <div class="card-bottom"><span class="family-chip" data-family="${d.family}">${families[d.family]}</span><button type="button" class="practice-card-button" data-practice="${d.id}" aria-label="Review ${d.name}">Make it mine ↗</button></div>
    </article>`).join('');
    $('empty-message').hidden = shown.length > 0;
    renderFavorites();
  }
  function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index >= 0) {
      favorites.splice(index,1);
      announce(`${designs[id].name} removed. Room for a new favorite.`);
    } else {
      if (favorites.length === 5) { announce('Your five are full. Tap a selected star to make room.'); return; }
      favorites.push(id);
      announce(favorites.length === 5 ? 'Your five are in. Time to see how they feel.' : `${designs[id].name} is in. ${favorites.length} of 5 picked.`);
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
  function demonstration(step, motion) {
    let paths = [], start = [100,142], arrow = 'M111 129l-1-12 12 1';
    if (step === 0) paths = ['M100 142 C117 128 155 53 138 49 C110 44 107 143 159 142 C182 141 224 53 206 49 C177 43 177 145 229 142 C254 140 293 54 278 49 C250 43 247 144 300 142 C323 140 347 120 373 117'];
    if (step === 1) {
      if (motion === 'loop') {
        paths = ['M156 143 C169 102 263 19 286 33 C306 48 257 141 205 147 C159 152 196 86 263 48 C246 84 232 129 243 146 C250 154 273 147 292 130','M183 110 C214 97 249 89 279 93'];
        start = [156,143];
      } else {
        paths = [motion === 'angular' ? 'M162 151 L283 32 L245 151 L229 124' : 'M162 151 C199 103 248 49 283 32 C274 57 257 112 247 151','M184 115 Q240 91 291 91'];
        start = [162,151];
      }
    }
    if (step === 2) {
      paths = ['M274 43 C255 83 235 128 223 159','M206 67 Q270 30 333 35','M216 106 Q262 86 303 88'];
      start = [274,43]; arrow = 'M270 62l-4 12 12-2';
    }
    if (step === 3) {
      paths = motion === 'angular' ? ['M125 141 L165 111 L161 142 L194 111 L189 141 L276 41 L235 141 L300 124'] : ['M125 142 C144 137 157 113 165 108 C163 124 154 147 173 142 C194 136 229 87 253 49 C267 23 281 36 265 68 C243 110 205 155 246 143 C264 138 282 126 300 121'];
      start = [125,142];
    }
    return `<svg viewBox="65 10 330 175" role="img" aria-label="${steps[step].short} practice movement"><g>${paths.map(d => `<path class="demo-path" d="${d}"/>`).join('')}</g><circle class="demo-start" cx="${start[0]}" cy="${start[1]}" r="5"/><text class="demo-start-label" x="${start[0]-8}" y="${start[1]+22}">start</text>${step < 1 ? `<path class="demo-arrow" d="${arrow}"/>` : ''}</svg>`;
  }
  function updateGuides() {
    const current = state[selected].step;
    const design = designs[selected];
    const isDemo = current < 4;
    const example = isDemo ? demonstration(current,design.motion) : art(design);
    $('guide-layer').innerHTML = current < 5 ? example : '';
    $('guide-layer').classList.toggle('has-demo',isDemo);
    $('reference-art').innerHTML = example;
    const peeking = current === 6 && $('hint-button').getAttribute('aria-expanded') === 'true';
    $('selected-art').style.visibility = current === 6 && !peeking ? 'hidden' : 'visible';
    $('selected-art').setAttribute('aria-hidden',String(current === 6 && !peeking));
    $('reference-strip').hidden = !(paperMode && current < 6) && current !== 5 && !peeking;
    $('draw-wrap').hidden = paperMode;
    $('paper-card').hidden = !paperMode;
    $('drawing-tools').hidden = paperMode;
    $('save-drawing').hidden = paperMode;
    $('canvas-caption').textContent = current < 4 ? 'Follow the light line. Any speed.' : current === 4 ? 'Follow your name. Let it feel natural.' : current === 5 ? 'Look above. Make it your own here.' : 'Your hand knows more than you think.';
  }
  function renderLesson() {
    const design = designs[selected], record = state[selected], index = record.step, step = steps[index];
    $('practice-style').value = String(selected);
    $('selected-art').innerHTML = art(design);
    $('selected-description').textContent = design.note;
    const completed = record.counts.filter((count,i) => count >= steps[i].goal).length;
    $('ladder-count').textContent = `${completed} / 7`;
    $('ladder').innerHTML = steps.map((item,i) => `<li><button type="button" data-step="${i}" ${i===index ? 'aria-current="step"' : ''} class="${record.counts[i] >= item.goal ? 'is-done' : ''}" aria-label="Step ${i+1}: ${item.short}${record.counts[i] >= item.goal ? ', completed' : ''}"><span class="step-number" aria-hidden="true">${record.counts[i] >= item.goal ? '✓' : i+1}</span><span>${item.short}</span></button></li>`).join('');
    $('step-kicker').textContent = freeMode ? 'YOUR SPACE TO PLAY' : `STEP ${index+1} OF 7`;
    $('goal-chip').textContent = freeMode ? 'No target. Just you.' : `${step.goal} ${step.goal === 1 ? 'try' : 'tries'} · ${step.time}`;
    $('lesson-title').textContent = freeMode ? 'Keep making it yours.' : step.title;
    $('instruction').textContent = freeMode ? 'Try a smaller version, a faster version, or a new little twist.' : step.instruction;
    if (index === 1 && design.motion === 'loop' && !freeMode) $('instruction').textContent = 'Loop up into an A, come down, then cross.';
    $('hint').textContent = step.hint;
    $('hint').hidden = true;
    $('hint-button').setAttribute('aria-expanded','false');
    $('hint-button').innerHTML = `${index === 6 ? 'Take a quick peek' : 'A little hint'} <span aria-hidden="true">+</span>`;
    $('micro-note').textContent = index < 4 ? 'These simple shapes build the movement. Your exact signature comes together in step 5.' : 'Keep the parts you like. Small differences are part of handwriting.';
    updateGuides();
    updateLessonProgress();
    resizeCanvas();
  }
  function updateLessonProgress() {
    const record = state[selected], index = record.step, step = steps[index], count = record.counts[index];
    const done = count >= step.goal;
    const allDone = record.counts.every((value,i) => value >= steps[i].goal);
    $('rep-dots').innerHTML = Array.from({length:step.goal},(_,i) => `<span class="${i<count?'filled':''}"></span>`).join('');
    $('rep-caption').textContent = freeMode ? 'You set the pace' : `${count} of ${step.goal} ${step.goal === 1 ? 'try' : 'tries'}`;
    $('count-try').disabled = done || (!paperMode && !hasNewInk);
    $('count-try').hidden = freeMode;
    $('step-win').hidden = !done || allDone || freeMode;
    $('finish-card').hidden = !allDone || freeMode;
    $('win-title').textContent = step.win;
    $('win-message').textContent = step.message;
    $('next-step').innerHTML = `${index === 6 ? 'Find my next win' : 'Next tiny win'} <span aria-hidden="true">→</span>`;
    $('lesson-feedback').textContent = freeMode ? 'No score. No finish line. Just a little room to play.' : done ? 'Small win collected. Take a breath.' : count === 0 ? 'One small move is all you need to start.' : count === 1 ? 'That counts. Give it one more easy go.' : 'You are building the feeling. One more.';
    $('ladder-count').textContent = `${record.counts.filter((value,i)=>value>=steps[i].goal).length} / 7`;
    document.querySelectorAll('[data-step]').forEach(button => {
      const i = Number(button.dataset.step), complete = record.counts[i] >= steps[i].goal;
      button.classList.toggle('is-done',complete);
      button.querySelector('.step-number').textContent = complete ? '✓' : i+1;
      button.setAttribute('aria-label',`Step ${i+1}: ${steps[i].short}${complete ? ', completed' : ''}`);
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
    context.strokeStyle = context.fillStyle = '#263843';
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
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return {x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height)),p:event.pressure || .5};
  }
  function finishActiveStroke(event) {
    if (!activeStroke || (event && event.pointerId !== pointerId)) return;
    if (event?.type === 'pointerup') activeStroke.points.push(point(event));
    strokes.push(activeStroke);
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    activeStroke = null; pointerId = null; hasNewInk = true;
    rememberDraft(); redraw();
  }
  canvas.addEventListener('pointerdown',event => {
    if (pointerId !== null || event.button > 0) return;
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
    (events.length ? events : [event]).forEach(item=>activeStroke.points.push(point(item)));
    redraw();
  });
  canvas.addEventListener('pointerup',finishActiveStroke);
  canvas.addEventListener('pointercancel',finishActiveStroke);
  canvas.addEventListener('lostpointercapture',finishActiveStroke);
  function clearInk() {
    finishActiveStroke(); strokes=[]; activeStroke=null;pointerId=null;hasNewInk=false;rememberDraft();redraw();
  }

  function renderTastes() {
    $('taste-grid').innerHTML=tastes.map((t,i)=>`<button class="taste-choice" type="button" data-taste="${i}" aria-pressed="${tastePicks.includes(i)}"><svg viewBox="0 0 240 120" aria-hidden="true"><path d="${t.path}" stroke-width="${t.width}"/></svg><strong>${t.name}</strong><span>${t.note}</span></button>`).join('');
    document.querySelectorAll('[data-inspire]').forEach(button=>button.setAttribute('aria-pressed',String(tastePicks.includes(Number(button.dataset.inspire)))));
    $('taste-status').textContent=tastePicks.length ? `${tastePicks.length} of 3 picked. We’ll bring these qualities forward; all 20 designs stay available.` : 'There’s no wrong answer. You can also explore them all.';
  }
  function reviewRecord(id) {return reviews[id] || (reviews[id]={feedback:'',approved:false,useCustom:false});}
  function openReview(id) {
    if (busyRedraw) return;
    if (!favorites.includes(id)) {
      if (favorites.length>=5) {announce('Your five are full. Remove a star to make room.');return;}
      toggleFavorite(id);
    }
    reviewing=id;
    $('review').hidden=false;
    renderReview();
    $('review').scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});
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
  $('taste-grid').addEventListener('click',event=>{const button=event.target.closest('[data-taste]');if(!button)return;const id=Number(button.dataset.taste),index=tastePicks.indexOf(id);if(index>=0)tastePicks.splice(index,1);else if(tastePicks.length<3)tastePicks.push(id);else{announce('Pick up to three. Tap one again to make room.');return;}persist();renderTastes();renderGallery();});
  $('show-signatures').addEventListener('click',()=>{$('collection').hidden=false;$('collection').scrollIntoView({behavior:reducedMotion()?'auto':'smooth'});});
  document.querySelectorAll('[data-inspire]').forEach(button=>button.addEventListener('click',()=>{const id=Number(button.dataset.inspire),index=tastePicks.indexOf(id);if(index>=0)tastePicks.splice(index,1);else if(tastePicks.length>=3){announce('You have three qualities picked. Tap one again to make room.');return;}else tastePicks.push(id);persist();renderTastes();renderGallery();announce(index>=0?'Removed that quality. There’s room to try another.':'Added that quality to your style picks.');}));
  $('review-design').addEventListener('change',event=>{recognition?.stop();reviewing=Number(event.target.value);renderReview();$('revision-status').textContent='Keep what you love, or ask for a little change.';});
  $('revision-feedback').addEventListener('input',()=>{reviewRecord(reviewing).feedback=$('revision-feedback').value;persist();});
  $('redraw-signature').addEventListener('click',redrawSignature);
  $('keep-original').addEventListener('click',()=>{Object.assign(reviewRecord(reviewing),{useCustom:false,approved:false});state[reviewing]={counts:steps.map(()=>0),step:0};for(const key of drafts.keys())if(key.startsWith(`${reviewing}:`))drafts.delete(key);if(selected===reviewing){strokes=[];hasNewInk=false;renderLesson();}persist();renderReview();renderGallery();$('revision-status').textContent='Back to the original. You can approve it or ask for a different change.';});
  $('approve-signature').addEventListener('click',()=>{reviewRecord(reviewing).approved=true;persist();renderReview();updatePracticeOptions();const next=favorites.find(id=>!reviews[id]?.approved);$('revision-status').textContent=next===undefined?'Your picks are ready. Let’s learn one small move at a time.':'Small decision, big step. Your next favorite is ready to review.';if(next!==undefined){reviewing=next;renderReview();}});
  $('start-approved').addEventListener('click',()=>{const approved=updatePracticeOptions();if(!approved.length)return;$('practice').hidden=false;selectDesign(approved[0],true);});
  $('back-gallery').addEventListener('click',()=>{$('collection').hidden=false;$('collection').scrollIntoView({behavior:reducedMotion()?'auto':'smooth'});});
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
  artDB.then(async db=>{if(!db)return;const records=await new Promise(resolve=>{const request=db.transaction('art').objectStore('art').getAllKeys();request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve([]);});for(const id of records){if(!validId(id))continue;const blob=await new Promise(resolve=>{const request=db.transaction('art').objectStore('art').get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);});if(blob instanceof Blob)customArtwork.set(id,URL.createObjectURL(blob));}renderGallery();if(!$('review').hidden)renderReview();renderLesson();});
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
    const favoriteButton=event.target.closest('[data-favorite]'), practiceButton=event.target.closest('[data-practice]');
    if(favoriteButton) toggleFavorite(Number(favoriteButton.dataset.favorite));
    else if(practiceButton) openReview(Number(practiceButton.dataset.practice));
  });
  $('favorite-slots').addEventListener('click',event=>{
    const button=event.target.closest('[data-remove]');
    if(button){toggleFavorite(Number(button.dataset.remove));$('practice-favorites').focus({preventScroll:true});}
  });
  $('practice-favorites').addEventListener('click',()=>{if(favorites.length)openReview(favorites[0]);});
  $('practice-style').innerHTML = Object.entries(families).map(([key,label])=>`<optgroup label="${label}">${designs.filter(d=>d.family===key).map(d=>`<option value="${d.id}">${String(d.id+1).padStart(2,'0')} · ${d.name}</option>`).join('')}</optgroup>`).join('');
  $('practice-style').addEventListener('change',event=>selectDesign(Number(event.target.value)));
  $('ladder').addEventListener('click',event=>{const button=event.target.closest('[data-step]');if(button)setStep(Number(button.dataset.step));});
  $('hint-button').addEventListener('click',()=>{
    const expanded=$('hint-button').getAttribute('aria-expanded')!=='true';
    $('hint-button').setAttribute('aria-expanded',String(expanded));$('hint').hidden=!expanded;
    $('hint-button').querySelector('span').textContent=expanded?'−':'+';
    updateGuides();
    if(expanded && state[selected].step<4 && !reducedMotion()){
      $('guide-layer').classList.remove('demonstrating');
      requestAnimationFrame(()=>$('guide-layer').classList.add('demonstrating'));
    }
  });
  $('paper-mode').addEventListener('change',event=>{finishActiveStroke();paperMode=event.target.checked;updateGuides();updateLessonProgress();resizeCanvas();});
  $('count-try').addEventListener('click',()=>{
    const record=state[selected],index=record.step;
    if(record.counts[index]>=steps[index].goal || (!paperMode && !hasNewInk))return;
    record.counts[index]++;
    hasNewInk=false;
    if(record.counts[index]<steps[index].goal)clearInk();else rememberDraft();
    persist();updateLessonProgress();
    if(record.counts[index]>=steps[index].goal){
      announce(steps[index].win);
      const allDone=record.counts.every((value,i)=>value>=steps[i].goal);
      (allDone?$('free-practice'):$('next-step')).focus({preventScroll:true});
    }
  });
  $('next-step').addEventListener('click',()=>{
    const record=state[selected];let next=record.step+1;
    if(next>=steps.length)next=record.counts.findIndex((value,i)=>value<steps[i].goal);
    if(next>=0)setStep(next);
  });
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
  renderTastes();renderGallery();loadDraft();renderLesson();updatePracticeOptions();persist();
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resizeCanvas).observe($('draw-wrap'));
  else window.addEventListener('resize',resizeCanvas);
})();
