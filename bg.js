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
    initBug();
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

  /* ── ladybug Easter egg ── */
  const bug = {
    x: 0, y: 0,
    vx: 0.6, vy: 0.4,
    angle: 0,              /* facing direction in radians */
    size: 14,
    scared: false,         /* fleeing mouse */
    wiggle: 0,             /* leg animation phase */
    caught: false,
  };

  function initBug() {
    bug.x = W * 0.3 + Math.random() * W * 0.4;
    bug.y = H * 0.3 + Math.random() * H * 0.4;
  }

  function drawBug() {
    if (bug.caught) return;
    const s = bug.size;
    ctx.save();
    ctx.translate(bug.x, bug.y);
    ctx.rotate(bug.angle + Math.PI / 2);
    ctx.globalAlpha = 0.92;

    /* shadow */
    ctx.beginPath();
    ctx.ellipse(2, 2, s * 0.9, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fill();

    /* body — red ellipse */
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.85, s, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e8211a';
    ctx.fill();

    /* shell split line */
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s);
    ctx.strokeStyle = '#1a0000';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    /* head — dark circle */
    ctx.beginPath();
    ctx.arc(0, -s + 1, s * 0.52, 0, Math.PI * 2);
    ctx.fillStyle = '#1a0000';
    ctx.fill();

    /* eyes */
    ctx.beginPath();
    ctx.arc(-s * 0.22, -s + 0.5, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc( s * 0.22, -s + 0.5, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    /* spots */
    const spots = [[-s*0.4,-s*0.1],[s*0.4,-s*0.1],[-s*0.32,s*0.42],[s*0.32,s*0.42],[0,s*0.2]];
    ctx.fillStyle = '#1a0000';
    spots.forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
    });

    /* antennae */
    ctx.strokeStyle = '#1a0000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s + 1);
    ctx.quadraticCurveTo(-s * 0.8, -s * 1.5, -s * 0.6, -s * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo( s * 0.2, -s + 1);
    ctx.quadraticCurveTo( s * 0.8, -s * 1.5, s * 0.6, -s * 1.9);
    ctx.stroke();

    /* legs — 3 each side, animated */
    bug.wiggle += bug.scared ? 0.22 : 0.07;
    const legPhase = Math.sin(bug.wiggle);
    [[-1, 1]].forEach(() => {
      for (let side = -1; side <= 1; side += 2) {
        for (let li = 0; li < 3; li++) {
          const ly = -s * 0.3 + li * s * 0.35;
          const swing = legPhase * (li % 2 === 0 ? 1 : -1) * 3;
          ctx.beginPath();
          ctx.moveTo(side * s * 0.8, ly);
          ctx.lineTo(side * (s * 1.5 + swing), ly + 4);
          ctx.strokeStyle = '#1a0000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function updateBug() {
    if (bug.caught) return;
    const dx = bug.x - mouse.x;
    const dy = bug.y - mouse.y;
    const distToMouse = Math.sqrt(dx * dx + dy * dy);
    const FLEE_RADIUS = 160;

    bug.scared = distToMouse < FLEE_RADIUS;

    if (bug.scared) {
      /* flee — accelerate away from mouse */
      const flee = (FLEE_RADIUS - distToMouse) / FLEE_RADIUS;
      bug.vx += (dx / distToMouse) * flee * 0.55;
      bug.vy += (dy / distToMouse) * flee * 0.55;
    } else {
      /* wander — gentle random drift */
      bug.vx += (Math.random() - 0.5) * 0.06;
      bug.vy += (Math.random() - 0.5) * 0.06;
    }

    /* speed cap */
    const spd = Math.sqrt(bug.vx * bug.vx + bug.vy * bug.vy);
    const maxSpd = bug.scared ? 4.5 : 1.2;
    if (spd > maxSpd) { bug.vx = bug.vx / spd * maxSpd; bug.vy = bug.vy / spd * maxSpd; }

    /* dampen */
    bug.vx *= 0.94;
    bug.vy *= 0.94;

    bug.x += bug.vx;
    bug.y += bug.vy;

    /* face direction of travel */
    if (spd > 0.1) bug.angle = Math.atan2(bug.vy, bug.vx);

    /* bounce off edges */
    const pad = bug.size + 10;
    if (bug.x < pad)  { bug.x = pad;    bug.vx =  Math.abs(bug.vx); }
    if (bug.x > W-pad){ bug.x = W-pad;  bug.vx = -Math.abs(bug.vx); }
    if (bug.y < pad)  { bug.y = pad;    bug.vy =  Math.abs(bug.vy); }
    if (bug.y > H-pad){ bug.y = H-pad;  bug.vy = -Math.abs(bug.vy); }
  }

  function showBugPopup() {
    /* create overlay */
    const overlay = document.createElement('div');
    overlay.id = 'bug-overlay';
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:9999',
      'display:flex','align-items:center','justify-content:center',
      'background:rgba(0,0,0,0.45)','backdrop-filter:blur(4px)',
      'animation:bugFadeIn 0.3s ease',
    ].join(';');

    const box = document.createElement('div');
    box.style.cssText = [
      'background:linear-gradient(135deg,#1a2a6c,#b21f1f,#fdbb2d)',
      'border-radius:20px','padding:48px 56px','text-align:center',
      'box-shadow:0 24px 64px rgba(0,0,0,0.5)',
      'position:relative','max-width:420px','width:90%',
      'animation:bugPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
    ].join(';');

    box.innerHTML = `
      <div style="font-size:5rem;line-height:1;margin-bottom:16px;">🐞</div>
      <h2 style="color:#fff;font-family:'Poppins',sans-serif;font-size:1.7rem;margin-bottom:10px;">Wow! You found a Bug</h2>
      <p style="color:rgba(255,255,255,0.78);font-family:'Open Sans',sans-serif;font-size:0.95rem;margin-bottom:28px;">
        A rare ladybug hiding in the code. You've got sharp eyes! 🎉
      </p>
      <button id="bug-close" style="
        background:#fff;color:#1a2a6c;border:none;
        padding:12px 32px;border-radius:50px;
        font-family:'Poppins',sans-serif;font-weight:700;
        font-size:1rem;cursor:pointer;
        box-shadow:0 4px 16px rgba(0,0,0,0.2);
        transition:transform 0.15s ease,box-shadow 0.15s ease;
      ">Close ✕</button>
    `;

    /* inject keyframes once */
    if (!document.getElementById('bug-styles')) {
      const st = document.createElement('style');
      st.id = 'bug-styles';
      st.textContent = `
        @keyframes bugFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes bugPop { from { transform:scale(0.5) rotate(-8deg); opacity:0 }
                             to   { transform:scale(1)   rotate(0deg);  opacity:1 } }
        #bug-close:hover { transform:scale(1.06); box-shadow:0 6px 20px rgba(0,0,0,0.3); }
      `;
      document.head.appendChild(st);
    }

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); bug.caught = false; initBug(); };
    document.getElementById('bug-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
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
    updateBug();
    draw();
    drawBug();
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

  /* ladybug click detection — check on mousedown before tilt starts */
  window.addEventListener('click', e => {
    if (bug.caught) return;
    const dx = e.clientX - bug.x;
    const dy = e.clientY - bug.y;
    if (Math.sqrt(dx*dx + dy*dy) < bug.size * 2.2) {
      bug.caught = true;
      showBugPopup();
    }
  });

  /* update cursor when hovering bug */
  window.addEventListener('mousemove', e => {
    if (bug.caught) return;
    const dx = e.clientX - bug.x;
    const dy = e.clientY - bug.y;
    canvas.style.cursor = Math.sqrt(dx*dx + dy*dy) < bug.size * 2.2 ? 'pointer' : '';
  }, { capture: true });

  window.addEventListener('mousedown', e => {
    tilt.dragging = true;
    tilt.startX = e.clientX;
    tilt.startY = e.clientY;
    if (canvas.style.cursor !== 'pointer') canvas.style.cursor = 'grabbing';
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
