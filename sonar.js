/* ═══════════════════════════════════════════════
   کوگنی کد — شفق قطبی نوری تعاملی (Aurora Code Pulse)
   امواج سیال و ارگانیک متناسب با سلامت کد (سالم / خطادار / تحلیل)
   پشتیبانی کامل از هر دو حالت دارک و لایت + میکرو-ریپل لمسی
   ═══════════════════════════════════════════════ */
'use strict';

window.Sonar = (function () {
  var MAX_DPR = 2;
  var host = document.querySelector('.sonar');
  var canvas = host ? host.querySelector('canvas') : null;
  if (!host || !canvas || !canvas.getContext) {
    return { refresh: function () {}, ripple: function () {}, setPulse: function () {} };
  }
  var ctx = canvas.getContext('2d');
  if (!ctx) return { refresh: function () {}, ripple: function () {}, setPulse: function () {} };

  var width = 0, height = 0;
  var raf = 0;
  var isLight = false;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ripples = [];
  var currentMode = 'idle'; // 'idle', 'analyzing', 'healthy', 'error'
  var animSpeed = 1.0;

  /* پالت‌های شفق قطبی برای حالات مختلف */
  var PALETTES = {
    dark: {
      idle: [
        { r: 6, g: 182, b: 212, a: 0.22 },   // Cyan
        { r: 14, g: 165, b: 233, a: 0.24 },  // Azure
        { r: 99, g: 102, b: 241, a: 0.20 },  // Indigo
        { r: 20, g: 184, b: 166, a: 0.16 }   // Teal
      ],
      analyzing: [
        { r: 14, g: 165, b: 233, a: 0.32 },  // Electric Azure
        { r: 168, g: 85, b: 247, a: 0.30 },  // Purple
        { r: 56, g: 189, b: 248, a: 0.32 },  // Sky
        { r: 236, g: 72, b: 153, a: 0.24 }   // Neon Pink
      ],
      healthy: [
        { r: 16, g: 185, b: 129, a: 0.28 },  // Emerald
        { r: 5, g: 150, b: 105, a: 0.24 },   // Jade
        { r: 52, g: 211, b: 153, a: 0.26 },  // Mint
        { r: 6, g: 182, b: 212, a: 0.18 }    // Cyan accent
      ],
      error: [
        { r: 239, g: 68, b: 68, a: 0.25 },   // Coral Red
        { r: 245, g: 158, b: 11, a: 0.24 },  // Amber
        { r: 244, g: 63, b: 94, a: 0.22 },   // Rose
        { r: 217, g: 119, b: 6, a: 0.18 }    // Warm Orange
      ]
    },
    light: {
      idle: [
        { r: 56, g: 189, b: 248, a: 0.18 },  // Sky blue
        { r: 99, g: 102, b: 241, a: 0.12 },  // Indigo
        { r: 14, g: 165, b: 233, a: 0.15 },  // Azure
        { r: 168, g: 85, b: 247, a: 0.10 }   // Lavender
      ],
      analyzing: [
        { r: 14, g: 165, b: 233, a: 0.24 },  // Azure
        { r: 147, g: 51, b: 234, a: 0.18 },  // Violet
        { r: 56, g: 189, b: 248, a: 0.22 },  // Sky
        { r: 244, g: 114, b: 182, a: 0.15 }  // Rose
      ],
      healthy: [
        { r: 16, g: 185, b: 129, a: 0.20 },  // Emerald
        { r: 5, g: 150, b: 105, a: 0.18 },   // Green
        { r: 52, g: 211, b: 153, a: 0.18 },  // Mint
        { r: 2, g: 132, b: 199, a: 0.12 }    // Azure
      ],
      error: [
        { r: 239, g: 68, b: 68, a: 0.18 },   // Red
        { r: 245, g: 158, b: 11, a: 0.16 },  // Amber
        { r: 220, g: 38, b: 38, a: 0.15 },   // Crimson
        { r: 251, g: 146, b: 60, a: 0.14 }   // Orange
      ]
    }
  };

  /* گره‌های مش رنگی شناور با حرکت ارگانیک */
  var nodes = [
    { x: 0.25, y: 0.20, r: 0.58, vx: 0.00030, vy: 0.00026, phase: 0 },
    { x: 0.78, y: 0.75, r: 0.68, vx: -0.00024, vy: -0.00032, phase: 1.8 },
    { x: 0.75, y: 0.25, r: 0.52, vx: -0.00028, vy: 0.00022, phase: 3.4 },
    { x: 0.20, y: 0.82, r: 0.60, vx: 0.00022, vy: -0.00026, phase: 5.1 }
  ];

  /* رنگ‌های کنونی و رنگ‌های هدف برای ترنزیشن نرم (Lerp) */
  var activeColors = [
    { r: 6, g: 182, b: 212, a: 0.22 },
    { r: 14, g: 165, b: 233, a: 0.24 },
    { r: 99, g: 102, b: 241, a: 0.20 },
    { r: 20, g: 184, b: 166, a: 0.16 }
  ];

  function updateThemeState() {
    isLight = document.documentElement.dataset.theme === 'light';
  }

  function resize() {
    var rect = host.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }

  function addRipple(x, y) {
    if (reduceMotion.matches) return;
    ripples.push({
      x: x,
      y: y,
      born: performance.now(),
      maxR: Math.max(width, height) * 0.75,
      speed: 280
    });
    if (ripples.length > 5) ripples.shift();
    wake();
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function setPulse(mode) {
    if (!mode || mode === currentMode) return;
    currentMode = mode;
    animSpeed = (mode === 'analyzing') ? 2.2 : (mode === 'error' ? 1.4 : 1.0);
    wake();
  }

  function draw(now) {
    ctx.clearRect(0, 0, width, height);

    /* پس‌زمینه پایه */
    ctx.fillStyle = isLight ? '#f8fafc' : '#0f172a';
    ctx.fillRect(0, 0, width, height);

    var t = now * 0.001 * animSpeed;
    var baseR = Math.min(width, height);

    /* به دست آوردن پالت هدف و درآمیزی نرم رنگ‌ها */
    var paletteTheme = isLight ? PALETTES.light : PALETTES.dark;
    var targetList = paletteTheme[currentMode] || paletteTheme.idle;

    for (var j = 0; j < activeColors.length; j++) {
      var tgt = targetList[j % targetList.length];
      var cur = activeColors[j];
      cur.r = lerp(cur.r, tgt.r, 0.06);
      cur.g = lerp(cur.g, tgt.g, 0.06);
      cur.b = lerp(cur.b, tgt.b, 0.06);
      cur.a = lerp(cur.a, tgt.a, 0.06);
    }

    ctx.save();
    ctx.globalCompositeOperation = isLight ? 'multiply' : 'screen';

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var c = activeColors[i % activeColors.length];

      var cx, cy;
      if (reduceMotion.matches) {
        cx = n.x * width;
        cy = n.y * height;
      } else {
        cx = (n.x + Math.sin(t * 0.45 + n.phase) * 0.13) * width;
        cy = (n.y + Math.cos(t * 0.38 + n.phase) * 0.13) * height;
      }

      var radius = n.r * baseR * (1 + Math.sin(t * 0.35 + n.phase) * 0.09);

      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(10, radius));
      var cr = Math.round(c.r), cg = Math.round(c.g), cb = Math.round(c.b);
      grad.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + c.a.toFixed(3) + ')');
      grad.addColorStop(0.55, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (c.a * 0.42).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* رسم ریپل‌های تعاملی لمسی */
    if (ripples.length > 0) {
      var alive = [];
      ctx.save();
      for (var k = 0; k < ripples.length; k++) {
        var rp = ripples[k];
        var age = (now - rp.born) / 1000;
        var r = age * rp.speed;
        var progress = r / rp.maxR;

        if (progress < 1) {
          alive.push(rp);
          var alpha = (1 - progress) * (isLight ? 0.25 : 0.40);
          var ringGrad = ctx.createRadialGradient(rp.x, rp.y, Math.max(0, r - 35), rp.x, rp.y, r + 20);
          var rc = isLight ? '14, 165, 233' : '56, 189, 248';
          ringGrad.addColorStop(0, 'rgba(' + rc + ', 0)');
          ringGrad.addColorStop(0.65, 'rgba(' + rc + ', ' + alpha + ')');
          ringGrad.addColorStop(1, 'rgba(' + rc + ', 0)');

          ctx.fillStyle = ringGrad;
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, r + 20, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      ripples = alive;
    }
  }

  function tick(now) {
    if (document.hidden) { raf = 0; return; }
    draw(now);
    if (!reduceMotion.matches) {
      raf = requestAnimationFrame(tick);
    } else if (ripples.length > 0) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  }

  function wake() {
    if (!raf && !document.hidden) {
      raf = requestAnimationFrame(tick);
    }
  }

  function refresh() {
    updateThemeState();
    draw(performance.now());
  }

  function onDown(e) {
    if (reduceMotion.matches) return;
    if (e.target.closest('input, textarea, select, .sheet, .problems, .modal')) return;
    var x = e.clientX != null ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : width / 2);
    var y = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : height / 2);
    addRipple(x, y);
  }

  function onVisibility() {
    if (!document.hidden) wake();
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(resize).observe(host);
  } else {
    window.addEventListener('resize', resize);
  }

  document.addEventListener('pointerdown', onDown, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', refresh);

  new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  updateThemeState();
  resize();
  wake();

  return {
    refresh: refresh,
    ripple: addRipple,
    setPulse: setPulse
  };
})();
