const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const palette = {
  background: '#22241f',
  minor: 'rgba(214, 186, 132, .30)',
  major: 'rgba(232, 211, 169, .84)',
  glow: 'rgba(183, 146, 83, .20)'
};

function allLines(geojson) {
  return geojson.features.flatMap(feature => {
    const geometry = feature.geometry;
    if (!geometry) return [];
    if (geometry.type === 'LineString') return [geometry.coordinates];
    if (geometry.type === 'MultiLineString') return geometry.coordinates;
    return [];
  }).filter(line => line.length > 1);
}

function drawContours(canvas, geojson) {
  const lines = allLines(geojson);
  if (!lines.length) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const points = lines.flat();
  const xs = points.map(point => point[0]);
  const ys = points.map(point => point[1]);
  const bounds = {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys)
  };
  const pad = 26;
  const scaleX = (rect.width - pad * 2) / (bounds.maxX - bounds.minX || 1);
  const scaleY = (rect.height - pad * 2) / (bounds.maxY - bounds.minY || 1);
  const scale = Math.max(scaleX, scaleY);
  const drawWidth = (bounds.maxX - bounds.minX) * scale;
  const drawHeight = (bounds.maxY - bounds.minY) * scale;
  const offsetX = (rect.width - drawWidth) / 2;
  const offsetY = (rect.height - drawHeight) / 2;
  const project = point => [
    offsetX + (point[0] - bounds.minX) * scale,
    rect.height - offsetY - (point[1] - bounds.minY) * scale
  ];

  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, rect.width, rect.height);

  const gradient = ctx.createRadialGradient(rect.width * .58, rect.height * .46, 0, rect.width * .58, rect.height * .46, rect.width * .65);
  gradient.addColorStop(0, palette.glow);
  gradient.addColorStop(1, 'rgba(34,36,31,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  lines.forEach((line, index) => {
    ctx.beginPath();
    line.forEach((point, pointIndex) => {
      const [x, y] = project(point);
      if (pointIndex === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = index % 5 === 0 ? palette.major : palette.minor;
    ctx.lineWidth = index % 5 === 0 ? 1.15 : .62;
    ctx.stroke();
  });
}

const topoCanvases = [...document.querySelectorAll('.topo-canvas')];
const topoData = new Map();

Promise.all(topoCanvases.map(async canvas => {
  try {
    const response = await fetch(canvas.dataset.geojson);
    if (!response.ok) throw new Error('Contour data unavailable');
    const geojson = await response.json();
    topoData.set(canvas, geojson);
    drawContours(canvas, geojson);
  } catch (error) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}));

let resizeTimer;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    topoData.forEach((geojson, canvas) => drawContours(canvas, geojson));
  }, 120);
});

document.querySelector('[data-inquiry-form]').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const subject = `30 Ninety Seven° inquiry from ${data.get('name')}`;
  const body = [
    'Hello Eric and Kovid,',
    '',
    'I would like to discuss a 30 Ninety Seven° commission.',
    '',
    `Name: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    `Project location: ${data.get('project') || 'Not specified'}`,
    `Landscape reference: ${data.get('landscape')}`,
    '',
    'What I am imagining:',
    data.get('brief') || 'Not specified',
    '',
    'Please contact me to continue the conversation.'
  ].join('\n');
  document.querySelector('[data-form-note]').textContent = 'Your private inquiry is ready. Your mail app will open so you can review and send it.';
  window.location.href = `mailto:eric@ericfarewell.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
