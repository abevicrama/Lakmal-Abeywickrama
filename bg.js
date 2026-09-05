/* Tech Background — Neural Network / Circuit effect with mouse interaction */
(function () {
  const canvas = document.getElementById('tech-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, nodes, mouse = { x: -9999, y: -9999 };
  const NODE_COUNT = 90;
  const CONNECT_DIST = 150;
  const MOUSE_DIST = 180;
  const MOUSE_REPEL = 60;

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

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  /* touch support */
  window.addEventListener('touchmove', e => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; });

  init();
  loop();
})();
