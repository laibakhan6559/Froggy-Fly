/* =========================================================
   FROGGY FLY  -  pixel frog flying game (HTML5 canvas)
   20 levels, every level ends with Froggy meeting Bella - level 20 = wedding!
   ========================================================= */
(() => {
  'use strict';

  /* ---------- constants ---------- */
  const W = 360, H = 640;
  const GROUND_H = 88, GROUND_Y = H - GROUND_H;
  const SW = W * 2;                 // width of looping background strips
  const GRAVITY = 0.36, FLAP = -6.7, MAX_FALL = 8.5;
  const FROG_X = 100, FROG_W = 48, FROG_H = 42, HW = 15, HH = 13;
  const PIPE_W = 58, CAP_H = 22, PIPE_MARGIN = 62;
  const MEET_FROG_X = 150, MEET_RABBIT_X = 216;   // rabbit sprite is 48 x 57
  const RAB_W = 48, RAB_H = 57;
  const FONT = '"Press Start 2P", monospace';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let S = 1;

  /* ---------- save data ---------- */
  const SAVE_KEY = 'froggyfly_save_v1';
  const save = { unlocked: 1, stars: [0, 0, 0, 0, 0], best: [0, 0, 0, 0, 0] };
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (raw && typeof raw.unlocked === 'number') Object.assign(save, raw);
  } catch (e) {}
  for (const k of ['stars', 'best']) { while (save[k].length < LEVELS.length) save[k].push(0); }
  save.unlocked = Math.max(1, Math.min(LEVELS.length, save.unlocked | 0));
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

  /* ---------- helpers ---------- */
  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hex2rgb(h) { return [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)); }
  function mix(a, b, t) {
    const A = hex2rgb(a), B = hex2rgb(b);
    return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')';
  }
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function stepCircle(g, cx, cy, r, col, step = 4) {
    g.fillStyle = col;
    for (let dy = -r; dy < r; dy += step) {
      const w = Math.sqrt(Math.max(0, r * r - (dy + step / 2) * (dy + step / 2)));
      g.fillRect(Math.round(cx - w), cy + dy, Math.round(w * 2), step);
    }
  }

  /* ---------- background builders (pre-rendered pixel strips) ---------- */
  const bgCache = [];

  function roundTree(g, x, b, u, cols) {
    g.fillStyle = '#6b3d1f'; g.fillRect(x - u, b - 5 * u, 2 * u, 5 * u);
    g.fillStyle = '#4a2812'; g.fillRect(x - u, b - 5 * u, u / 2, 5 * u);
    const rows = [4, 6, 8, 8, 8, 6];
    const top = b - 5 * u - rows.length * u + u;
    rows.forEach((n, i) => {
      g.fillStyle = cols[0]; g.fillRect(x - n * u / 2 - 2, top + i * u - (i === 0 ? 2 : 0), n * u + 4, u + (i === 0 ? 2 : 0) + (i === rows.length - 1 ? 2 : 0));
    });
    rows.forEach((n, i) => { g.fillStyle = cols[1]; g.fillRect(x - n * u / 2, top + i * u, n * u, u); });
    g.fillStyle = cols[2];
    g.fillRect(x - 2 * u, top + u, 2 * u, u);
    g.fillRect(x - 3 * u, top + 2 * u, 2 * u, u);
  }
  function pineTree(g, x, b, u, cols) {
    g.fillStyle = '#5a3418'; g.fillRect(x - u / 2, b - 2 * u, u, 2 * u);
    const tiers = [[2, 4, 6], [2, 4, 6, 8], [2, 4, 6, 8, 10]];
    let y = b - 2 * u;
    tiers.slice().reverse().forEach(t => { y -= t.length * u - u; });
    // draw from top down
    let cy = b - 2 * u - (tiers.reduce((s, t) => s + t.length * u - u, 0)) - u;
    tiers.forEach(t => {
      t.forEach((n, i) => {
        g.fillStyle = cols[0]; g.fillRect(x - n * u / 2 - 2, cy + i * u, n * u + 4, u);
      });
      t.forEach((n, i) => {
        g.fillStyle = cols[1]; g.fillRect(x - n * u / 2, cy + i * u, n * u, u);
        g.fillStyle = cols[2]; g.fillRect(x - n * u / 2, cy + i * u, Math.max(u, n * u / 3), u);
      });
      cy += t.length * u - u;
    });
  }

  function buildBg(i) {
    const L = THEMES[i];
    const rnd = mulberry(900 + i * 131);
    const bg = {};

    // sky
    bg.sky = mk(W, GROUND_Y + 24);
    let g = bg.sky.getContext('2d');
    const band = 10;
    for (let y = 0; y < bg.sky.height; y += band) {
      g.fillStyle = mix(L.sky[0], L.sky[1], clamp(y / (GROUND_Y), 0, 1));
      g.fillRect(0, y, W, band);
    }
    if (L.sun) {
      stepCircle(g, 245, GROUND_Y - 70, 62, 'rgba(255,230,160,.35)');
      stepCircle(g, 245, GROUND_Y - 70, 44, '#fff1b0');
      stepCircle(g, 245, GROUND_Y - 70, 34, '#ffe27a');
    }
    if (L.night) {
      stepCircle(g, 272, 96, 26, '#fff4c4');
      stepCircle(g, 282, 90, 24, mix(L.sky[0], L.sky[1], 96 / GROUND_Y));
    }
    bg.stars = [];
    if (L.night) for (let k = 0; k < 55; k++) bg.stars.push({ x: Math.floor(rnd() * W), y: Math.floor(rnd() * (GROUND_Y - 120)), p: rnd() * 6 });
    bg.sparks = [];
    if (L.sparkles) for (let k = 0; k < 22; k++) bg.sparks.push({ x: Math.floor(rnd() * W), y: Math.floor(rnd() * (GROUND_Y - 60)), p: rnd() * 6 });
    bg.flies = [];
    if (L.night) for (let k = 0; k < 14; k++) bg.flies.push({ x: rnd() * W, y: GROUND_Y - 30 - rnd() * 140, p: rnd() * 6 });

    // clouds
    bg.clouds = mk(SW, 200);
    g = bg.clouds.getContext('2d');
    const cs = Sprites.cloud(L.cloud[0], L.cloud[1]);
    const n = L.cloudCount * 2;
    g.globalAlpha = L.night ? 0.75 : 1;
    for (let k = 0; k < n; k++) {
      const x = Math.min(SW - cs.width, Math.floor((k + rnd() * 0.6) * SW / n));
      g.drawImage(cs, x, 10 + Math.floor(rnd() * 150));
    }

    // hills
    bg.hills = mk(SW, 190);
    g = bg.hills.getContext('2d');
    [[120, 32, 2, 16, 5, L.hills[0]], [74, 24, 3, 12, 7, L.hills[1]]].forEach(([base, a1, k1, a2, k2, col], li) => {
      const p1 = rnd() * 6, p2 = rnd() * 6;
      g.fillStyle = col;
      for (let x = 0; x < SW; x += 8) {
        const h = Math.floor((base + a1 * Math.sin(2 * Math.PI * k1 * x / SW + p1) + a2 * Math.sin(2 * Math.PI * k2 * x / SW + p2)) / 8) * 8;
        g.fillRect(x, 190 - h, 8, h);
      }
    });

    // trees
    bg.trees = mk(SW, 150);
    g = bg.trees.getContext('2d');
    let x = 34;
    while (x < SW - 50) {
      const u = 4 + Math.floor(rnd() * 2);
      if (L.trees.kind === 'pine') pineTree(g, x, 150, u, L.trees.cols);
      else roundTree(g, x, 150, u, L.trees.cols);
      // little bush
      if (rnd() > 0.45) {
        const bx = x + 34;
        g.fillStyle = L.trees.cols[0]; g.fillRect(bx - 14, 150 - 18, 28, 18);
        g.fillStyle = L.trees.cols[1]; g.fillRect(bx - 12, 150 - 16, 24, 16);
        g.fillStyle = L.trees.cols[2]; g.fillRect(bx - 10, 150 - 14, 8, 6);
      }
      x += 70 + Math.floor(rnd() * 50);
    }

    // ground (with decorations above the top edge)
    const DECO = 18;
    bg.ground = mk(SW, GROUND_H + DECO);
    g = bg.ground.getContext('2d');
    const G = L.ground;
    if (L.cloudy) {
      g.fillStyle = G.dirt; g.fillRect(0, DECO, SW, GROUND_H);
      for (let px = 0; px < SW; px += 30) stepCircle(g, px + 15, DECO + 6, 16, G.grass, 4);
      g.fillStyle = G.grass; g.fillRect(0, DECO + 6, SW, 20);
      g.fillStyle = G.grassDark; g.fillRect(0, DECO + 26, SW, 4);
    } else {
      g.fillStyle = G.dirt; g.fillRect(0, DECO, SW, GROUND_H);
      g.fillStyle = G.grass; g.fillRect(0, DECO, SW, 12);
      g.fillStyle = mix(G.grass, '#ffffff', 0.3); g.fillRect(0, DECO, SW, 3);
      g.fillStyle = G.grassDark; g.fillRect(0, DECO + 12, SW, 6);
      for (let px = 0; px < SW; px += 16) {           // jagged grass edge
        g.fillStyle = G.grassDark; g.fillRect(px + 4, DECO + 18, 8, 4);
      }
    }
    g.fillStyle = G.dirt2;
    for (let k = 0; k < 70; k++) g.fillRect(Math.floor(rnd() * SW / 8) * 8, DECO + 34 + Math.floor(rnd() * 6) * 8, 8, 8);
    // tufts & flowers on top of the grass
    for (let px = 12; px < SW - 10; px += 20 + Math.floor(rnd() * 26)) {
      const r = rnd();
      if (r < 0.55) {
        g.fillStyle = G.grassDark; g.fillRect(px, DECO - 6, 4, 6); g.fillRect(px + 6, DECO - 10, 4, 10); g.fillRect(px + 12, DECO - 4, 4, 4);
      } else {
        g.fillStyle = '#2f7d2c'; g.fillRect(px + 4, DECO - 10, 3, 10);
        g.fillStyle = r < 0.8 ? '#ff7fb0' : '#ffffff';
        g.fillRect(px, DECO - 14, 4, 4); g.fillRect(px + 8, DECO - 14, 4, 4); g.fillRect(px + 4, DECO - 18, 4, 4); g.fillRect(px + 4, DECO - 10, 4, 4);
        g.fillStyle = '#ffd23f'; g.fillRect(px + 4, DECO - 14, 4, 4);
      }
    }
    bg.deco = DECO;
    return bg;
  }
  function getBg(i) { const t = LEVELS[i].themeId; return bgCache[t] || (bgCache[t] = buildBg(t)); }

  /* ---------- game state ---------- */
  let state = 'menu';       // menu levels ready play paused meet complete over
  let prevState = 'menu';
  let lvlIdx = 0, L = LEVELS[0], bg = null;
  let frog, pipes, particles, scroll = 0, tick = 0, shake = 0;
  let score = 0, lives = 3, passed = 0, spawned = 0, spawnDist = 0, lastGapY = 300, overT = 0;
  let meet = null, lvPage = 0;
  const buttons = [];
  const ptr = { x: -1, y: -1, down: false };

  function newFrog() { return { x: FROG_X, y: 370, vy: 0, rot: 0, invuln: 0, flapT: 0 }; }

  function startLevel(i) {
    lvlIdx = clamp(i, 0, LEVELS.length - 1);
    L = LEVELS[lvlIdx]; bg = getBg(lvlIdx);
    frog = newFrog(); pipes = []; particles = [];
    score = 0; lives = 3; passed = 0; spawned = 0; spawnDist = 40; lastGapY = 300;
    meet = null; shake = 0; state = 'ready';
  }

  function flap() {
    if (state === 'ready') { state = 'play'; }
    if (state !== 'play') return;
    frog.vy = FLAP; frog.flapT = 10; Sfx.flap();
    burst(frog.x - 14, frog.y + 12, 3, 'sq', '#ffffff', 1.2);
  }

  /* ---------- particles ---------- */
  function burst(x, y, n, type, color, spd = 2) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, s = (0.3 + Math.random()) * spd;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.5, life: 30 + Math.random() * 20, max: 50, type, color, size: 3 + Math.floor(Math.random() * 3) });
    }
  }
  function heartsAt(x, y, n = 1) {
    for (let k = 0; k < n; k++) particles.push({ x: x + (Math.random() - .5) * 30, y, vx: (Math.random() - .5) * 0.6, vy: -0.8 - Math.random() * 0.6, life: 90, max: 90, type: 'heart', size: 1 });
  }
  function confetti(n) {
    const cols = ['#ff4f86', '#ffd23f', '#4fc3ff', '#7dff6a', '#b46bff', '#ffffff'];
    for (let k = 0; k < n; k++) particles.push({ x: Math.random() * W, y: -10, vx: (Math.random() - .5) * 1.2, vy: 1 + Math.random() * 1.6, life: 300, max: 300, type: 'conf', color: cols[Math.floor(Math.random() * cols.length)], size: 4 + Math.floor(Math.random() * 3) });
  }
  function floatText(x, y, text, color = '#fff') {
    particles.push({ x, y, vx: 0, vy: -0.9, life: 40, max: 40, type: 'text', text, color });
  }

  /* ---------- pipes ---------- */
  function spawnPipe() {
    const gap = L.gap;
    const minY = PIPE_MARGIN + gap / 2, maxY = GROUND_Y - PIPE_MARGIN - gap / 2;
    let y = minY + Math.random() * (maxY - minY);
    y = clamp(y, lastGapY - 150, lastGapY + 150);
    y = clamp(y, minY + 0, maxY);
    lastGapY = y;
    const moving = Math.random() < L.move.chance;
    const amp = moving ? Math.min(L.move.amp, y - minY + 10, maxY - y + 10) : 0;
    pipes.push({
      x: W + 30, w: PIPE_W, gap, baseY: y, gapY: y,
      amp: Math.max(0, amp), phase: Math.random() * 6, freq: 0.03 + Math.random() * 0.015,
      passed: false, star: Math.random() < 0.55, taken: false
    });
    spawned++;
  }

  function hitsPipe(p) {
    const fx = frog.x, fy = frog.y;
    const top = p.gapY - p.gap / 2, bot = p.gapY + p.gap / 2;
    const body = fx + HW > p.x && fx - HW < p.x + p.w;
    const cap = fx + HW > p.x - 5 && fx - HW < p.x + p.w + 5;
    if (body && (fy - HH < top - CAP_H || fy + HH > bot + CAP_H)) return true;
    if (cap && (fy - HH < top || fy + HH > bot)) return true;
    return false;
  }

  function hurt() {
    lives--; frog.invuln = 100; frog.vy = -5.2; shake = 10;
    Sfx.hit();
    burst(frog.x, frog.y, 10, 'sq', '#5ccb4a', 2.6);
    if (lives <= 0) { state = 'over'; overT = 0; Sfx.over(); frog.vy = -4; }
  }

  /* ---------- update ---------- */
  function update() {
    if (state === 'paused') return;
    tick++;
    if (shake > 0) shake *= 0.88; if (shake < 0.3) shake = 0;

    if (state === 'menu' || state === 'levels') {
      scroll += 0.7;
    } else if (state === 'ready') {
      scroll += 0.9;
      frog.y = 370 + Math.sin(tick * 0.08) * 7; frog.rot = 0;
      frog.flapT = (tick % 20 < 6) ? 1 : 0;
    } else if (state === 'play') {
      updatePlay();
    } else if (state === 'over') {
      overT++;
      frog.vy = Math.min(frog.vy + GRAVITY, MAX_FALL + 2);
      frog.y += frog.vy;
      if (frog.y > GROUND_Y - 19) { frog.y = GROUND_Y - 19; frog.vy = 0; }
      frog.rot = clamp(frog.rot + 0.05, 0, 1.4);
    } else if (state === 'meet' || state === 'complete') {
      updateMeet();
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.type === 'sq') p.vy += 0.06;
      if (p.type === 'conf') { p.vx += Math.sin(tick * 0.05 + p.x) * 0.02; }
      if (p.life <= 0 || p.y > H + 20) particles.splice(i, 1);
    }
    if (L.finale && (state === 'meet' || state === 'complete') && meet && meet.married && tick % 3 === 0) confetti(1);
  }

  function updatePlay() {
    scroll += L.speed;
    frog.vy = Math.min(frog.vy + GRAVITY, MAX_FALL);
    frog.y += frog.vy;
    frog.rot = clamp(frog.vy * 0.07, -0.45, 1.0);
    if (frog.flapT > 0) frog.flapT--;
    if (frog.invuln > 0) frog.invuln--;

    if (frog.y < FROG_H / 2) { frog.y = FROG_H / 2; if (frog.vy < 0) frog.vy = 0.5; }
    if (frog.y > GROUND_Y - 19) {
      frog.y = GROUND_Y - 19;
      if (frog.invuln <= 0) hurt();
      if (state === 'play') frog.vy = FLAP * 0.85;
    }

    // spawn
    spawnDist -= L.speed;
    if (spawned < L.goal && spawnDist <= 0) { spawnPipe(); spawnDist = L.spacing; }

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= L.speed;
      p.gapY = p.baseY + p.amp * Math.sin(p.phase + tick * p.freq);
      if (state === 'play' && frog.invuln <= 0 && hitsPipe(p)) hurt();
      if (state !== 'play') continue;
      if (p.star && !p.taken) {
        const dx = frog.x - (p.x + p.w / 2), dy = frog.y - p.gapY;
        if (dx * dx + dy * dy < 30 * 30) {
          p.taken = true; score += 5; Sfx.star();
          burst(p.x + p.w / 2, p.gapY, 12, 'sq', '#ffd23f', 2.4); floatText(p.x + p.w / 2, p.gapY - 10, '+5', '#ffd23f');
        }
      }
      if (!p.passed && p.x + p.w < frog.x - HW) {
        p.passed = true; passed++; score += 10; Sfx.score();
        floatText(frog.x + 30, frog.y - 30, '+10');
      }
      if (p.x + p.w + 20 < 0) pipes.splice(i, 1);
    }
    if (state === 'play' && passed >= L.goal) startMeet();
  }

  /* ---------- meeting the bunny ---------- */
  function startMeet() {
    state = 'meet';
    const st = lives >= 3 ? 3 : lives === 2 ? 2 : 1;
    meet = { t: 0, rx: W + 70, arrive: -1, stars: st, frogReady: false };
    save.stars[lvlIdx] = Math.max(save.stars[lvlIdx] || 0, st);
    save.best[lvlIdx] = Math.max(save.best[lvlIdx] || 0, score + st * 5);
    save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, lvlIdx + 2));
    score += st * 5;
    persist();
    for (const p of pipes) p.passed = true;
  }

  function canSkip() {
    if (!meet || meet.arrive < 0) return false;
    return L.finale ? (meet.married && meet.t - meet.arrive > 240) : (meet.t - meet.arrive > 20);
  }

  function updateMeet() {
    const m = meet; m.t++;
    const k = Math.max(0, 1 - m.t / 80);
    scroll += L.speed * k;
    for (let i = pipes.length - 1; i >= 0; i--) { pipes[i].x -= L.speed; if (pipes[i].x + pipes[i].w + 20 < 0) pipes.splice(i, 1); }

    const restY = GROUND_Y + 2 - FROG_H / 2;
    if (m.t > 30) {
      const tr = m.married ? 226 : MEET_RABBIT_X;
      const d = tr - m.rx;
      m.rx += Math.sign(d) * Math.min(Math.abs(d), m.arrive >= 0 ? 0.6 : 2.3);
    }
    const here = m.arrive >= 0 || Math.abs(MEET_RABBIT_X - m.rx) < 0.5;
    frog.x += ((m.married ? 176 : MEET_FROG_X) - frog.x) * 0.04;
    const ty = here ? restY : 300 + Math.sin(m.t * 0.08) * 10;
    frog.y += (ty - frog.y) * 0.07;
    frog.vy = 0; frog.rot += (0 - frog.rot) * 0.1; frog.invuln = 0;
    frog.flapT = (!here || Math.abs(frog.y - restY) > 3) ? ((m.t % 16 < 8) ? 1 : 0) : 0;

    if (here && m.arrive < 0 && Math.abs(frog.y - restY) < 2 && Math.abs(frog.x - MEET_FROG_X) < 2) {
      m.arrive = m.t;
      Sfx.meet();
      heartsAt((MEET_FROG_X + MEET_RABBIT_X) / 2, GROUND_Y - 50, 6);
    }
    if (m.arrive >= 0) {
      const a = m.t - m.arrive;
      if (a % 14 === 0) heartsAt((frog.x + m.rx) / 2, GROUND_Y - 60, 1);
      if (L.finale && a === 165) {            // "I do!" moment
        m.married = true; Sfx.win();
        heartsAt((frog.x + m.rx) / 2, GROUND_Y - 60, 14);
        confetti(50);
      }
      if (state === 'meet' && a >= (L.finale ? 340 : 175)) state = 'complete';
    }
  }

  /* ---------- drawing helpers ---------- */
  function txt(s, x, y, size, color = '#fff', align = 'center', stroke = '#1b2a3a', lw) {
    ctx.font = size + 'px ' + FONT;
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    if (stroke) { ctx.lineWidth = lw || Math.max(3, size / 4); ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function txtPlain(s, x, y, size, color, align = 'center') { txt(s, x, y, size, color, align, null); }
  function title3d(s, x, y, size, col, shadow, outline) {
    txt(s, x, y + 5, size, shadow, 'center', outline, size / 3);
    txt(s, x, y, size, col, 'center', outline, size / 3);
  }

  function button(id, label, x, y, w, h, col = '#4fb83a', dark = '#2c7a22', size = 13) {
    buttons.push({ id, x, y, w, h });
    const down = ptr.down && ptr.x >= x && ptr.x <= x + w && ptr.y >= y && ptr.y <= y + h;
    const o = down ? 3 : 0;
    ctx.fillStyle = '#12301a'; ctx.fillRect(x - 3, y - 3 + o, w + 6, h + 10 - o);
    ctx.fillStyle = dark; ctx.fillRect(x, y + 4 + o, w, h - o);
    ctx.fillStyle = col; ctx.fillRect(x, y + o, w, h - 2);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 4, y + 4 + o, w - 8, 3);
    txt(label, x + w / 2, y + h / 2 + 1 + o, size, '#ffffff', 'center', '#12301a', size / 3);
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = '#12301a'; ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
    ctx.fillStyle = '#5ccb4a'; ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
    ctx.fillStyle = '#fffdf2'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#e7f6d9'; ctx.fillRect(x, y + h - 6, w, 6);
  }

  function bubble(cx, tipY, lines, name) {
    ctx.font = '8px ' + FONT;
    const w = Math.max(...lines.map(l => l.length)) * 8 + 20;
    const h = lines.length * 14 + 14;
    let bx = clamp(cx - w / 2, 8, W - w - 8);
    const by = tipY - h - 12;
    ctx.fillStyle = '#12301a'; ctx.fillRect(bx - 3, by - 3, w + 6, h + 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, w, h);
    // tail
    ctx.fillStyle = '#12301a'; ctx.fillRect(cx - 7, by + h + 3, 14, 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 4, by + h, 8, 6);
    ctx.fillStyle = '#12301a'; ctx.fillRect(cx - 3, by + h + 6, 6, 4);
    lines.forEach((l, i) => txtPlain(l, bx + w / 2, by + 14 + i * 14, 8, '#1b3a1b'));
    if (name) txt(name, bx + w / 2, by - 12, 8, '#ffe14a', 'center', '#12301a', 3);
  }

  function drawStrip(img, off, y) {
    const x = -(((off % SW) + SW) % SW);
    ctx.drawImage(img, Math.floor(x), y);
    ctx.drawImage(img, Math.floor(x) + SW, y);
  }

  function drawBackdrop() {
    ctx.drawImage(bg.sky, 0, 0);
    if (bg.stars.length) {
      bg.stars.forEach(s => {
        ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(tick * 0.04 + s.p));
        ctx.fillStyle = '#ffffff'; ctx.fillRect(s.x, s.y, 2, 2);
      });
      ctx.globalAlpha = 1;
    }
    if (bg.sparks.length) {
      bg.sparks.forEach(s => {
        const a = Math.abs(Math.sin(tick * 0.03 + s.p));
        ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
        ctx.fillRect(s.x - 1, s.y - 4, 2, 8); ctx.fillRect(s.x - 4, s.y - 1, 8, 2);
      });
      ctx.globalAlpha = 1;
    }
    drawStrip(bg.clouds, scroll * 0.12, 10);
    drawStrip(bg.hills, scroll * 0.25, GROUND_Y - 190 + 6);
    drawStrip(bg.trees, scroll * 0.55, GROUND_Y - 150 + 8);
    if (bg.flies.length) {
      bg.flies.forEach(f => {
        const x = (((f.x - scroll * 0.4) % W) + W) % W, y = f.y + Math.sin(tick * 0.03 + f.p) * 10;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(tick * 0.08 + f.p);
        ctx.fillStyle = '#fff59a'; ctx.fillRect(Math.floor(x), Math.floor(y), 3, 3);
      });
      ctx.globalAlpha = 1;
    }
  }
  function drawGround() { drawStrip(bg.ground, scroll, GROUND_Y - bg.deco); }

  function drawPipeBody(x, y, w, h, P) {
    if (h <= 0) return;
    ctx.fillStyle = P.o; ctx.fillRect(x - 2, y, w + 4, h);
    ctx.fillStyle = P.main; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = P.light; ctx.fillRect(x + 6, y, 8, h);
    ctx.fillStyle = P.dark; ctx.fillRect(x + w - 14, y, 10, h);
    if (P.rings) {
      ctx.fillStyle = P.dark;
      for (let ry = y + 10; ry < y + h; ry += 30) ctx.fillRect(x, ry, w, 4);
    }
  }
  function drawPipeCap(x, y, w, P) {
    ctx.fillStyle = P.o; ctx.fillRect(x - 7, y - 2, w + 14, CAP_H + 4);
    ctx.fillStyle = P.main; ctx.fillRect(x - 5, y, w + 10, CAP_H);
    ctx.fillStyle = P.light; ctx.fillRect(x + 1, y, 8, CAP_H);
    ctx.fillStyle = P.dark; ctx.fillRect(x + w - 8, y, 10, CAP_H);
    ctx.fillStyle = P.dark; ctx.fillRect(x - 5, y + CAP_H - 4, w + 10, 4);
  }
  function drawPipes() {
    const P = L.pipe;
    for (const p of pipes) {
      const top = Math.round(p.gapY - p.gap / 2), bot = Math.round(p.gapY + p.gap / 2), x = Math.round(p.x);
      drawPipeBody(x, 0, p.w, top - CAP_H, P);
      drawPipeCap(x, top - CAP_H, p.w, P);
      drawPipeBody(x, bot + CAP_H, p.w, GROUND_Y - bot - CAP_H + 6, P);
      drawPipeCap(x, bot, p.w, P);
    }
  }
  function drawPickups() {
    for (const p of pipes) {
      if (p.star && !p.taken) {
        const bob = Math.sin(tick * 0.1 + p.phase) * 3;
        ctx.drawImage(Sprites.star, Math.round(p.x + p.w / 2 - 13), Math.round(p.gapY - 13 + bob));
      }
    }
  }

  function drawFrog(x, y, rot, flapping, scale = 1, alpha = 1) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    const spr = flapping ? Sprites.frogB : Sprites.frogA;
    ctx.drawImage(spr, -FROG_W / 2 * scale, -FROG_H / 2 * scale, FROG_W * scale, FROG_H * scale);
    ctx.restore();
  }

  function drawRabbit(x, y, flip, bride) {
    const r = L.rabbit, spr = Sprites.rabbit(r);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    if (bride) {                                   // veil behind her
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-27, -13, 54, 62);
      ctx.fillStyle = 'rgba(255,200,230,.7)'; ctx.fillRect(-27, 46, 54, 3);
    }
    ctx.drawImage(spr, -RAB_W / 2, -RAB_H / 2);
    if (bride) {                                   // flower crown + bouquet
      const cs = ['#ff7fb0', '#ffffff', '#ffd23f', '#ff7fb0', '#ffffff'];
      for (let i = 0; i < 5; i++) { ctx.fillStyle = cs[i]; ctx.fillRect(-12 + i * 5, -13, 4, 4); }
      ctx.fillStyle = '#3f9b2b'; ctx.fillRect(-20, 16, 12, 10);
      ctx.fillStyle = '#ff7fb0'; ctx.fillRect(-22, 10, 6, 6); ctx.fillRect(-14, 8, 6, 6);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-18, 13, 6, 6);
    }
    ctx.restore();
  }

  function drawGroomGear(x, y) {
    ctx.fillStyle = '#14141f';
    ctx.fillRect(Math.round(x - 16), Math.round(y - FROG_H / 2 - 3), 32, 4);     // brim
    ctx.fillRect(Math.round(x - 9), Math.round(y - FROG_H / 2 - 16), 18, 14);    // hat
    ctx.fillStyle = '#d8264a'; ctx.fillRect(Math.round(x - 9), Math.round(y - FROG_H / 2 - 7), 18, 3);
    ctx.fillStyle = '#d8264a';                                                   // bow tie
    ctx.fillRect(Math.round(x - 10), Math.round(y + 7), 8, 8); ctx.fillRect(Math.round(x + 2), Math.round(y + 7), 8, 8);
    ctx.fillStyle = '#8f1230'; ctx.fillRect(Math.round(x - 3), Math.round(y + 9), 6, 5);
  }

  function drawArch(alpha) {
    const cx = 200, base = GROUND_Y + 2, r = 66;
    const cols = ['#ff7fb0', '#ffffff', '#ffc2d9', '#ffd23f'];
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - r - 6, base - 96, 10, 96); ctx.fillRect(cx + r - 4, base - 96, 10, 96);
    ctx.fillStyle = '#e3d2f2'; ctx.fillRect(cx - r - 6, base - 96, 3, 96); ctx.fillRect(cx + r - 4, base - 96, 3, 96);
    for (let k = 0; k <= 18; k++) {
      const an = Math.PI * k / 18;
      const x = Math.round(cx - Math.cos(an) * (r + 1)), y = Math.round(base - 96 - Math.sin(an) * 52);
      ctx.fillStyle = '#3f9b2b'; ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.fillStyle = cols[k % 4]; ctx.fillRect(x - 3, y - 3, 6, 6);
    }
    for (let y = base - 90, j = 0; y < base - 8; y += 16, j++) {
      ctx.fillStyle = cols[j % 4]; ctx.fillRect(cx - r - 3, y, 6, 6);
      ctx.fillStyle = cols[(j + 2) % 4]; ctx.fillRect(cx + r - 1, y, 6, 6);
    }
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      const a = clamp(p.life / 25, 0, 1);
      ctx.globalAlpha = p.type === 'conf' ? 1 : a;
      if (p.type === 'heart') ctx.drawImage(Sprites.heart, Math.round(p.x - 10), Math.round(p.y));
      else if (p.type === 'text') txt(p.text, p.x, p.y, 10, p.color, 'center', '#1b2a3a', 4);
      else { ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); }
    }
    ctx.globalAlpha = 1;
  }

  function drawStarsRow(cx, y, got, big) {
    const spr = big ? [Sprites.starBig, Sprites.starBigGray] : [Sprites.star, Sprites.starGray];
    const w = spr[0].width, gap = big ? 12 : 6;
    const total = 3 * w + 2 * gap;
    for (let i = 0; i < 3; i++) ctx.drawImage(i < got ? spr[0] : spr[1], Math.round(cx - total / 2 + i * (w + gap)), y);
  }

  function dim(a = 0.5) { ctx.fillStyle = 'rgba(8,20,12,' + a + ')'; ctx.fillRect(0, 0, W, H); }

  /* ---------- HUD ---------- */
  function drawHud() {
    for (let i = 0; i < 3; i++) ctx.drawImage(i < lives ? Sprites.heart : Sprites.heartGray, 12 + i * 26, 14);
    txt(String(score), W / 2, 44, 28, '#ffffff', 'center', '#1b2a3a', 8);
    txt('PIPES ' + Math.min(passed, L.goal) + '/' + L.goal, W / 2, 80, 9, '#ffffff', 'center', '#1b2a3a', 4);
    // progress bar to the bunny
    const bw = 140, bx = W / 2 - bw / 2;
    ctx.fillStyle = '#12301a'; ctx.fillRect(bx - 3, 96, bw + 6, 12);
    ctx.fillStyle = '#c9e8b8'; ctx.fillRect(bx, 99, bw, 6);
    ctx.fillStyle = '#ff6fa3'; ctx.fillRect(bx, 99, bw * Math.min(1, passed / L.goal), 6);
    // pause
    buttons.push({ id: 'pause', x: W - 46, y: 8, w: 38, h: 38 });
    ctx.fillStyle = '#12301a'; ctx.fillRect(W - 46, 8, 38, 38);
    ctx.fillStyle = '#5ccb4a'; ctx.fillRect(W - 43, 11, 32, 32);
    ctx.fillStyle = '#fff'; ctx.fillRect(W - 35, 18, 6, 18); ctx.fillRect(W - 23, 18, 6, 18);
  }

  function soundButton() {
    buttons.push({ id: 'snd', x: W - 46, y: 8, w: 38, h: 38 });
    ctx.fillStyle = '#12301a'; ctx.fillRect(W - 46, 8, 38, 38);
    ctx.fillStyle = '#5ccb4a'; ctx.fillRect(W - 43, 11, 32, 32);
    ctx.fillStyle = '#fff';
    ctx.fillRect(W - 37, 22, 6, 10); ctx.fillRect(W - 32, 19, 4, 16); ctx.fillRect(W - 28, 16, 3, 22);
    if (Sfx.muted) { ctx.fillStyle = '#ff4f6d'; for (let i = 0; i < 12; i += 3) { ctx.fillRect(W - 24 + i, 17 + i * 1.5, 4, 4); ctx.fillRect(W - 24 + i, 35 - i * 1.5 - 4, 4, 4); } }
    else { ctx.fillRect(W - 21, 22, 3, 10); ctx.fillRect(W - 17, 19, 3, 16); }
  }

  /* ---------- screens ---------- */
  function screenMenu() {
    soundButton();
    const bob = Math.sin(tick * 0.06) * 6;
    title3d('FROGGY', W / 2, 110 + bob * 0.4, 38, '#ffe14a', '#c97a12', '#3a2a08');
    title3d('FLY', W / 2, 172 + bob * 0.4, 56, '#7dff6a', '#2c7a22', '#12301a');
    drawFrog(W / 2, 290 + bob, Math.sin(tick * 0.05) * 0.12, tick % 24 < 10, 2.2);
    button('play', 'PLAY', 80, 378, 200, 54);
    button('levels', 'LEVELS', 80, 450, 200, 54, '#3f8fe0', '#2457a0');
    const done = save.stars.reduce((a, b) => a + b, 0);
    txt('STARS ' + done + '/' + LEVELS.length * 3, W / 2, 530, 9, '#ffffff', 'center', '#12301a', 4);
    // teaser bunny
    L = LEVELS[0];
    drawRabbit(318, GROUND_Y + 2 - RAB_H / 2 - Math.abs(Math.sin(tick * 0.07)) * 5, true);
    txt('TAP OR SPACE TO FLY', W / 2, 600, 8, '#fff5b0', 'center', '#3a1f0e', 4);
  }

  function screenLevels() {
    dim(0.35);
    txt('SELECT LEVEL', W / 2, 36, 18, '#ffe14a', 'center', '#3a2a08', 7);
    for (let j = 0; j < 5; j++) {
      const i = lvPage * 5 + j, lv = LEVELS[i];
      const y = 64 + j * 88, x = 28, w = 304, h = 74;
      const open = i < save.unlocked;
      buttons.push({ id: 'lv' + i, x, y, w, h });
      ctx.fillStyle = '#12301a'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
      ctx.fillStyle = open ? '#fffdf2' : '#8a93a4'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = open ? (lv.finale ? '#e0608f' : '#4fb83a') : '#59627a'; ctx.fillRect(x, y, 60, h);
      txt(String(i + 1), x + 30, y + h / 2 + 1, i >= 9 ? 20 : 26, '#ffffff', 'center', '#12301a', 7);
      txtPlain(lv.name, x + 70, y + 20, 9, open ? '#1b3a1b' : '#d7dbe6', 'left');
      txtPlain('GOAL ' + lv.goal + ' PIPES', x + 70, y + 40, 8, open ? '#5a6b52' : '#c1c6d3', 'left');
      txtPlain(lv.finale ? 'THE WEDDING!' : 'MEET ' + lv.rabbit.name, x + 70, y + 58, 7, open ? '#d1457a' : '#c1c6d3', 'left');
      if (open) {
        const got = save.stars[i] || 0;
        for (let q = 0; q < 3; q++) ctx.drawImage(q < got ? Sprites.starSmall : Sprites.starGray, x + w - 70 + q * 20 - 4, y + 8, 18, 18);
      } else {
        ctx.fillStyle = '#12301a'; ctx.fillRect(x + w - 40, y + 30, 22, 18); ctx.fillRect(x + w - 36, y + 20, 14, 12);
        ctx.fillStyle = '#8a93a4'; ctx.fillRect(x + w - 32, y + 24, 6, 8);
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(x + w - 38, y + 32, 18, 14);
      }
    }
    const pages = Math.ceil(LEVELS.length / 5);
    txt('PAGE ' + (lvPage + 1) + '/' + pages, W / 2, 526, 8, '#ffffff', 'center', '#12301a', 4);
    button('pgprev', '<', 28, 552, 64, 40, lvPage > 0 ? '#3f8fe0' : '#7f8aa0', lvPage > 0 ? '#2457a0' : '#5a6478', 16);
    button('menu', 'BACK', 110, 552, 140, 40, '#e0603f', '#a03a24', 12);
    button('pgnext', '>', 268, 552, 64, 40, lvPage < pages - 1 ? '#3f8fe0' : '#7f8aa0', lvPage < pages - 1 ? '#2457a0' : '#5a6478', 16);
  }

  function screenReady() {
    dim(0.12);
    ctx.fillStyle = 'rgba(10,30,15,.62)'; ctx.fillRect(24, 120, 312, 176);
    ctx.strokeStyle = '#5ccb4a'; ctx.lineWidth = 3; ctx.strokeRect(25.5, 121.5, 309, 173);
    txt('LEVEL ' + (lvlIdx + 1), W / 2, 152, 20, '#ffe14a', 'center', '#3a2a08', 7);
    txt(L.name, W / 2, 190, 10, '#ffffff', 'center', '#12301a', 4);
    txt('PASS ' + L.goal + ' PIPES', W / 2, 232, 9, '#bff5ae', 'center', '#12301a', 4);
    txt(L.finale ? 'AND MARRY ' + L.rabbit.name + '!' : 'AND MEET ' + L.rabbit.name + '!', W / 2, 256, 9, '#ffc2d9', 'center', '#12301a', 4);
    if (tick % 60 < 38) txt('TAP TO START', W / 2, 460, 14, '#ffffff', 'center', '#12301a', 5);
    button('menu', 'MENU', 12, 12, 84, 34, '#e0603f', '#a03a24', 9);
    // hearts preview
    for (let i = 0; i < 3; i++) ctx.drawImage(Sprites.heart, W / 2 - 39 + i * 26, 268);
  }

  function screenPause() {
    dim(0.6);
    txt('PAUSED', W / 2, 200, 28, '#ffe14a', 'center', '#3a2a08', 8);
    button('resume', 'RESUME', 80, 270, 200, 54);
    button('restart', 'RESTART', 80, 345, 200, 48, '#3f8fe0', '#2457a0', 12);
    button('levels', 'LEVELS', 80, 410, 200, 48, '#e0603f', '#a03a24', 12);
  }

  function screenOver() {
    if (overT < 40) return;
    dim(0.35);
    panel(40, 130, 280, 296);
    txtPlain('OH NO!', W / 2, 172, 24, '#d1304f');
    txtPlain('FROGGY NEEDS A REST', W / 2, 208, 8, '#4a5a44');
    txtPlain('SCORE ' + score, W / 2, 250, 14, '#1b3a1b');
    txtPlain(passed + '/' + L.goal + ' PIPES', W / 2, 282, 9, '#5a6b52');
    button('retry', 'TRY AGAIN', 70, 308, 220, 46, '#4fb83a', '#2c7a22', 12);
    button('levels', 'LEVELS', 70, 372, 220, 40, '#3f8fe0', '#2457a0', 12);
  }

  function screenMeet() {
    const m = meet;
    if (L.finale && m.arrive >= 0) drawArch(clamp((m.t - m.arrive) / 40, 0, 1));
    const rabbitHop = m.arrive < 0 && m.t > 30 && Math.abs(MEET_RABBIT_X - m.rx) > 0.5
      ? Math.abs(Math.sin(m.t * 0.25)) * 8 : (m.arrive >= 0 ? Math.max(0, Math.sin((m.t - m.arrive) * 0.12)) * 4 : 0);
    drawRabbit(m.rx, GROUND_Y + 2 - RAB_H / 2 - rabbitHop, true, L.finale);
    const happy = m.arrive >= 0 ? Math.max(0, Math.sin((m.t - m.arrive) * 0.12 + 1.5)) * 4 : 0;
    const fy = frog.y - happy;
    drawFrog(frog.x, fy, frog.rot, frog.flapT > 0, 1);
    if (L.finale) drawGroomGear(frog.x, fy);

    if (state === 'meet') {
      if (m.arrive < 0) txt(L.rabbit.name + ' IS COMING!', W / 2, 130, 11, '#ffffff', 'center', '#12301a', 5);
      if (canSkip() && tick % 60 < 38) txt('TAP TO SKIP', W / 2, 600, 8, '#ffffff', 'center', '#12301a', 4);
    }
  }

  function drawMeetBubbles() {
    const m = meet;
    if (!m || state !== 'meet' || m.arrive < 0) return;
    const a = m.t - m.arrive;
    const happy = Math.max(0, Math.sin(a * 0.12 + 1.5)) * 4;
    const bunnyBub = () => bubble(m.rx, GROUND_Y - RAB_H - 2, L.bunny, L.rabbit.name);
    const frogBub = () => bubble(frog.x, frog.y - happy - 24, L.froggy, 'FROGGY');
    if (L.finale) {
      if (a >= 12 && a < 88) frogBub();                // Froggy proposes first
      else if (a >= 92 && a < 160) bunnyBub();         // Bella says yes
      if (a >= 150 && a < 215) {                       // little ring floats up
        const rx = (frog.x + m.rx) / 2, ry = GROUND_Y - 45 - (a - 150) * 0.9;
        ctx.strokeStyle = '#12301a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(rx, ry, 8, 0, 6.3); ctx.stroke();
        ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(rx, ry, 8, 0, 6.3); ctx.stroke();
        ctx.fillStyle = '#12301a'; ctx.fillRect(rx - 5, ry - 16, 10, 10);
        ctx.fillStyle = '#8fe8ff'; ctx.fillRect(rx - 3, ry - 14, 6, 6);
      }
      if (m.married && a >= 170) {
        const b = Math.sin(tick * 0.1) * 3;
        title3d('JUST MARRIED!', W / 2, 150 + b, 22, '#ffe14a', '#c9406f', '#3a0f24');
        txt('FROGGY + BELLA', W / 2, 196, 10, '#ffffff', 'center', '#3a0f24', 4);
      }
    } else if (a >= 12 && a < 88) bunnyBub();
    else if (a >= 92) frogBub();
  }

  function screenComplete() {
    const last = lvlIdx === LEVELS.length - 1;
    ctx.fillStyle = 'rgba(8,20,12,.25)'; ctx.fillRect(0, 0, W, H);
    panel(34, 62, 292, last ? 300 : 280);
    if (last) {
      txtPlain('THE END', W / 2, 100, 26, '#d1457a');
      txtPlain('FROGGY AND BELLA', W / 2, 136, 8, '#4a5a44');
      txtPlain('LIVE HAPPILY EVER AFTER!', W / 2, 152, 8, '#4a5a44');
    } else {
      txtPlain('LEVEL ' + (lvlIdx + 1) + ' CLEAR!', W / 2, 100, 18, '#2c7a22');
      txtPlain('YOU MET ' + L.rabbit.name + '!', W / 2, 134, 9, '#d1457a');
    }
    drawStarsRow(W / 2, last ? 166 : 154, meet.stars, true);
    txtPlain('SCORE ' + score, W / 2, last ? 232 : 224, 13, '#1b3a1b');
    txtPlain('BEST ' + (save.best[lvlIdx] || score), W / 2, last ? 254 : 248, 8, '#6a7a60');
    if (last) {
      button('again', 'PLAY AGAIN', 64, 276, 232, 44, '#4fb83a', '#2c7a22', 12);
      button('replay', 'REPLAY', 64, 334, 110, 34, '#e8a63a', '#a8741f', 9);
      button('levels', 'LEVELS', 186, 334, 110, 34, '#3f8fe0', '#2457a0', 9);
    } else {
      button('next', 'NEXT LEVEL', 64, 268, 232, 44, '#4fb83a', '#2c7a22', 12);
      button('replay', 'REPLAY', 64, 326, 110, 34, '#e8a63a', '#a8741f', 9);
      button('levels', 'LEVELS', 186, 326, 110, 34, '#3f8fe0', '#2457a0', 9);
    }
  }

  /* ---------- main draw ---------- */
  function draw() {
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    buttons.length = 0;

    const inMenus = state === 'menu' || state === 'levels';
    if (inMenus) { L = LEVELS[0]; bg = getBg(0); }
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

    drawBackdrop();
    if (!inMenus) drawPipes();
    drawGround();
    if (!inMenus) drawPickups();

    if (state === 'ready' || state === 'play' || state === 'paused' || state === 'over') {
      if (!(frog.invuln > 0 && Math.floor(frog.invuln / 4) % 2 === 0 && state === 'play')) {
        drawFrog(frog.x, frog.y, frog.rot, frog.flapT > 0, 1);
      }
    }
    if (state === 'meet' || state === 'complete') screenMeet();
    drawParticles();
    if (state === 'meet') drawMeetBubbles();
    ctx.restore();

    if (state === 'menu') screenMenu();
    else if (state === 'levels') screenLevels();
    else if (state === 'ready') screenReady();
    else if (state === 'play') drawHud();
    else if (state === 'paused') { drawHud(); screenPause(); }
    else if (state === 'over') { drawHud(); screenOver(); }
    else if (state === 'meet') drawHud();
    else if (state === 'complete') screenComplete();
  }

  /* ---------- input ---------- */
  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }

  function act(id) {
    Sfx.click();
    switch (id) {
      case 'play': startLevel(clamp(save.unlocked, 1, LEVELS.length) - 1); break;
      case 'levels': lvPage = Math.floor((clamp(save.unlocked, 1, LEVELS.length) - 1) / 5); state = 'levels'; if (frog) frog.invuln = 0; break;
      case 'pgprev': lvPage = Math.max(0, lvPage - 1); break;
      case 'pgnext': lvPage = Math.min(Math.ceil(LEVELS.length / 5) - 1, lvPage + 1); break;
      case 'menu': state = 'menu'; break;
      case 'snd': Sfx.toggle(); break;
      case 'pause': if (state === 'play') state = 'paused'; break;
      case 'resume': state = 'play'; break;
      case 'restart': case 'retry': case 'replay': startLevel(lvlIdx); break;
      case 'next': startLevel(lvlIdx + 1); break;
      case 'again': startLevel(0); break;
      default:
        if (id.startsWith('lv')) { const i = parseInt(id.slice(2), 10); if (i < save.unlocked) startLevel(i); else Sfx.hit(); }
    }
  }

  function tapWorld() {
    if (state === 'menu') act('play');
    else if (state === 'ready' || state === 'play') flap();
    else if (state === 'meet' && canSkip()) state = 'complete';
  }

  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    Sfx.init();
    const p = toLogical(e);
    ptr.x = p.x; ptr.y = p.y; ptr.down = true;
    for (let i = buttons.length - 1; i >= 0; i--) {
      const b = buttons[i];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { act(b.id); return; }
    }
    tapWorld();
  });
  window.addEventListener('pointerup', () => { ptr.down = false; });
  window.addEventListener('pointercancel', () => { ptr.down = false; });
  window.addEventListener('contextmenu', e => e.preventDefault());

  window.addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(e.code)) {
      e.preventDefault(); Sfx.init();
      if (e.repeat) return;
      if (state === 'complete' && meet) act(lvlIdx === LEVELS.length - 1 ? 'again' : 'next');
      else if (state === 'over' && overT > 40) act('retry');
      else if (state === 'paused') act('resume');
      else tapWorld();
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      if (state === 'play') state = 'paused'; else if (state === 'paused') state = 'play';
    } else if (e.code === 'KeyM') { Sfx.toggle(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') state = 'paused'; });

  /* ---------- resize & loop ---------- */
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const h = Math.min(vh, vw * 16 / 9), w = h * 9 / 16;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    S = canvas.width / W;
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 100));

  let last = performance.now(), acc = 0;
  const DT = 1000 / 60;
  function frame(now) {
    acc += Math.min(100, now - last); last = now;
    while (acc >= DT) { update(); acc -= DT; }
    draw();
    requestAnimationFrame(frame);
  }

  function boot() {
    Sprites.build();
    frog = newFrog(); pipes = []; particles = [];
    L = LEVELS[0]; bg = getBg(0);
    resize();
    requestAnimationFrame(t => { last = t; frame(t); });
  }

  // wait (briefly) for the pixel font so the first frame looks right
  const fontReady = (document.fonts && document.fonts.load) ? document.fonts.load('16px "Press Start 2P"') : Promise.resolve();
  Promise.race([fontReady, new Promise(r => setTimeout(r, 1500))]).then(boot, boot);

  // small hook (handy for testing / debugging)
  window.__froggy = {
    get state() { return state; }, get lives() { return lives; }, get passed() { return passed; },
    get score() { return score; }, get pipes() { return pipes; }, get frog() { return frog; }, get level() { return lvlIdx; },
    get meet() { return meet; }, startLevel, flap, act, save
  };
})();