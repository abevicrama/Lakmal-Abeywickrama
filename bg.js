/* Tech Background — Neural Network / Circuit effect with mouse interaction */
(function () {
  const canvas = document.getElementById('tech-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, nodes, mouse = { x: -9999, y: -9999 }, prevMouse = { x: -9999, y: -9999 };
  const NODE_COUNT = 90;
  const CONNECT_DIST = 150;
  const MOUSE_DIST = 180;
  const MOUSE_REPEL = 60;

  /* ── water ripple pool ── */
  const ripples = [];
  let rippleTimer = 0;

  function spawnRipple(x, y, speed) {
    ripples.push({
      x, y,
      r: 2,
      maxR: 90 + Math.random() * 60,
      life: 1,          /* 0..1, fades out */
      decay: 0.016 + Math.random() * 0.012,
      lineW: 1 + speed * 0.8,
      rings: Math.random() < 0.4 ? 2 : 1,  /* occasional double ring */
    });
    if (ripples.length > 30) ripples.shift(); /* cap pool */
  }

  /* ── palette pulled from CSS vars ── */
  function getPalette() {
    const dark = document.documentElement.dataset.theme === 'dark';
    return {
      bg:        dark ? '#071423' : '#f0f4ff',
      node:      dark ? 'rgba(96,165,250,0.7)'  : 'rgba(0,123,255,0.55)',
      line:      dark ? 'rgba(96,165,250,0.18)' : 'rgba(0,123,255,0.12)',
      mouseLine: dark ? 'rgba(52,211,153,0.35)' : 'rgba(0,188,212,0.35)',
      glyph:     dark ? 'rgba(96,165,250,0.08)' : 'rgba(0,123,255,0.06)',
    };
  }

  /* ── floating code glyphs ── */
  const GLYPHS = ['01','{}','</>','()','[]','fn','AI','ML','∑','∇','λ','π','//','&&','||','!=','==','>>','++','--','#!','∈','⊕'];
  function makeGlyph() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      text: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      size: 10 + Math.random() * 14,
      speed: 0.12 + Math.random() * 0.25,
      opacity: 0.04 + Math.random() * 0.09,
      drift: (Math.random() - 0.5) * 0.3,
    };
  }

  function makeNode() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 1.5 + Math.random() * 2.5,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    nodes = Array.from({ length: NODE_COUNT }, makeNode);
    glyphs = Array.from({ length: 28 }, makeGlyph);
  }

  let glyphs = [];

  /* ── draw ── */
  function draw() {
    const p = getPalette();
    ctx.clearRect(0, 0, W, H);

    /* background */
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);

    /* floating glyphs */
    ctx.font = 'monospace';
    glyphs.forEach(g => {
      ctx.save();
      ctx.globalAlpha = g.opacity;
      ctx.fillStyle = p.glyph;
      ctx.font = `${g.size}px monospace`;
      ctx.fillText(g.text, g.x, g.y);
      ctx.restore();
      g.y -= g.speed;
      g.x += g.drift;
      if (g.y < -30) { g.y = H + 20; g.x = Math.random() * W; }
      if (g.x < -40 || g.x > W + 40) g.x = Math.random() * W;
    });

    /* connections */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          ctx.beginPath();
          ctx.strokeStyle = p.line;
          ctx.lineWidth = 0.8;
          ctx.globalAlpha = 1 - dist / CONNECT_DIST;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    /* mouse lines */
    ctx.globalAlpha = 1;
    nodes.forEach(n => {
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_DIST) {
        ctx.beginPath();
        ctx.strokeStyle = p.mouseLine;
        ctx.lineWidth = 1;
        ctx.globalAlpha = (1 - dist / MOUSE_DIST) * 0.9;
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    });

    /* nodes */
    ctx.globalAlpha = 1;
    nodes.forEach(n => {
      n.pulse += 0.03;
      const pr = n.r + Math.sin(n.pulse) * 0.6;
      ctx.beginPath();
      ctx.arc(n.x, n.y, pr, 0, Math.PI * 2);
      ctx.fillStyle = p.node;
      ctx.fill();
    });

    /* ── water ripples ── */
    ctx.globalAlpha = 1;
    const dark = document.documentElement.dataset.theme === 'dark';
    const rippleColor = dark ? '96,165,250' : '0,123,255';
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      const progress = 1 - rp.life;                          /* 0=new, 1=gone */
      const eased = Math.sin(progress * Math.PI);            /* bell curve */
      const alpha = rp.life * eased * 0.55;

      for (let ring = 0; ring < rp.rings; ring++) {
        const ringOffset = ring * 18;
        const r = rp.r + ringOffset;
        if (r > rp.maxR) continue;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rippleColor},${alpha * (1 - ring * 0.4)})`;
        ctx.lineWidth = rp.lineW * (1 - progress * 0.5);
        ctx.stroke();
      }

      rp.r += (rp.maxR / 55);        /* expand speed */
      rp.life -= rp.decay;
      if (rp.life <= 0) ripples.splice(i, 1);
    }

    /* ── cursor water droplet ── */
    if (mouse.x > 0) {
      const dropAlpha = dark ? 0.55 : 0.45;
      /* outer soft ring */
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rippleColor},${dropAlpha * 0.4})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      /* inner filled dot */
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
      const cg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 4);
      cg.addColorStop(0, dark ? 'rgba(52,211,153,0.9)' : 'rgba(0,188,212,0.85)');
      cg.addColorStop(1, dark ? 'rgba(96,165,250,0.3)' : 'rgba(0,123,255,0.2)');
      ctx.fillStyle = cg;
      ctx.fill();
    }

    /* mouse glow dot */
    if (mouse.x > 0) {
      const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_REPEL);
      const dark = document.documentElement.dataset.theme === 'dark';
      grad.addColorStop(0, dark ? 'rgba(52,211,153,0.25)' : 'rgba(0,188,212,0.18)');
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(mouse.x, mouse.y, MOUSE_REPEL, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ── physics ── */
  function update() {
    nodes.forEach(n => {
      /* mouse repulsion */
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_REPEL) {
        const force = (MOUSE_REPEL - dist) / MOUSE_REPEL * 1.2;
        n.vx += (dx / dist) * force * 0.25;
        n.vy += (dy / dist) * force * 0.25;
      }

      /* dampen */
      n.vx *= 0.985;
      n.vy *= 0.985;

      n.x += n.vx;
      n.y += n.vy;

      /* wrap edges */
      if (n.x < 0) n.x = W;
      if (n.x > W) n.x = 0;
      if (n.y < 0) n.y = H;
      if (n.y > H) n.y = 0;
    });
  }

  /* ── 3D tilt state ── */
  const tilt = { rx: 0, ry: 0, targetRx: 0, targetRy: 0, dragging: false, startX: 0, startY: 0 };
  const MAX_TILT = 22; /* degrees */

  function applyTilt() {
    /* spring lerp toward target */
    tilt.rx += (tilt.targetRx - tilt.rx) * 0.08;
    tilt.ry += (tilt.targetRy - tilt.ry) * 0.08;
    canvas.style.transform = `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.06)`;
  }

  function loop() {
    applyTilt();
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); });
  window.addEventListener('mousemove', e => {
    prevMouse.x = mouse.x;
    prevMouse.y = mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    /* spawn ripples based on mouse speed */
    const dx = mouse.x - prevMouse.x;
    const dy = mouse.y - prevMouse.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    rippleTimer++;
    const interval = speed > 8 ? 2 : speed > 3 ? 4 : 8;
    if (rippleTimer % interval === 0 && speed > 1 && mouse.x > 0) {
      spawnRipple(mouse.x, mouse.y, Math.min(speed / 10, 2));
    }

    if (tilt.dragging) {
      const dx = e.clientX - tilt.startX;
      const dy = e.clientY - tilt.startY;
      tilt.targetRy =  (dx / W) * MAX_TILT * 2;
      tilt.targetRx = -(dy / H) * MAX_TILT * 2;
      /* clamp */
      tilt.targetRy = Math.max(-MAX_TILT, Math.min(MAX_TILT, tilt.targetRy));
      tilt.targetRx = Math.max(-MAX_TILT, Math.min(MAX_TILT, tilt.targetRx));
    }
  });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  window.addEventListener('mousedown', e => {
    tilt.dragging = true;
    tilt.startX = e.clientX;
    tilt.startY = e.clientY;
    canvas.style.cursor = 'grabbing';
    /* water drop impact on click */
    spawnRipple(e.clientX, e.clientY, 2);
    spawnRipple(e.clientX, e.clientY, 1.2);
  });
  window.addEventListener('mouseup', () => {
    tilt.dragging = false;
    tilt.targetRx = 0;
    tilt.targetRy = 0;
    canvas.style.cursor = 'default';
  });

  /* touch 3D tilt */
  let touchStart = { x: 0, y: 0 };
  window.addEventListener('touchstart', e => {
    touchStart.x = e.touches[0].clientX;
    touchStart.y = e.touches[0].clientY;
    tilt.dragging = true;
    tilt.startX = touchStart.x;
    tilt.startY = touchStart.y;
    spawnRipple(touchStart.x, touchStart.y, 2);
  }, { passive: true });
  window.addEventListener('touchmove', e => {
    const tx = e.touches[0].clientX;
    const ty = e.touches[0].clientY;
    const tdx = tx - mouse.x, tdy = ty - mouse.y;
    const tspeed = Math.sqrt(tdx*tdx + tdy*tdy);
    if (tspeed > 3) spawnRipple(tx, ty, Math.min(tspeed / 10, 2));
    mouse.x = tx;
    mouse.y = ty;
    if (tilt.dragging) {
      const dx = tx - tilt.startX;
      const dy = ty - tilt.startY;
      tilt.targetRy =  (dx / W) * MAX_TILT * 2;
      tilt.targetRx = -(dy / H) * MAX_TILT * 2;
      tilt.targetRy = Math.max(-MAX_TILT, Math.min(MAX_TILT, tilt.targetRy));
      tilt.targetRx = Math.max(-MAX_TILT, Math.min(MAX_TILT, tilt.targetRx));
    }
  }, { passive: true });
  window.addEventListener('touchend', () => {
    tilt.dragging = false;
    tilt.targetRx = 0;
    tilt.targetRy = 0;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  init();
  loop();
})();
