const canvas = document.getElementById('orb-canvas');
const ctx = canvas.getContext('2d');
const stage = document.querySelector('.orb-stage');

let width = 0;
let height = 0;
let dpr = 1;
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
let points = [];
let stars = [];
const POINTS = 135;
const STARS = 85;

function resize() {
  const rect = stage.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  createScene();
}

function createScene() {
  const radius = Math.min(width, height) * 0.34;
  points = Array.from({ length: POINTS }, () => {
    const theta = Math.acos(1 - 2 * Math.random());
    const phi = Math.random() * Math.PI * 2;
    return {
      x: radius * Math.sin(theta) * Math.cos(phi),
      y: radius * Math.cos(theta),
      z: radius * Math.sin(theta) * Math.sin(phi),
      size: 0.45 + Math.random() * 1.05
    };
  });

  stars = Array.from({ length: STARS }, () => ({
    x: width * (0.1 + Math.random() * 0.82),
    y: height * (0.08 + Math.random() * 0.84),
    r: 0.3 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2
  }));
}

function project(point, rotationY, rotationX) {
  const cy = Math.cos(rotationY);
  const sy = Math.sin(rotationY);
  const cx = Math.cos(rotationX);
  const sx = Math.sin(rotationX);

  const x1 = point.x * cy - point.z * sy;
  const z1 = point.x * sy + point.z * cy;
  const y1 = point.y * cx - z1 * sx;
  const z2 = point.y * sx + z1 * cx;
  const perspective = 1 + z2 / (Math.min(width, height) * 1.55);

  return {
    x: width * 0.58 + x1 * perspective,
    y: height * 0.49 + y1 * perspective,
    z: z2,
    size: point.size * perspective
  };
}

function draw(time) {
  ctx.clearRect(0, 0, width, height);

  targetX += (mouseX - targetX) * 0.035;
  targetY += (mouseY - targetY) * 0.035;

  stars.forEach((star) => {
    const twinkle = 0.2 + (Math.sin(time * 0.001 + star.phase) + 1) * 0.22;
    ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
    ctx.beginPath();
    ctx.arc(star.x + targetX * 10, star.y + targetY * 10, star.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const rotationY = time * 0.00016 + targetX * 0.22;
  const rotationX = Math.sin(time * 0.0002) * 0.13 + targetY * 0.12;
  const projected = points.map((point) => project(point, rotationY, rotationX));

  const maxDistance = Math.min(width, height) * 0.14;
  ctx.lineWidth = 0.42;

  for (let i = 0; i < projected.length; i += 1) {
    for (let j = i + 1; j < projected.length; j += 1) {
      const a = projected[i];
      const b = projected[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < maxDistance && Math.abs(a.z - b.z) < 125) {
        const alpha = Math.max(0.025, 0.13 - distance / (maxDistance * 1.45));
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  projected.sort((a, b) => a.z - b.z).forEach((point) => {
    const depth = Math.max(0, Math.min(1, (point.z + 260) / 520));
    const alpha = 0.18 + depth * 0.7;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(0.45, point.size), 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(draw);
}

window.addEventListener('resize', resize);
window.addEventListener('pointermove', (event) => {
  const rect = stage.getBoundingClientRect();
  mouseX = (event.clientX - rect.left) / rect.width - 0.5;
  mouseY = (event.clientY - rect.top) / rect.height - 0.5;
});

resize();
requestAnimationFrame(draw);

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealItems.forEach((item) => observer.observe(item));
}
