(() => {
  const btn = document.querySelector('.theme-btn');
  if (!btn) return;
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : system.matches;

  const sync = () => {
    const dark = isDark();
    btn.setAttribute('aria-pressed', dark);
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  };

  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
  system.addEventListener('change', sync);
  sync();
})();
