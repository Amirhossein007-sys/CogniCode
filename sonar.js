/* Shared native/PWA lifecycle for the supplied GradientWave renderer. */
'use strict';
window.Sonar = (function () {
  const canvas = document.querySelector('.sonar canvas');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let gradient = null;
  let suspended = false;
  let failed = false;
  const palettes = {
    dark: ['#0f172a', '#164e63', '#312e81', '#075985'],
    light: ['#f8fafc', '#bae6fd', '#e0e7ff', '#cffafe']
  };
  function refresh() {
    if (!gradient || failed) return;
    const colors = palettes[document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'];
    const uniforms = gradient.mesh.material.uniforms;
    uniforms.u_baseColor.value = normalizeColor(parseInt(colors[0].slice(1), 16));
    uniforms.u_waveLayers.value.forEach((layer, i) => {
      layer.value.color.value = normalizeColor(parseInt(colors[i + 1].slice(1), 16));
    });
    if (!document.hidden && !suspended) gradient.minigl.render();
  }
  function playback() {
    if (!gradient || failed) return;
    if (document.hidden || suspended || motion.matches) {
      gradient.stop();
      if (!document.hidden && !suspended) gradient.minigl.render();
    } else gradient.start();
  }
  function initialize() {
    try {
      gradient = new Gradient(canvas, palettes.dark);
      // Four colors match the shader's vec4; no out-of-range indexing.
      gradient.time = 180000;
      gradient.mesh.material.uniforms.u_time.value = gradient.time;
      refresh();
      playback();
    } catch (error) {
      failed = true;
      canvas.style.visibility = 'hidden';
      console.warn('Gradient unavailable; using CSS fallback.', error);
    }
  }
  function resize() {
    if (!gradient || failed) return;
    gradient.resize();
    refresh();
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    gradient?.stop();
    failed = true;
    canvas.style.visibility = 'hidden';
  });
  canvas.addEventListener('webglcontextrestored', () => {
    failed = false;
    canvas.style.visibility = '';
    initialize();
  });
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', () => { suspended = true; playback(); });
  window.addEventListener('pageshow', () => { suspended = false; playback(); });
  document.addEventListener('visibilitychange', playback);
  motion.addEventListener('change', playback);
  new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  initialize();
  // Preserve existing callers without adding touch-triggered animation work.
  return { refresh, ripple() {}, setPulse() {} };
})();
