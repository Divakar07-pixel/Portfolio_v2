const loader=document.getElementById('page-loader');
const loaderCanvas=document.getElementById('loader-orb-canvas');
const canvas=document.getElementById('orb-canvas');
const hero=document.querySelector('.hero');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/*
  Code-only orbital field.
  The reference look is built from hundreds of translucent 3D elliptical
  wisps crossing a bright core. No image, SVG or bitmap is used.
*/
function initOrb(canvasEl,host,centerX=.5){
 if(!canvasEl||!host)return;
 const ctx=canvasEl.getContext('2d');
 let w=0,h=0,dpr=1,mx=centerX,my=.49,tx=centerX,ty=.49,interaction=0;
 const ORBITS=115,SPARKS=95,orbits=[],sparks=[];

 function rand(a,b){return a+Math.random()*(b-a);}

 function resize(){
  const r=host.getBoundingClientRect();
  w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(window.devicePixelRatio||1,2);
  canvasEl.width=Math.floor(w*dpr);canvasEl.height=Math.floor(h*dpr);
  canvasEl.style.width=w+'px';canvasEl.style.height=h+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const radius=Math.min(w,h)*.35;
  orbits.length=0;sparks.length=0;
  for(let i=0;i<ORBITS;i++){
   const core=Math.random();
   const r=radius*(.16+Math.pow(core,1.7)*.82);
   orbits.push({
    r,
    ry:rand(0,Math.PI*2),
    rx:rand(-1.48,1.48),
    rz:rand(0,Math.PI*2),
    squash:rand(.12,.92),
    offset:rand(0,Math.PI*2),
    speed:rand(.000035,.00013)*(Math.random()<.5?-1:1),
    width:rand(.35,1.05),
    alpha:rand(.035,.15)*(1.25-rand(0,.45)*core),
    wobble:rand(.006,.035),
    phase:rand(0,Math.PI*2),
    turns:rand(.92,1.14)
   });
  }
  for(let i=0;i<SPARKS;i++){
   const a=Math.random()*Math.PI*2,u=Math.random()*2-1,r=radius*rand(.08,.92);
   sparks.push({
    x:Math.sqrt(1-u*u)*Math.cos(a)*r,
    y:u*r,
    z:Math.sqrt(1-u*u)*Math.sin(a)*r,
    size:rand(.35,1.35),phase:rand(0,Math.PI*2),speed:rand(.00008,.0002)
   });
  }
 }

 function rotatePoint(x,y,z,ry,rx,rz){
  const cy=Math.cos(ry),sy=Math.sin(ry),cx=Math.cos(rx),sx=Math.sin(rx),cz=Math.cos(rz),sz=Math.sin(rz);
  let xx=x*cy-z*sy,zz=x*sy+z*cy;
  let yy=y*cx-zz*sx;zz=y*sx+zz*cx;
  x=xx*cz-yy*sz;y=xx*sz+yy*cz;
  return {x,y,z:zz};
 }

 function project(p,ry,rx){
  const q=rotatePoint(p.x,p.y,p.z,ry,rx,0);
  const perspective=1+q.z/(Math.min(w,h)*1.75);
  return {x:w*centerX+q.x*perspective,y:h*.49+q.y*perspective,z:q.z,size:p.size*perspective};
 }

 function drawOrbit(o,t,cx,cy,rad,rotY,rotX){
  const localY=o.ry+Math.sin(t*.00008+o.phase)*o.wobble;
  const localX=o.rx+Math.cos(t*.00006+o.phase)*o.wobble;
  const localZ=o.rz+t*o.speed+o.offset;
  const points=[];
  const samples=68;
  for(let i=0;i<=samples;i++){
   const a=(i/samples)*Math.PI*2*o.turns;
   const breathing=1+Math.sin(t*.00045+o.phase)*.025;
   let x=Math.cos(a)*o.r*breathing;
   let y=Math.sin(a)*o.r*o.squash*breathing;
   let z=Math.sin(a*2+o.phase)*o.r*.055;
   const p=rotatePoint(x,y,z,localY+rotY,localX+rotX,localZ);
   const perspective=1+p.z/(Math.min(w,h)*1.75);
   points.push({x:cx+p.x*perspective,y:cy+p.y*perspective,z:p.z});
  }

  let front=0;
  for(let i=1;i<points.length;i++)front+=points[i].z>0?1:0;
  const depth=front/points.length;
  ctx.beginPath();
  points.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});
  const alpha=Math.min(.22,o.alpha*(.65+depth*.75)+(o.r<rad*.28?.025:0));
  ctx.strokeStyle=`rgba(224,236,255,${alpha})`;
  ctx.lineWidth=o.width*(.8+depth*.45);
  ctx.stroke();
 }

 function draw(t){
  ctx.clearRect(0,0,w,h);
  tx+=(mx-tx)*.035;ty+=(my-ty)*.035;
  const cx=w*centerX,cy=h*.49,rad=Math.min(w,h)*.35;
  const distance=Math.hypot(mx*w-cx,my*h-cy);
  const active=Math.max(0,1-distance/rad);
  interaction+=(active-interaction)*.055;

  /* Slow continuous 360° rotation of the complete orbital mass. */
  const rotY=t*.00030+tx*.10;
  const rotX=Math.sin(t*.000075)*.12+ty*.07;

  /* Very dark translucent trails create the photographic depth of the reference. */
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  orbits.forEach(o=>drawOrbit(o,t,cx,cy,rad,rotY,rotX));

  /* Small moving particles add life without turning the orb into a dot field. */
  sparks.forEach(s=>{
   const drift=Math.sin(t*s.speed+s.phase)*rad*.018;
   const p=project({x:s.x+drift,y:s.y+drift*.35,z:s.z+drift},rotY,rotX);
   const depth=Math.max(0,Math.min(1,(p.z+rad)/(rad*2)));
   const a=.12+depth*.35+interaction*.12;
   ctx.fillStyle=`rgba(235,242,255,${Math.min(.65,a)})`;
   ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.45,s.size*(.65+depth*.7)),0,Math.PI*2);ctx.fill();
  });

  /* Dense luminous core. */
  const core=ctx.createRadialGradient(cx,cy,0,cx,cy,rad*.24);
  core.addColorStop(0,'rgba(255,255,255,.55)');
  core.addColorStop(.08,'rgba(245,250,255,.24)');
  core.addColorStop(.25,'rgba(220,235,255,.08)');
  core.addColorStop(.58,'rgba(190,215,245,.025)');
  core.addColorStop(1,'rgba(160,200,240,0)');
  ctx.fillStyle=core;ctx.beginPath();ctx.arc(cx,cy,rad*.24,0,Math.PI*2);ctx.fill();
  ctx.restore();

  requestAnimationFrame(draw);
 }

 function pointer(e){
  const r=host.getBoundingClientRect();
  if(!r.width||!r.height)return;
  mx=(e.clientX-r.left)/r.width;my=(e.clientY-r.top)/r.height;
 }
 window.addEventListener('pointermove',pointer,{passive:true});
 window.addEventListener('pointerleave',()=>{mx=centerX;my=.49;},{passive:true});
 window.addEventListener('resize',resize,{passive:true});
 resize();requestAnimationFrame(draw);
}

