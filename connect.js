(() => {
  const LIVE = /(^|\.)r4myd\.com$/.test(location.hostname);
  const APIS = LIVE ? ['https://api.r4myd.com', 'https://r4myd-api.r4myd-api.workers.dev'] : ['http://127.0.0.1:8787'];
  const MAIL = 'shriyadav1500@gmail.com';

  // tries the main address first and falls back to the second if it can't be reached at all
  async function post(path, data) {
    for (const api of APIS) {
      try {
        const res = await fetch(api + path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        return await res.json();
      } catch {}
    }
    return { ok: false, error: `Couldn’t reach the server. Please mail me at ${MAIL}.` };
  }

  function el(tag, text, attrs = {}) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  // contact form (home page)
  const form = document.querySelector('.contact-form');
  if (form) {
    const note = form.querySelector('.form-note');
    const button = form.querySelector('button[type=submit]');
    const setKind = kind => {
      form.dataset.kind = kind;
      form.querySelector(`input[name=kind][value=${kind}]`).checked = true;
    };
    setKind(new URLSearchParams(location.search).get('kind') === 'hire' ? 'hire' : 'project');
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

  // chat / job post tabs (agent page)
  const tabs = [...document.querySelectorAll('.ask-tabs [role=tab]')];
  const showTab = tab => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    }
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => showTab(tab));
    tab.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      showTab(next);
      next.focus();
    });
  });

  // chat
  const chat = document.querySelector('.chat-form');
  if (chat) {
    const log = document.querySelector('.chat-log');
    const note = document.querySelector('.chat-note');
    const input = chat.q;
    const button = chat.querySelector('button');
    const history = [];

    const say = (role, text) => {
      const msg = el('p', text, { class: `msg ${role}` });
      log.append(msg);
      log.scrollTop = log.scrollHeight;
      return msg;
    };

    const ask = async text => {
      const q = text.trim();
      if (!q || button.disabled) return;
      note.textContent = '';
      say('user', q);
      history.push({ role: 'user', text: q });
      input.value = '';
      button.disabled = true;
      const typing = say('agent typing', 'Thinking…');
      const res = await post('/chat', { messages: history });
      typing.remove();
      button.disabled = false;
      if (!res.ok) {
        history.pop();
        note.textContent = res.error;
        return;
      }
      say('agent', res.reply);
      history.push({ role: 'agent', text: res.reply });
      if (res.booking) showBooking(res.booking);
      input.focus({ preventScroll: true });
    };

    const showBooking = b => {
      const card = el('div', null, { class: 'msg booked' });
      card.append(el('strong', '✓ Sent to Ram'));
      const rows = [['Name', b.name], ['Email', b.email], ['Company', b.company], ['Role', b.role], ['Times', b.times], ['Note', b.note]];
      for (const [k, v] of rows) if (v) card.append(el('span', `${k}: ${v}`));
      card.append(el('small', 'He’ll confirm the time by email.'));
      log.append(card);
      log.scrollTop = log.scrollHeight;
    };

    chat.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
    document.querySelectorAll('.chat-chips button').forEach(chip => chip.addEventListener('click', () => {
      chip.remove();
      ask(chip.textContent);
    }));
    if (location.hash === '#ask') setTimeout(() => input.focus({ preventScroll: true }), 500);
  }

  // fit check
  const fit = document.querySelector('.fit-form');
  if (fit) {
    const out = document.querySelector('.fit-out');
    const note = fit.querySelector('.form-note');
    const button = fit.querySelector('button[type=submit]');
    fit.addEventListener('input', () => { note.textContent = ''; });

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

    function render({ have, learning, notes, summary }) {
      const ai = out.querySelector('.fit-ai');
      ai.textContent = summary || '';
      ai.hidden = !summary;

      const total = have.length + learning.length;
      out.querySelector('.fit-sum').textContent = total
        ? `I’ve done ${have.length} of the ${total} things I could spot in this post.`
        : 'I couldn’t pick out specific skills. Try pasting the requirements part of the post.';

      out.querySelector('.fit-have').replaceChildren(...have.map(h => {
        const li = el('li');
        li.append(el('strong', h.label), el('span', h.proof));
        const external = /^https?:/.test(h.href);
        const href = h.href.startsWith('#') ? '/' + h.href : h.href;
        li.append(el('a', 'See it', external ? { href, target: '_blank', rel: 'noopener' } : { href }));
        return li;
      }));

      out.querySelector('.fit-learn').replaceChildren(...learning.map(l => el('li', l.label)));
      out.querySelector('.fit-learn-note').textContent = learning[0]?.note || '';
      out.querySelector('.fit-learn-col').hidden = !learning.length;
      out.querySelector('.fit-notes').replaceChildren(...notes.map(n => el('li', n)));

      out.hidden = false;
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
})();
