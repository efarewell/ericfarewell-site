const drills=[
 ['basketball','cross','Crossover gates','Control','Change hands in front of you. Send the ball into each shaded gate.',.32,.56,.15],
 ['basketball','wide','Wide crossover','Range','Set your feet wide. Sell the move to one side, then bring the ball across to the far gate.',.24,.56,.17],
 ['basketball','low','Low handles','Precision','Lower the bounce and keep the ball near knee height as you change hands.',.32,.69,.11],
 ['basketball','burst','Change of pace','Tempo','Take two relaxed crossings, then two quick ones. Keep the same width.',.32,.56,.15],
 ['soccer','lateral','Lateral gates','Control','Guide the ball across your body with the inside of the foot. Work both directions.',.32,.75,.15],
 ['soccer','wide','Wide escape','Range','Push the ball toward the outside gate, turn, then bring it back across.',.24,.75,.15],
 ['soccer','tight','Precision touches','Precision','Aim for the narrow shaded lane. Take small touches as you travel across.',.32,.77,.085],
 ['soccer','tempo','Stop and go','Tempo','Pause briefly at one gate. Move decisively into the next.',.32,.75,.15]
].map(([sport,id,title,focus,instruction,edge,y,height])=>({sport,id,title,focus,instruction,edge,y,height}));
