(() => {
  'use strict';
  // Visually reviewed focus WINDOWS in the existing ink sheets, not invented
  // letter paths or an inferred pen order. Crossing strokes can overlap a box.
  // Fractions are [left, top, width, height] within each design's original crop.
  const windows = [
    [[0,0,.21,1],[.48,0,.24,1]], [[0,0,.24,1],[.44,0,.25,1]],
    [[0,0,.20,1],[.47,0,.23,1]], [[0,0,.25,1],[.42,0,.24,1]],
    [[0,0,.26,1],[.44,0,.29,1]], [[0,0,.26,1],[.29,0,.29,1]],
    [[0,0,.32,1],[.74,0,.26,1]], [[0,0,.33,1],[.29,0,.31,1]],
    [[0,0,.50,1],[.36,0,.64,1]], [[0,0,.26,1],[.36,0,.25,1]],
    [[0,0,.30,1],[.44,0,.32,1]], [[0,0,.25,1],[.43,0,.30,1]],
    [[0,0,.32,1],[.32,0,.31,1]], [[0,0,.31,1],[.68,0,.32,1]],
    [[0,0,.25,1],[.43,0,.30,1]], [[0,0,.28,1],[.45,0,.28,1]],
    [[0,0,.31,1],[.65,0,.35,1]], [[0,0,.36,1],[.31,0,.34,1]],
    [[0,0,.55,1],[.45,0,.55,1]], [[0,0,.25,1],[.38,0,.25,1]],
  ];

  function focusBoxes(design, index, revised = false) {
    if (revised || !windows[design.id] || ![1,2,3].includes(index)) return [];
    return index === 3 ? windows[design.id] : [windows[design.id][index - 1]];
  }
  function focusCrop(design, index, revised = false) {
    const box = focusBoxes(design,index,revised)[0];
    if (!box || index === 3) return null;
    const [x,y,w,h] = design.crop, [left,top,width,height] = box;
    return [x + w*left, y + h*top, w*width, h*height];
  }
  function planFor(design, base, revised = false) {
    const initials = design.text.replace(/[^a-z]/gi,'').toUpperCase() === 'AF';
    const plan = base.map(step=>({...step,time:'at your own pace'}));
    Object.assign(plan[0],{short:'Warm-up',title:'A little warm-up, if you want it.',
      instruction:'These loose loops are not part of your signature. Try them, or go straight to your A.',
      hint:'This is only a chance to settle your grip and get moving. It does not teach the A, F, or a connection in your design. You can skip it without losing signature progress.'});
    Object.assign(plan[1],{short:revised?'Opening':'Your A',title:revised?'Find your opening shape.':'Practice the A you actually chose.',
      instruction:revised?'Use your revised artwork below. Try only its opening shape; leave the rest for later.':'Copy the A in the zoom below. Leave any long crossing line or extra flourish for later.',
      hint:revised?'The full revised artwork stays visible because a redraw may move or change the letters. No guessed crop or pen order is being added.':'The blue box in the small signature shows the focus area. The larger guide is that exact image area, not a substitute A. Crossing or neighboring strokes may still be visible.'});
    Object.assign(plan[2],{short:revised?'Next part':'Your F',title:revised?'Give the next part a turn.':'Practice the F from this design.',
      instruction:revised?'Look at the same revised artwork. Try its next main letter or gesture on its own.':'Copy the F in the zoom below. Notice its slant and the space around it; lift the pen whenever it helps.',
      hint:revised?'Choose the next main shape you can see in your revision. This is visual practice, not an automatically verified stroke-order lesson.':'The highlighted area comes from your chosen artwork. Shared or crossing strokes may appear in both zooms. You do not have to draw those extras yet.'});
    Object.assign(plan[3],{short:'Together',title:initials&&!revised?'Put your A and F beside each other.':'Put the main shapes in their places.',
      instruction:revised?'Use your actual revision: copy its main shapes with a comfortable gap. Do not force a join.':initials?'Write A, then F beside it. Leave the shared finishing line until last. No extra loop is needed.':'Place the A and F where they sit in the full design. Leave the smaller letters and finishing details for the next step.',
      hint:revised?'Keep the order and spacing comfortable for your hand. The image is your reference; it does not contain verified pen-path data.':initials?'This is an initials mark, not a chain of lowercase letters. Practice the two initials, their slant, and their spacing. You can lift between them. The long shared line is a finishing detail, not a reason to add a tall loop.':'You already tried each main letter. Now use the full reference to practice their relative size, slant, and spacing. A pen lift between name parts is fine; you do not need an invented connecting shape.',
      message:'You practiced the main shapes in their places.'});
    Object.assign(plan[4],{instruction:'Trace the actual signature below. Keep the main shapes; add smaller letters and any finishing line at your own pace.',
      hint:'This guide is the approved artwork itself. Work through the main shapes in a way that feels comfortable. A finishing line can be a separate last pass. This is a suggested practice approach, not a recording of the artist’s pen order.'});
    Object.assign(plan[5],{instruction:'Look at the selected signature, then copy it in the empty space. Look back whenever you want.'});
    Object.assign(plan[6],{instruction:'Try the same signature without the guide. A peek is always available.',
      hint:'The guide can come back whenever it helps. Keep your own comfortable version; this is not an accuracy test.'});
    return plan;
  }
  function explanation(design,index,revised=false) {
    const initials=design.text.replace(/[^a-z]/gi,'').toUpperCase()==='AF';
    if(index===0)return 'Warm-up only. These loops are not in your selected mark. They are an optional way to get moving, not a required signature skill.';
    if(revised&&index<4)return 'Your revision is the reference. We show it whole rather than guess where its letters begin or invent a stroke order from an image.';
    if(index===1)return 'This is the opening A from your selected design. Practicing its size and slant gives you one real part to use in the whole signature.';
    if(index===2)return 'This is the F from the same design. Practicing it on its own gives you the other main shape before you put the mark together.';
    if(index===3)return initials?'Your mark is A + F with a shared finishing line. This step is about placing those two initials together—not learning a loop that is not there.':'The boxes show the A and F inside your chosen signature. Practice where those main shapes sit; the next step adds the rest of this exact design.';
    if(index===4)return 'Now the guide is the whole approved artwork. Bring the parts you practiced back into their actual places.';
    if(index===5)return 'The reference stays above an empty practice space. This changes tracing into copying, without taking away help.';
    return 'The reference starts hidden so you can try recalling the mark. Use “Take a quick peek” whenever you need it; there is no penalty.';
  }
  function progress(counts,base) {
    const completed=base.slice(1).filter((step,i)=>(counts[i+1]||0)>=step.goal).length;
    return {completed,total:base.length-1,allDone:completed===base.length-1};
  }
  window.augustSignatureLessons={focusBoxes,focusCrop,planFor,explanation,progress};
})();
