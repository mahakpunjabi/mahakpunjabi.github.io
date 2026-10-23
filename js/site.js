/* Site behaviour: fade sections in as they scroll into view, and reorder the project cards
   for an industry or a research audience (remembered, and shareable as ?view=research). */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll; a .gens list lights its steps one after another.
  const reveal = (el) => {
    el.classList.add('in');
    if (el.matches('.gens')) el.querySelectorAll('li').forEach((li, i) => setTimeout(() => li.classList.add('in'), reduce ? 0 : 140 * i));
  };
  const targets = document.querySelectorAll('.reveal, .gens');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -12% 0px' });
    targets.forEach((el) => io.observe(el));
  } else targets.forEach(reveal);

  // Project order by audience.
  const grid = document.getElementById('cards');
  if (!grid) return;
  const buttons = document.querySelectorAll('.seg [data-view]');
  const cards = [...grid.children];
  const store = {
    get() { try { return localStorage.getItem('view'); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem('view', v); } catch (e) { /* storage blocked */ } },
  };
  function apply(view, animate) {
    const sorted = cards.slice().sort((a, b) => a.dataset[view] - b.dataset[view]);
    const before = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
    sorted.forEach((c, i) => {
      grid.append(c);
      const n = c.querySelector('.num');
      if (n) n.textContent = String(i + 1).padStart(2, '0');
    });
    grid.dataset.view = view;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    if (!animate || reduce) return;
    sorted.forEach((c) => {
      const a = before.get(c), z = c.getBoundingClientRect();
      const dx = a.left - z.left, dy = a.top - z.top;
      if (!dx && !dy) return;
      c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: 520, easing: 'cubic-bezier(.2, .7, .2, 1)' });
    });
  }
  const fromUrl = new URLSearchParams(location.search).get('view');
  const start = ['industry', 'research'].includes(fromUrl) ? fromUrl : (store.get() === 'research' ? 'research' : 'industry');
  apply(start, false);
  buttons.forEach((b) => b.addEventListener('click', () => {
    const view = b.dataset.view;
    if (grid.dataset.view === view) return;
    apply(view, true);
    store.set(view);
    const url = new URL(location.href);
    url.searchParams.set('view', view);
    history.replaceState(null, '', url);
  }));
})();
