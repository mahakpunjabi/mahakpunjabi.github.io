/* Scroll scenes: the figure pins mid-screen while the space below it scrolls. Scroll progress
   through the scene (0 → 1) is handed to the page's render(p), and the caption for the current
   step shows. On phones each scene can pan a narrower camera across its drawing. */
(() => {
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const f = (n) => n.toFixed(1);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // opts: stops (step boundaries, e.g. [0, .36, .7, 1]), render(p, state), camera(p) → viewBox for phones,
  // onVisible(visible), narrowAt (scene width in px below which the camera is used).
  function scrollScene(root, opts) {
    const fig = root.querySelector('.scene-fig'), svg = root.querySelector('.scene-svg');
    const steps = root.querySelectorAll('.scene-steps > li'), track = root.querySelectorAll('.scene-track > li');
    const nav = document.querySelector('.nav');
    const stops = opts.stops, wideBox = svg.getAttribute('viewBox');
    const state = { narrow: false, visible: false, reduce };
    let p = 0, ticking = false;
    root.style.setProperty('--steps', stops.length - 1);

    function render() {
      opts.render(p, state);
      if (state.narrow && opts.camera) svg.setAttribute('viewBox', opts.camera(p));
      let k = 0;
      while (k < stops.length - 2 && p >= stops[k + 1]) k++;
      steps.forEach((el, i) => el.classList.toggle('on', i === k));
      track.forEach((el, i) => {
        el.classList.toggle('on', i === k);
        el.style.setProperty('--fill', seg(p, stops[i], stops[i + 1]).toFixed(3));
      });
    }
    function measure() {
      if (nav) document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
      const n = !!opts.camera && root.clientWidth < (opts.narrowAt || 600);
      if (n !== state.narrow) { state.narrow = n; if (!n) svg.setAttribute('viewBox', wideBox); }
      root.style.setProperty('--scene-fig-h', fig.offsetHeight + 'px');
    }
    function progress() {
      const r = root.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(fig).top) || 0;
      const range = r.height - fig.offsetHeight;
      return range > 0 ? clamp((top - r.top) / range) : 1;
    }
    function update() { ticking = false; p = progress(); render(); }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    if (reduce) { p = 1; render(); return; }
    root.classList.add('live');
    measure();
    new IntersectionObserver((entries) => {
      state.visible = entries[0].isIntersecting;
      if (opts.onVisible) opts.onVisible(state.visible);
    }).observe(fig);
    new ResizeObserver(() => { measure(); request(); }).observe(fig);
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', () => { measure(); request(); });
    update();
  }

  scrollScene.util = { clamp, seg, ease, lerp, f, reduce };
  window.scrollScene = scrollScene;
})();
