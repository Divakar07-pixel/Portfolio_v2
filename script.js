const loader=document.getElementById('page-loader');
const loaderCanvas=document.getElementById('loader-orb-canvas');
const canvas=document.getElementById('orb-canvas');
const hero=document.querySelector('.hero');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Code-only 3D particle orb. No image, bitmap, SVG, or generated asset is used. */
function initOrb(canvasEl,host,centerX=.5){
 if(!canvasEl||!host)return;
 const ctx=canvasEl.getContext('2d');
 let w=0,h=0,dpr=1,mx=centerX,my=.49,tx=centerX,ty=.49,interaction=0;
 const POINTS=340,MAX_LINKS=420,points=[];

 function resize(){
  const r=host.getBoundingClientRect();
  w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(window.devicePixelRatio||1,2);
  canvasEl.width=Math.floor(w*dpr);canvasEl.height=Math.floor(h*dpr);
  canvasEl.style.width=w+'px';canvasEl.style.height=h+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const radius=Math.min(w,h)*.34;
  points.length=0;
  for(let i=0;i<POINTS;i++){
   const a=Math.random()*Math.PI*2;
   const u=Math.random()*2-1;
   const rr=radius*(.70+Math.random()*.38);
   points.push({
    x:Math.sqrt(1-u*u)*Math.cos(a)*rr,
    y:u*rr,
    z:Math.sqrt(1-u*u)*Math.sin(a)*rr,
    size:.85+Math.random()*1.45,
    phase:Math.random()*Math.PI*2,
    speed:.00004+Math.random()*.00005
   });
  }
 }

 function project(p,ry,rx){
  const cy=Math.cos(ry),sy=Math.sin(ry),cx=Math.cos(rx),sx=Math.sin(rx);
  let x=p.x*cy-p.z*sy;
  let z=p.x*sy+p.z*cy;
  let y=p.y*cx-z*sx;
  z=p.y*sx+z*cx;
  const perspective=1+z/(Math.min(w,h)*1.55);
  return {x:w*centerX+x*perspective,y:h*.49+y*perspective,z,size:p.size*perspective};
 }

 function draw(t){
  ctx.clearRect(0,0,w,h);
  tx+=(mx-tx)*.035;
  ty+=(my-ty)*.035;

  const cx=w*centerX,cy=h*.49,rad=Math.min(w,h)*.34;
  const distance=Math.hypot(mx*w-cx,my*h-cy);
  const active=Math.max(0,1-distance/rad);
  interaction+=(active-interaction)*.055;

  /* Continuous 360° rotation — approximately one full turn every 12 seconds. */
  const ry=t*.000524+tx*.12;
  const rx=Math.sin(t*.00011)*.055+ty*.055;

  const pts=points.map(p=>{
   const drift=Math.sin(t*p.speed+p.phase)*1.8;
   const open=1+interaction*.045;
   const twist=.32*Math.sin(p.phase+t*.00005);
   let base={
    x:(p.x+drift*Math.cos(p.phase))*open,
    y:(p.y+drift*.45)*open,
    z:(p.z+drift*Math.sin(p.phase))*open
   };
   const ca=Math.cos(twist),sa=Math.sin(twist);
   const xx=base.x*ca-base.z*sa;
   const zz=base.x*sa+base.z*ca;
   base.x=xx;base.z=zz;

   const q=project(base,ry,rx);
   const dx=q.x-cx,dy=q.y-cy,d=Math.hypot(dx,dy);
   if(d<rad&&d>1){
    const pull=(1-d/rad)*interaction*12;
    q.x+=dx/d*pull;q.y+=dy/d*pull;
   }
   q.near=Math.max(0,1-d/(rad*1.25));
   return q;
  });

  /* Bright white orbital structure — entirely canvas-generated. */
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(t*.00008);
  for(let k=0;k<3;k++){
   const rr=Math.min(w,h)*(.25+k*.08);
   ctx.beginPath();
   ctx.ellipse(0,0,rr,rr*(.24+k*.15),0,0,Math.PI*2);
   ctx.strokeStyle=`rgba(255,255,255,${.10-k*.015})`;
   ctx.lineWidth=.8;
   ctx.stroke();
  }
  ctx.restore();

  const maxD=Math.min(w,h)*(.155+interaction*.04);
  const links=[];
  for(let i=0;i<pts.length;i++){
   for(let j=i+1;j<pts.length;j++){
    const a=pts[i],b=pts[j];
    const d=Math.hypot(a.x-b.x,a.y-b.y);
    if(d<maxD&&Math.abs(a.z-b.z)<135)links.push({a,b,d});
   }
  }
  links.sort((a,b)=>a.d-b.d);

  ctx.lineWidth=.75;
  links.slice(0,MAX_LINKS).forEach(({a,b,d})=>{
   const pulse=.5+.5*Math.sin(t*.001+a.x*.009);
   let alpha=Math.max(.035,.22-d/(maxD*1.25));
   alpha*=.72+pulse*.28;
   alpha+=(a.near+b.near)*.025;
   ctx.strokeStyle=`rgba(255,255,255,${Math.min(.28,alpha)})`;
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  });

  if(interaction>.04){
   ctx.beginPath();
   ctx.arc(mx*w,my*h,Math.min(w,h)*(.12+interaction*.05),0,Math.PI*2);
   ctx.strokeStyle=`rgba(255,255,255,${interaction*.055})`;
   ctx.lineWidth=.7;
   ctx.stroke();
  }

  /* Crisp white particles with a restrained glow. */
  ctx.save();
  ctx.shadowColor='rgba(255,255,255,.65)';
  ctx.shadowBlur=2.5;
  pts.sort((a,b)=>a.z-b.z).forEach(p=>{
   const depth=Math.max(0,Math.min(1,(p.z+300)/600));
   const near=p.near;
   const sz=p.size*(1+near*interaction*.65);
   const alpha=Math.min(.98,.50+depth*.42+near*interaction*.10);
   ctx.fillStyle=`rgba(255,255,255,${alpha})`;
   ctx.beginPath();
   ctx.arc(p.x,p.y,Math.max(.7,sz),0,Math.PI*2);
   ctx.fill();
  });
  ctx.restore();

  requestAnimationFrame(draw);
 }

 function pointer(e){
  const r=host.getBoundingClientRect();
  if(!r.width||!r.height)return;
  mx=(e.clientX-r.left)/r.width;
  my=(e.clientY-r.top)/r.height;
 }

 window.addEventListener('pointermove',pointer,{passive:true});
 window.addEventListener('pointerleave',()=>{mx=centerX;my=.49;},{passive:true});
 window.addEventListener('resize',resize,{passive:true});
 resize();
 requestAnimationFrame(draw);
}

