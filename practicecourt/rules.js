function scoreFrame(g,p,t){
  g.frames++;
  if(!p){g.side=null;g.pending=null;g.lastCross=null;return;}
  g.seen++;
  const side=p.x<g.edge?'left':p.x>1-g.edge?'right':null;
  if(!side){g.pending=null;return;}
  if(g.pending!==side){g.pending=side;g.since=t;return;}
  if(t-g.since<60 || side===g.side)return;
  if(g.side){if(g.events)g.events.push({t,side,hit:Math.abs(p.y-g.y)<=g.height});if(g.lastCross!=null)g.times.push(t-g.lastCross);g.lastCross=t;g.attempts++;if(Math.abs(p.y-g.y)<=g.height)g.hits++;}
  g.side=side;
}
