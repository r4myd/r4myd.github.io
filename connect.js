(() => {
  const API = /(^|\.)r4myd\.com$/.test(location.hostname) ? 'https://r4myd-api.r4myd-api.workers.dev' : 'http://127.0.0.1:8787';
  const MAIL = 'shriyadav1500@gmail.com';

  async function post(path, data) {
    try {
      const res = await fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { ok: false, error: `Couldn’t reach the server. Please mail me at ${MAIL}.` };
    }
  }

  function el(tag, text, attrs = {}) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  // contact form
  const form = document.querySelector('.contact-form');
  if (form) {
    const note = form.querySelector('.form-note');
    const button = form.querySelector('button[type=submit]');
    const setKind = kind => {
      form.dataset.kind = kind;
      form.querySelector(`input[name=kind][value=${kind}]`).checked = true;
    };
    setKind('project');
    form.addEventListener('change', e => { if (e.target.name === 'kind') setKind(e.target.value); });
    form.addEventListener('input', () => { note.textContent = ''; });

    document.querySelectorAll('a[data-kind]').forEach(a => a.addEventListener('click', () => {
      setKind(a.dataset.kind);
      setTimeout(() => form.querySelector('input[name=name]').focus({ preventScroll: true }), 400);
    }));

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      button.disabled = true;
      note.textContent = 'Sending…';
      const res = await post('/contact', data);
      button.disabled = false;
      if (!res.ok) { note.textContent = res.error; return; }
      const thanks = el('p', `Thanks, ${data.name.split(' ')[0]}. Your message is on my phone now, and I usually reply within a few hours.`, { class: 'sent' });
      form.replaceWith(thanks);
    });
  }

  // fit check
  const fit = document.querySelector('.fit-form');
  if (fit) {
    const out = document.querySelector('.fit-out');
    const note = fit.querySelector('.form-note');
    const button = fit.querySelector('button[type=submit]');
    fit.addEventListener('input', () => { note.textContent = ''; });
    document.querySelectorAll('a[href="#fit"]').forEach(a => a.addEventListener('click', () => {
      setTimeout(() => fit.jd.focus({ preventScroll: true }), 600);
    }));

    fit.addEventListener('submit', async e => {
      e.preventDefault();
      button.disabled = true;
      note.textContent = 'Reading the post…';
      const res = await post('/fit', { jd: fit.jd.value });
      button.disabled = false;
      if (!res.ok) { note.textContent = res.error; return; }
      note.textContent = '';
      render(res);
    });

    function render({ have, learning, notes }) {
      const total = have.length + learning.length;
      out.querySelector('.fit-sum').textContent = total
        ? `I’ve done ${have.length} of the ${total} things I could spot in this post.`
        : 'I couldn’t pick out specific skills. Try pasting the requirements part of the post.';

      const haveList = out.querySelector('.fit-have');
      haveList.replaceChildren(...have.map(h => {
        const li = el('li');
        li.append(el('strong', h.label), el('span', h.proof));
        const external = /^https?:/.test(h.href);
        li.append(el('a', 'See it', external ? { href: h.href, target: '_blank', rel: 'noopener' } : { href: h.href }));
        return li;
      }));

      const learnList = out.querySelector('.fit-learn');
      learnList.replaceChildren(...learning.map(l => el('li', l.label)));
      out.querySelector('.fit-learn-note').textContent = learning[0]?.note || '';
      out.querySelector('.fit-learn-col').hidden = !learning.length;
      out.querySelector('.fit-notes').replaceChildren(...notes.map(n => el('li', n)));

      out.hidden = false;
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
})();
