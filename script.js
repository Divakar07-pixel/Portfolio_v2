const loader=document.getElementById('page-loader');
const canvas=document.getElementById('orb-canvas');
const stage=document.querySelector('.orb-stage');
const hero=document.querySelector('.hero');
const heroCopy=document.querySelector('.hero-copy');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Living data core — a rotating network sphere that opens into a portal on scroll. */
if(canvas&&stage){
 const ctx=canvas.getContext('2d');let w=0,h=0,dpr=1,points=[],mx=0,my=0,tx=0,ty=0,interaction=0,portalSpread=0;
 const POINTS=175,MAX_LINKS=145;
 function create(){
  const r=Math.min(w,h)*.34;
  points=Array.from({length:POINTS},()=>{const a=Math.random()*Math.PI*2,u=Math.random()*2-1,rr=r*(.78+Math.random()*.28);return{x:Math.sqrt(1-u*u)*Math.cos(a)*rr,y:u*rr,z:Math.sqrt(1-u*u)*Math.sin(a)*rr,size:.48+Math.random()*1.05,phase:Math.random()*6.28,speed:.000055+Math.random()*.000075};});
 }
 function resize(){const q=stage.getBoundingClientRect();w=q.width;h=q.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);create();}
 function project(p,ry,rx){const cy=Math.cos(ry),sy=Math.sin(ry),cx=Math.cos(rx),sx=Math.sin(rx);let x=p.x*cy-p.z*sy,z=p.x*sy+p.z*cy,y=p.y*cx-z*sx;z=p.y*sx+z*cx;const perspective=1+z/(Math.min(w,h)*1.7);return{x:w*.5+x*perspective,y:h*.49+y*perspective,z,size:p.size*perspective};}
 function draw(t){
  ctx.clearRect(0,0,w,h);tx+=(mx-tx)*.035;ty+=(my-ty)*.035;
  const cx=mx*w,cy=my*h,rad=Math.min(w,h)*.29;const active=Math.max(0,1-Math.hypot(cx-w*.5,cy-h*.49)/rad);interaction+=(active-interaction)*.055;
  const spread=portalSpread,ry=t*.000095+tx*.18+spread*.72,rx=Math.sin(t*.00013)*.08+ty*.08;
  const pts=points.map(p=>{const drift=Math.sin(t*p.speed+p.phase)*2.6,open=1+spread*(.55+.45*Math.abs(Math.sin(p.phase))),twist=spread*.32*Math.sin(p.phase);let base={x:(p.x+drift*Math.cos(p.phase))*open,y:(p.y+drift*.45)*open,z:(p.z+drift*Math.sin(p.phase))*open};const ca=Math.cos(twist),sa=Math.sin(twist),xx=base.x*ca-base.z*sa,zz=base.x*sa+base.z*ca;base.x=xx;base.z=zz;const q=project(base,ry,rx),dx=q.x-cx,dy=q.y-cy,d=Math.hypot(dx,dy);if(d<rad&&d>1){const pull=(1-d/rad)*interaction*11;q.x+=dx/d*pull;q.y+=dy/d*pull;}q.near=Math.max(0,1-d/(rad*1.35));return q;});
  /* Thin orbital spell rings. */
  ctx.save();ctx.translate(w*.5,h*.49);ctx.rotate(t*.000025+spread*.5);for(let k=0;k<3;k++){const rr=Math.min(w,h)*(.24+k*.085)*(1+spread*.7);ctx.beginPath();ctx.ellipse(0,0,rr,rr*(.23+k*.16),0,0,Math.PI*2);ctx.strokeStyle=`rgba(255,255,255,${.045-k*.008+spread*.035})`;ctx.lineWidth=.5;ctx.stroke();}ctx.restore();
  const maxD=Math.min(w,h)*(.135+interaction*.035)*(1+spread*.25),links=[];for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<maxD&&Math.abs(a.z-b.z)<110*(1+spread))links.push({a,b,d});}links.sort((a,b)=>a.d-b.d);ctx.lineWidth=.48;
  links.slice(0,MAX_LINKS).forEach(({a,b,d})=>{const pulse=.5+.5*Math.sin(t*.0008+a.x*.009);let alpha=Math.max(.012,.105-d/(maxD*1.35));alpha*=.7+pulse*.3;alpha+=(a.near+b.near)*.022+spread*.025;ctx.strokeStyle=`rgba(255,255,255,${Math.min(.19,alpha)})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();});
  if(interaction>.04){ctx.beginPath();ctx.arc(cx,cy,Math.min(w,h)*(.13+interaction*.055),0,Math.PI*2);ctx.strokeStyle=`rgba(255,255,255,${interaction*.045})`;ctx.lineWidth=.55;ctx.stroke();}
  pts.sort((a,b)=>a.z-b.z).forEach(p=>{const depth=Math.max(0,Math.min(1,(p.z+250)/500)),near=p.near,sz=p.size*(1+near*interaction*.75);ctx.fillStyle=`rgba(255,255,255,${Math.min(.96,.16+depth*.68+near*interaction*.22+spread*.08)})`;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.44,sz),0,Math.PI*2);ctx.fill();});
  requestAnimationFrame(draw);
 }
 function pointer(e){const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5;}
 window.addEventListener('pointermove',pointer);window.addEventListener('pointerleave',()=>{mx=0;my=0;});window.addEventListener('resize',resize);resize();requestAnimationFrame(draw);
}

/* Portal entrance — the same rotating data core expands, twists and opens the page. */
if(loader&&stage&&!reduced){
 document.body.classList.add('portal-lock');let entered=false,current=0,target=0,raf=false;
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),ease=v=>v<.5?2*v*v:1-Math.pow(-2*v+2,2)/2;
 const ready=()=>{stage.classList.add('portal-in-loader');if(heroCopy&&!loader.contains(heroCopy)){heroCopy.classList.add('portal-copy');loader.appendChild(heroCopy);}loader.classList.add('portal-ready');document.body.classList.add('portal-active');window.dispatchEvent(new Event('resize'));};
 if(document.readyState==='complete')ready();else window.addEventListener('load',ready,{once:true});
 function setProgress(v){target=clamp(v,0,1);if(!raf){raf=true;requestAnimationFrame(tick);}}
 function tick(){current+=(target-current)*.105;if(Math.abs(target-current)<.0005)current=target;const p=ease(current),scale=1+p*.48,op=1-clamp((p-.9)/.1,0,1),blur=clamp((p-.88)/.12,0,1)*1.5;portalSpread=p;loader.style.setProperty('--loader-portal-scale',scale.toFixed(3));loader.style.setProperty('--loader-portal-opacity',op.toFixed(3));loader.style.setProperty('--loader-portal-blur',blur.toFixed(2)+'px');loader.style.setProperty('--loader-haze-scale',(1+p*1.25).toFixed(3));loader.style.setProperty('--portal-progress',p.toFixed(3));loader.style.setProperty('--portal-ring-scale',(0.72+p*.9).toFixed(3));loader.style.setProperty('--portal-ring-opacity',(0.38+p*.42).toFixed(3));if(heroCopy){const r=clamp((p-.2)/.52,0,1),a=clamp((p-.62)/.25,0,1);heroCopy.style.setProperty('--portal-copy-opacity',r.toFixed(3));heroCopy.style.setProperty('--portal-copy-scale',(.72+r*.28).toFixed(3));heroCopy.style.setProperty('--portal-copy-y',((1-r)*48).toFixed(1)+'px');heroCopy.style.setProperty('--portal-copy-x',((1-r)*6).toFixed(1)+'vw');heroCopy.style.setProperty('--portal-copy-clip',(r*150).toFixed(1)+'%');heroCopy.style.setProperty('--portal-actions-opacity',a.toFixed(3));heroCopy.style.setProperty('--portal-actions-y',((1-a)*18).toFixed(1)+'px');}if(current!==target)requestAnimationFrame(tick);else raf=false;if(!entered&&current>.985)finish();}
 function finish(){entered=true;portalSpread=0;if(heroCopy){heroCopy.classList.remove('portal-copy','reveal');['--portal-copy-opacity','--portal-copy-scale','--portal-copy-y','--portal-copy-x','--portal-copy-clip','--portal-actions-opacity','--portal-actions-y'].forEach(v=>heroCopy.style.removeProperty(v));heroCopy.style.opacity='1';heroCopy.style.transform='none';heroCopy.style.clipPath='none';hero.appendChild(heroCopy);}stage.classList.remove('portal-in-loader');loader.classList.add('portal-entered');document.body.classList.remove('portal-lock','portal-active');setTimeout(()=>{if(!hero.contains(stage))hero.appendChild(stage);['--loader-portal-scale','--loader-portal-opacity','--loader-portal-blur','--loader-haze-scale','--portal-ring-scale','--portal-ring-opacity'].forEach(v=>stage.style.removeProperty(v));window.dispatchEvent(new Event('resize'));},650);}
 const advance=n=>{if(!entered)setProgress(target+n)};
 window.addEventListener('wheel',e=>{if(entered||e.ctrlKey)return;if(e.cancelable)e.preventDefault();advance(Math.min(.15,Math.abs(e.deltaY)/980));},{passive:false});window.addEventListener('keydown',e=>{if(entered)return;if(['ArrowDown','PageDown',' ','End'].includes(e.key)){e.preventDefault();advance(.16);}});let touchY=0;window.addEventListener('touchstart',e=>touchY=e.touches[0].clientY,{passive:true});window.addEventListener('touchmove',e=>{if(entered)return;const d=touchY-e.touches[0].clientY;if(d>3){if(e.cancelable)e.preventDefault();advance(Math.min(.18,d/560));touchY=e.touches[0].clientY;}},{passive:false});
}
if(reduced&&loader)window.setTimeout(()=>loader.classList.add('is-hidden'),700);

/* Home scroll motion — the core remains present, then gently settles as the hero leaves. */
if(hero&&stage&&!reduced){let ticking=false;const update=()=>{ticking=false;if(document.body.classList.contains('portal-lock'))return;const r=hero.getBoundingClientRect(),vh=innerHeight||1,p=Math.min(1,Math.max(0,1-r.bottom/vh));stage.style.setProperty('--scroll-orb-scale',(1-p*.035).toFixed(3));stage.style.setProperty('--scroll-orb-ring-opacity',(0.55-p*.42).toFixed(3));stage.style.setProperty('--portal-opacity',(1-p*.32).toFixed(3));stage.style.setProperty('--portal-y',(-p*10).toFixed(1)+'px');};addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});update();}

/* Home section entrances. */
if(!reduced&&'IntersectionObserver'in window){const sections=document.querySelectorAll('.scroll-section');const observer=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;el.classList.add('is-inview');if(el.classList.contains('projects-section'))el.classList.add('projects-inview');if(el.classList.contains('skills-section'))el.classList.add('skills-inview');if(el.classList.contains('contact'))el.classList.add('contact-inview');observer.unobserve(el)}),{threshold:.12,rootMargin:'0px 0px -10% 0px'});sections.forEach(s=>observer.observe(s));}