/* Two independent canvas orbs: loader and Home. */
initOrb(loaderCanvas,loader||document.body,.5);
initOrb(canvas,canvas?.parentElement||hero,.67);

/* Portal entrance — first scroll dismisses the loading layer and reveals Home. */
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
  loader.style.setProperty('--loader-fade',p.toFixed(3));
  if(current!==target)requestAnimationFrame(tick);else raf=false;
  if(!entered&&current>.985)finish();
 }
 function finish(){
  entered=true;
  loader.classList.add('portal-entered');
  document.body.classList.remove('portal-lock');
  setTimeout(()=>loader.remove(),800);
 }
 const advance=n=>{if(!entered)setProgress(target+n)};
 window.addEventListener('wheel',e=>{
  if(entered||e.ctrlKey)return;
  if(e.cancelable)e.preventDefault();
  advance(Math.min(.18,Math.abs(e.deltaY)/900));
 },{passive:false});
 window.addEventListener('keydown',e=>{
  if(entered)return;
  if(['ArrowDown','PageDown',' ','End'].includes(e.key)){
   e.preventDefault();advance(.18);
  }
 });
 let touchY=0;
 window.addEventListener('touchstart',e=>{touchY=e.touches[0].clientY;},{passive:true});
 window.addEventListener('touchmove',e=>{
  if(entered)return;
  const d=touchY-e.touches[0].clientY;
  if(d>3){
   if(e.cancelable)e.preventDefault();
   advance(Math.min(.2,d/520));
   touchY=e.touches[0].clientY;
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
