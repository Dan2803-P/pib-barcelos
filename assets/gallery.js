// ===== Vida Nova — WebGL gallery v6: one shared cylinder, rotating drum =====
(function () {
  const stage = document.getElementById('glstage');
  if (!stage || !window.THREE || !window.GAL_TEX) return;
  const T = THREE, DATA = window.GAL_TEX, N = DATA.length;

  const R = 6.0;                        // ONE cylinder — every image lives on it
  const STEP = 0.52;                    // angular slot per image (rad)
  const ARC = 0.46;                     // angular width of each image (rad) — wide panels
  const PH = 3.15;                      // panel height (wider aspect than before)
  const SPAN = N * STEP;
  const CHORD = 2 * R * Math.sin(ARC / 2);
  const PANEL_ASPECT = CHORD / PH;
  const BASE_FOV = 27;

  let W = stage.clientWidth, H = stage.clientHeight;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(BASE_FOV, W / H, 0.1, 100);
  camera.position.set(0, 0, 3.4);       // inside the cylinder, looking across at the wall
  camera.lookAt(0, 0, -R);
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  stage.appendChild(renderer.domElement);

  const group = new T.Group(); scene.add(group);
  const loader = new T.TextureLoader();
  const meshes = [];

  // every panel: segment of the SAME cylinder (radius R, same axis) — curvature is continuous
  function panelGeometry() {
    const g = new T.CylinderGeometry(R, R, PH, 48, 1, true, Math.PI - ARC / 2, ARC);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
    return g;                            // NOT translated: shares the drum's axis at origin
  }

  const VSH = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;
  const FSH = `
    uniform sampler2D uMap;
    uniform vec2 uRepeat, uOffset;
    uniform float uLum, uAlpha;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(uMap, vUv * uRepeat + uOffset);
      gl_FragColor = vec4(c.rgb * uLum, uAlpha);
    }`;

  function coverFit(tex, u) {
    const img = tex.image; if (!img) return;
    const ia = img.width / img.height;
    let rx = 1, ry = 1;
    if (ia > PANEL_ASPECT) rx = PANEL_ASPECT / ia; else ry = ia / PANEL_ASPECT;
    rx *= 0.94; ry *= 0.94;
    u.uRepeat.value.set(rx, ry);
    u.uCx = (1 - rx) / 2;
    u.uOffset.value.set(u.uCx, (1 - ry) / 2);
  }

  DATA.forEach((d, i) => {
    const uniforms = {
      uMap: { value: null }, uRepeat: { value: new T.Vector2(1, 1) },
      uOffset: { value: new T.Vector2(0, 0) }, uLum: { value: 1 },
      uAlpha: { value: 1 }, uCx: 0
    };
    const tex = loader.load(d.src, t => coverFit(t, uniforms));
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4;
    tex.minFilter = T.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    uniforms.uMap.value = tex;
    const mat = new T.ShaderMaterial({
      uniforms, vertexShader: VSH, fragmentShader: FSH,
      side: T.BackSide, transparent: true, depthWrite: false
    });
    const mesh = new T.Mesh(panelGeometry(), mat);
    mesh.userData = { i, uniforms };
    group.add(mesh); meshes.push(mesh);
  });

  function fitCamera() {
    const aspect = W / H;
    camera.aspect = aspect;
    camera.baseFov = aspect >= 1.1 ? BASE_FOV : Math.min(48, BASE_FOV + (1.1 - aspect) * 24);
    camera.fov = camera.baseFov;
    camera.updateProjectionMatrix();
  }
  fitCamera();

  const wrapA = a => ((a % SPAN) + SPAN + SPAN / 2) % SPAN - SPAN / 2;

  let rot = STEP * 2.2, target = 0, lastRot = rot;

  function layout(speed) {
    meshes.forEach(m => {
      const d = wrapA(m.userData.i * STEP + rot);
      m.rotation.y = d;                              // drum rotation — same axis for all
      const t = Math.abs(d) / STEP;
      const u = m.userData.uniforms;
      u.uLum.value = Math.max(0.34, 1 - t * 0.30);
      u.uAlpha.value = Math.max(0, Math.min(1, 1.25 - t * 0.38));
      u.uOffset.value.x = u.uCx * (1 + Math.max(-1, Math.min(1, d / STEP)) * 0.8);
      m.visible = Math.abs(d) < 1.7;
      m.renderOrder = Math.round(100 - t * 30);
    });
    const warped = camera.baseFov + Math.min(Math.abs(speed) * 60, 3.5);
    if (Math.abs(camera.fov - warped) > 0.05) { camera.fov = warped; camera.updateProjectionMatrix(); }
  }

  // ----- captions + sliding ghost title -----
  let activeIdx = -1;
  const elTitle = document.getElementById('glTitle');
  const elCap = document.getElementById('glCap');
  const elSub = document.getElementById('glSub');
  function activeFromRot() { return ((Math.round(-rot / STEP) % N) + N) % N; }
  function updateActive() {
    const idx = activeFromRot();
    if (idx === activeIdx) return; activeIdx = idx;
    const d = DATA[idx];
    if (elTitle) { elTitle.style.opacity = 0; setTimeout(() => { elTitle.textContent = d.label; elTitle.style.opacity = 1; }, 260); }
    if (elCap) elCap.textContent = d.label;
    if (elSub) elSub.textContent = d.sub;
  }
  function slideTitle() {
    if (!elTitle) return;
    const off = wrapA(rot + activeIdx * STEP);
    elTitle.style.transform = `translateX(${off * -620}px)`;
  }

  // ----- drag + inertia + slow smooth snap -----
  const K = 0.0019;                                  // rad per px (~275px per image)
  let down = false, sx = 0, base = 0, moved = false, vel = 0, lastX = 0;
  stage.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; base = target; lastX = e.clientX; vel = 0; stage.classList.add('grab'); stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => {
    if (!down) return; const dx = e.clientX - sx;
    if (Math.abs(dx) > 4) moved = true;
    target = base + dx * K; vel = (e.clientX - lastX) * K; lastX = e.clientX;
  });
  function release() {
    if (!down) return; down = false; stage.classList.remove('grab');
    target += vel * 12;
    target = Math.round(target / STEP) * STEP;
  }
  stage.addEventListener('pointerup', e => { const wasMoved = moved; release(); if (!wasMoved) tryOpen(e); });
  stage.addEventListener('pointercancel', release);
  // vertical scroll passes through (page scrolls normally); horizontal swipe drives the gallery, one panel at a time
  let wheelAcc = 0, wheelLock = 0;
  stage.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;   // vertical: let the page scroll
    e.preventDefault();
    const now = performance.now();
    if (now < wheelLock) return;
    wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) > 70) {
      target -= Math.sign(wheelAcc) * STEP;
      target = Math.round(target / STEP) * STEP;
      wheelAcc = 0; wheelLock = now + 500;
    }
  }, { passive: false });

  const prev = document.getElementById('glPrev'), next = document.getElementById('glNext');
  if (prev) prev.addEventListener('click', () => { target += STEP; });
  if (next) next.addEventListener('click', () => { target -= STEP; });
  addEventListener('keydown', e => { if (e.key === 'ArrowLeft') target += STEP; if (e.key === 'ArrowRight') target -= STEP; });

  // ----- click → lightbox -----
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  const lb = document.getElementById('lightbox'), lbImg = document.getElementById('lbImg'), lbCap = document.getElementById('lbCap');
  function tryOpen(e) {
    if (!lb) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(meshes.filter(m => m.visible))[0];
    const idx = hit ? hit.object.userData.i : activeIdx;
    const d = DATA[idx];
    lbImg.src = d.src; lbCap.textContent = d.label + ' — ' + d.sub;
    lb.classList.add('open');
  }
  if (lb) {
    const close = () => lb.classList.remove('open');
    document.getElementById('lbClose').addEventListener('click', close);
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  function resize() { W = stage.clientWidth; H = stage.clientHeight; renderer.setSize(W, H); fitCamera(); }
  addEventListener('resize', resize);

  renderer.domElement.style.opacity = '0';
  renderer.domElement.style.transition = 'opacity 1.4s cubic-bezier(.22,.61,.36,1)';
  requestAnimationFrame(() => { renderer.domElement.style.opacity = '1'; });

  function tick() {
    rot += (target - rot) * 0.025;                   // slow, smooth drum glide
    const speed = rot - lastRot; lastRot = rot;
    layout(speed); updateActive(); slideTitle();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  layout(0); updateActive(); tick();
})();
