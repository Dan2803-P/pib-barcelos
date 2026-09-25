// ===== nav scroll state =====
const hdr = document.getElementById('hdr');
if (hdr) addEventListener('scroll', () => hdr.classList.toggle('scrolled', scrollY > 40));

// ===== mobile menu =====
const burger = document.getElementById('burger'), mm = document.getElementById('mobileMenu');
if (burger && mm) {
  burger.addEventListener('click', () => { mm.classList.toggle('open'); burger.classList.toggle('x'); });
  mm.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mm.classList.remove('open')));
}

// ===== reveal on scroll =====
const io = new IntersectionObserver((es) => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .14 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ===== counters =====
const cio = new IntersectionObserver((es) => es.forEach(e => {
  if (!e.isIntersecting) return; cio.unobserve(e.target);
  const el = e.target, tgt = +el.dataset.count; let s = null;
  const run = (t) => { if (!s) s = t; const p = Math.min((t - s) / 1500, 1);
    el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * tgt) + (tgt >= 150 ? '+' : '');
    if (p < 1) requestAnimationFrame(run); };
  requestAnimationFrame(run);
}), { threshold: .5 });
document.querySelectorAll('[data-count]').forEach(c => cio.observe(c));

// ===== giving toggle =====
document.querySelectorAll('.give-opt').forEach(o => o.addEventListener('click', () => {
  document.querySelectorAll('.give-opt').forEach(x => x.classList.remove('on')); o.classList.add('on');
}));

// ===== gallery (3D curve + drag + lightbox) =====
const track = document.getElementById('galTrack');
if (track) {
  const items = [...track.querySelectorAll('.g-item')];
  function curve() {
    const c = track.getBoundingClientRect().left + track.clientWidth / 2;
    let best = null, bd = 1e9;
    items.forEach(it => {
      const r = it.getBoundingClientRect(); const mid = r.left + r.width / 2;
      const d = (mid - c) / track.clientWidth;
      const rot = Math.max(-32, Math.min(32, -d * 70));
      const sc = Math.max(.82, 1 - Math.abs(d) * .5);
      const op = Math.max(.45, 1 - Math.abs(d) * 1.15);
      it.style.transform = `rotateY(${rot}deg) scale(${sc})`;
      it.style.opacity = op; it.style.zIndex = String(100 - Math.round(Math.abs(d) * 100));
      it.classList.remove('active');
      if (Math.abs(mid - c) < bd) { bd = Math.abs(mid - c); best = it; }
    });
    if (best) best.classList.add('active');
  }
  let raf; track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(curve); });
  addEventListener('resize', curve);
  let down = false, sx, sl, moved;
  track.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; track.classList.add('drag'); track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = sl - dx; });
  const up = () => { down = false; track.classList.remove('drag'); };
  track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);

  const lb = document.getElementById('lightbox'), lbImg = document.getElementById('lbImg'), lbCap = document.getElementById('lbCap');
  if (lb) {
    items.forEach(it => it.addEventListener('click', () => {
      if (moved) return;
      lbImg.src = it.querySelector('img').src;
      lbCap.textContent = it.querySelector('.g-cap b').textContent;
      lb.classList.add('open');
    }));
    const closeLb = () => lb.classList.remove('open');
    document.getElementById('lbClose').addEventListener('click', closeLb);
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  }
  window.addEventListener('load', () => {
    const mid = items[Math.floor(items.length / 2)];
    track.scrollLeft = mid.offsetLeft - track.clientWidth / 2 + mid.clientWidth / 2;
    curve();
  });
  curve();
}

// ===== kinetic word rotators (any .vh-rotator; optional data-ms interval) =====
document.querySelectorAll('.vh-rotator').forEach(rot => {
  const words = [...rot.children];
  if (words.length < 2) return;
  const ms = parseInt(rot.dataset.ms || '3000', 10);
  let wi = 0;
  setInterval(() => {
    const cur = words[wi];
    wi = (wi + 1) % words.length;
    const nxt = words[wi];
    cur.classList.remove('on'); cur.classList.add('out');
    nxt.classList.remove('out'); nxt.classList.add('on');
    setTimeout(() => cur.classList.remove('out'), 750);
  }, ms);
});

// ===== ensure background videos autoplay =====
document.querySelectorAll('video[autoplay]').forEach(v => {
  const kick = () => v.play().catch(() => {});
  kick();
  document.addEventListener('pointerdown', kick, { once: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
});