/* Two independent canvas orbs: loader and Home. */
initOrb(loaderCanvas,loader||document.body,.5);
initOrb(canvas,canvas?.parentElement||hero,.67);

/* Portal: scroll down drives the complete circle-to-Home transition. */
if(loader&&!reduced){
 document.body.classList.add('portal-lock');
 let entered=false,current=0,target=0,raf=false;
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const ease=v=>v<.5?2*v*v:1-Math.pow(-2*v+2,2)/2;
 function setProgress(v){target=clamp(v,0,1);if(!raf){raf=true;requestAnimationFrame(tick);}}
 function tick(){
  current+=(target-current)*.12;
  if(Math.abs(target-current)<.0005)current=target;
  const p=ease(current);
  loader.style.setProperty('--portal-ring-scale',(1+p*.7).toFixed(3));
  loader.style.setProperty('--portal-ring-opacity',(0.3+p*.18).toFixed(3));
  loader.style.setProperty('--portal-orb-scale',(1+p*.55).toFixed(3));
  loader.style.setProperty('--loader-fade',p.toFixed(3));
  if(current!==target)requestAnimationFrame(tick);else raf=false;
  if(!entered&&current>.985)finish();
 }
 function finish(){
  entered=true;
  loader.classList.add('portal-entered');
  document.body.classList.remove('portal-lock');
  setTimeout(()=>loader.remove(),850);
 }
 window.addEventListener('wheel',e=>{
  if(entered||e.ctrlKey)return;
  if(e.deltaY>0){
   if(e.cancelable)e.preventDefault();
   setProgress(1);
  }
 },{passive:false});
 window.addEventListener('keydown',e=>{
  if(entered)return;
  if(['ArrowDown','PageDown',' ','End'].includes(e.key)){
   e.preventDefault();setProgress(1);
  }
 });
 let touchY=0;
 window.addEventListener('touchstart',e=>{touchY=e.touches[0].clientY;},{passive:true});
 window.addEventListener('touchmove',e=>{
  if(entered)return;
  const d=touchY-e.touches[0].clientY;
  if(d>3){
   if(e.cancelable)e.preventDefault();
   setProgress(1);touchY=e.touches[0].clientY;
  }
 },{passive:false});
 if(document.readyState==='complete')loader.classList.add('portal-ready');
 else window.addEventListener('load',()=>loader.classList.add('portal-ready'),{once:true});
}
if(reduced&&loader)loader.remove();

/* Home section entrances. */
if(!reduced&&'IntersectionObserver'in window){
 const sections=document.querySelectorAll('.scroll-section');
 const observer=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;
  const el=e.target;
  el.classList.add('is-inview');
  if(el.classList.contains('projects-section'))el.classList.add('projects-inview');
  if(el.classList.contains('skills-section'))el.classList.add('skills-inview');
  if(el.classList.contains('contact'))el.classList.add('contact-inview');
  observer.unobserve(el);
 }),{threshold:.12,rootMargin:'0px 0px -10% 0px'});
 sections.forEach(s=>observer.observe(s));
}
