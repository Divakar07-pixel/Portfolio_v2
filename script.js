const canvas = document.getElementById('orb-canvas');
const ctx = canvas.getContext('2d');
const stage = document.querySelector('.orb-stage');

let w = 0;
let h = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
let points = [];
const POINTS = 115;

function resize() {
  const rect = stage.getBoundingClientRect();
  w = rect.width;
  h = rect.height;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  makePoints();
}

function makePoints() {
  points = [];
  const radius = Math.min(w, h) * 0.32;
  for (let i = 0; i < POINTS; i += 1) {
    const theta = Math.acos(1 - 2 * Math.random());
    const phi = Math.random() * Math.PI * 2;
    points.push({
      x: radius * Math.sin(theta) * Math.cos(phi),
      y: radius * Math.cos(theta),
      z: radius * Math.sin(theta) * Math.sin(phi),
      size: 0.55 + Math.random() * 1.2,
    });
  }
}

function project(point, angleY, angleX) {
  const cy = Math.cos(angleY);
  const sy = Math.sin(angleY);
  const cx = Math.cos(angleX);
  const sx = Math.sin(angleX);

  const x1 = point.x * cy - point.z * sy;
  const z1 = point.x * sy + point.z * cy;
  const y1 = point.y * cx - z1 * sx;
  const z2 = point.y * sx + z1 * cx;
  const perspective = 1 + z2 / (Math.min(w, h) * 1.35);

  return {
    x: w * 0.57 + x1 * perspective,
    y: h * 0.49 + y1 * perspective,
    z: z2,
    scale: perspective,
  };
}

function frame(time) {
  ctx.clearRect(0, 0, w, h);
  targetX += (mouseX - targetX) * 0.035;
  targetY += (mouseY - targetY) * 0.035;

  const angleY = time * 0.00018 + targetX * 0.16;
  const angleX = Math.sin(time * 0.00022) * 0.17 + targetY * 0.1;
  const projected = points.map((p) => project(p, angleY, angleX));

  const links = [];
  for (let i = 0; i < projected.length; i += 1) {
    for (let j = i + 1; j < projected.length; j += 1) {
      const a = projected[i];
      const b = projected[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < Math.min(w, h) * 0.115 && Math.abs(a.z - b.z) < 150) {
        links.push([a, b, dist]);
      }
    }
  }

  ctx.lineWidth = 0.45;
  links.forEach(([a, b, dist]) => {
    const alpha = Math.max(0.035, 0.15 - dist / (Math.min(w, h) * 0.95));
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  projected
    .sort((a, b) => a.z - b.z)
    .forEach((p, index) => {
      const alpha = 0.2 + ((p.z + 250) / 500) * 0.65;
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.9, alpha)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, points[index]?.size || 0.8, 0, Math.PI * 2);
      ctx.fill();
    });

  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
window.addEventListener('pointermove', (event) => {
  const rect = stage.getBoundingClientRect();
  mouseX = (event.clientX - rect.left) / rect.width - 0.5;
  mouseY = (event.clientY - rect.top) / rect.height - 0.5;
});

resize();
requestAnimationFrame(frame);
