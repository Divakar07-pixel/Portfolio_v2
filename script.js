const canvas = document.getElementById('orb-canvas');
const stage = document.querySelector('.orb-stage');

if (canvas && stage) {
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = 1;
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  let points = [], stars = [];
  const POINTS = 135, STARS = 85;

  function createScene() {
    const radius = Math.min(width, height) * 0.34;
    points = Array.from({length: POINTS}, () => { const theta = Math.acos(1 - 2 * Math.random()); const phi = Math.random() * Math.PI * 2; return {x: radius*Math.sin(theta)*Math.cos(phi), y: radius*Math.cos(theta), z: radius*Math.sin(theta)*Math.sin(phi), size: .45 + Math.random()*1.05}; });
    stars = Array.from({length: STARS}, () => ({x: width*(.1+Math.random()*.82), y: height*(.08+Math.random()*.84), r:.3+Math.random()*.8, phase:Math.random()*Math.PI*2}));
  }
  function resize() { const rect = stage.getBoundingClientRect(); width=rect.width; height=rect.height; dpr=Math.min(devicePixelRatio||1,2); canvas.width=Math.floor(width*dpr); canvas.height=Math.floor(height*dpr); canvas.style.width=`${width}px`; canvas.style.height=`${height}px`; ctx.setTransform(dpr,0,0,dpr,0,0); createScene(); }
  function project(p, ry, rx) { const cy=Math.cos(ry),sy=Math.sin(ry),cx=Math.cos(rx),sx=Math.sin(rx); const x1=p.x*cy-p.z*sy,z1=p.x*sy+p.z*cy,y1=p.y*cx-z1*sx,z2=p.y*sx+z1*cx,perspective=1+z2/(Math.min(width,height)*1.55); return {x:width*.58+x1*perspective,y:height*.49+y1*perspective,z:z2,size:p.size*perspective}; }
  function draw(time) {
    ctx.clearRect(0,0,width,height); targetX+=(mouseX-targetX)*.035; targetY+=(mouseY-targetY)*.035;
    stars.forEach(s=>{const a=.2+(Math.sin(time*.001+s.phase)+1)*.22;ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.beginPath();ctx.arc(s.x+targetX*10,s.y+targetY*10,s.r,0,Math.PI*2);ctx.fill();});
    const projected=points.map(p=>project(p,time*.00016+targetX*.22,Math.sin(time*.0002)*.13+targetY*.12)), maxDistance=Math.min(width,height)*.14; ctx.lineWidth=.42;
    for(let i=0;i<projected.length;i++)for(let j=i+1;j<projected.length;j++){const a=projected[i],b=projected[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<maxDistance&&Math.abs(a.z-b.z)<125){ctx.strokeStyle=`rgba(255,255,255,${Math.max(.025,.13-d/(maxDistance*1.45))})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
    projected.sort((a,b)=>a.z-b.z).forEach(p=>{const depth=Math.max(0,Math.min(1,(p.z+260)/520));ctx.fillStyle=`rgba(255,255,255,${.18+depth*.7})`;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.45,p.size),0,Math.PI*2);ctx.fill();}); requestAnimationFrame(draw);
  }
  window.addEventListener('resize',resize); window.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();mouseX=(e.clientX-r.left)/r.width-.5;mouseY=(e.clientY-r.top)/r.height-.5;});
  document.documentElement.classList.add('js-ready'); resize(); requestAnimationFrame(draw);
  const items=document.querySelectorAll('.reveal'); if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.15});items.forEach(i=>observer.observe(i));}
}