(() => {
  'use strict';
  const P = window.PROFILE;
  const ARTICLES = window.ARTICLES || [];
  const INTEL = 'https://www.securedintel.com';
  const $ = (id) => document.getElementById(id);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tiny DOM builder: el('a', {href}, 'text' | node | [nodes])
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const c of [].concat(children || [])) node.append(c);
    return node;
  }
  const ext = (attrs) => Object.assign({ target: '_blank', rel: 'noopener' }, attrs);
  const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  /* ---------- Static sections from profile data ---------- */
  $('hero-name').textContent = P.name;
  $('hero-location').textContent = P.location;
  $('hero-tagline').textContent = P.tagline;
  $('hero-photo').src = P.photo;
  $('hero-handle').textContent = P.handle;
  $('hero-cert').textContent = P.certifications.join(', ');
  $('year').textContent = new Date().getFullYear();
  P.about.forEach((t) => $('about-text').append(el('p', { text: t })));

  P.stats.forEach((s) => {
    const value = s.key === 'articles' && ARTICLES.length ? ARTICLES.length : s.value;
    const dt = el('dt', { 'data-count': value, 'data-suffix': s.suffix, text: value.toLocaleString('en-IN') + s.suffix });
    $('stats').append(el('div', {}, [dt, el('dd', { text: s.label })]));
  });

  P.expertise.forEach((x, i) => {
    $('expertise-grid').append(
      el('article', { class: 'card reveal', style: `--d:${(i % 3) * 0.08}s` }, [
        el('span', { class: 'num', text: String(i + 1).padStart(2, '0') }),
        el('h3', { text: x.title }),
        el('p', { text: x.text }),
        el('ul', { class: 'tags' }, x.skills.map((s) => el('li', { text: s }))),
      ])
    );
  });

  P.experience.forEach((x) => {
    const title = el('h3', {}, [x.role + ' ', el('span', { text: '· ' + x.org })]);
    $('timeline').append(
      el('li', { class: 'reveal' }, [
        el('div', { class: 'when' }, [el('b', { text: x.period }), x.place]),
        el('div', {}, [title, el('p', { text: x.text })]),
      ])
    );
  });

  P.ventures.forEach((v, i) => {
    $('ventures-grid').append(
      el('article', { class: 'card venture reveal', style: `--d:${(i % 2) * 0.08}s` }, [
        el('span', { class: 'kind', text: v.kind }),
        el('h3', { text: v.name }),
        el('p', { text: v.text }),
        el('a', ext({ href: v.url, text: v.cta })),
      ])
    );
  });

  P.programs.forEach((p, i) => {
    $('programs-grid').append(
      el('article', { class: 'card program reveal', style: `--d:${i * 0.08}s` }, [
        el('span', { class: 'format', text: p.format }),
        el('h3', { text: p.name }),
        el('p', { text: p.text }),
        el('ul', { class: 'tags' }, p.topics.map((t) => el('li', { text: t }))),
      ])
    );
  });

  const mail = $('contact-email');
  mail.href = 'mailto:' + P.contact.email;
  mail.textContent = P.contact.email;
  $('copy-email').addEventListener('click', async (e) => {
    try {
      await navigator.clipboard.writeText(P.contact.email);
      e.target.textContent = 'Copied ✓';
    } catch {
      e.target.textContent = P.contact.email;
    }
    setTimeout(() => (e.target.textContent = 'Copy email'), 1800);
  });
  P.contact.links.forEach((l) => {
    $('contact-links').append(el('li', {}, el('a', ext({ href: l.url }), [l.label, el('span', { text: l.handle })])));
  });

  /* ---------- Typed role rotator ---------- */
  (function typeRoles() {
    const out = $('typed');
    if (reduceMotion) { out.textContent = P.roles[0]; return; }
    let role = 0, pos = 0, deleting = false;
    (function tick() {
      const text = P.roles[role];
      pos += deleting ? -1 : 1;
      out.textContent = text.slice(0, pos);
      let wait = deleting ? 28 : 55;
      if (!deleting && pos === text.length) { deleting = true; wait = 1700; }
      else if (deleting && pos === 0) { deleting = false; role = (role + 1) % P.roles.length; wait = 350; }
      setTimeout(tick, wait);
    })();
  })();

  /* ---------- Theme, nav, scroll progress ---------- */
  $('theme-toggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch { /* storage unavailable */ }
  }

  const navLinks = $('nav-links');
  const menuBtn = $('menu-toggle');
  menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', navLinks.classList.toggle('open')));
  navLinks.addEventListener('click', () => { navLinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); });

  addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    $('progress').style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
    $('nav').classList.toggle('scrolled', scrollY > 8);
  }, { passive: true });

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.hash === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));

  /* ---------- Reveal on scroll + stat counters ---------- */
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((n) => reveal.observe(n));

  const counters = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      counters.unobserve(e.target);
      const end = +e.target.dataset.count, suffix = e.target.dataset.suffix;
      if (reduceMotion) return;
      const t0 = performance.now();
      (function step(now) {
        const k = Math.min(1, (now - t0) / 1400);
        const eased = 1 - Math.pow(1 - k, 3);
        e.target.textContent = Math.round(end * eased).toLocaleString('en-IN') + (k === 1 ? suffix : '');
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((n) => counters.observe(n));

  /* ---------- Intel feed: search, topic filter, paging ---------- */
  (function feed() {
    const PAGE = 6;
    const state = { tag: 'All', q: '', shown: PAGE };
    const grid = $('feed'), more = $('feed-more'), empty = $('feed-empty'), tagsBox = $('feed-tags');
    const thumb = (url) => url.replace('/upload/', '/upload/c_fill,w_640,h_360,f_auto,q_auto/');

    const counts = {};
    ARTICLES.forEach((a) => a.tags.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    const tags = ['All', ...Object.keys(counts).filter((t) => t !== 'News').sort((a, b) => counts[b] - counts[a])];
    tags.forEach((t) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(t === 'All') }, [t, el('span', { text: t === 'All' ? ARTICLES.length : counts[t] })]);
      b.addEventListener('click', () => {
        state.tag = t; state.shown = PAGE;
        tagsBox.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        render();
      });
      tagsBox.append(b);
    });

    $('feed-search').addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); state.shown = PAGE; render(); });
    more.addEventListener('click', () => { state.shown += PAGE; render(); });

    if (ARTICLES.length) {
      $('feed-meta').textContent = `${ARTICLES.length} articles · latest ${fmtDate(ARTICLES[0].date)}`;
    }

    function render() {
      const list = ARTICLES.filter((a) =>
        (state.tag === 'All' || a.tags.includes(state.tag)) &&
        (!state.q || (a.title + ' ' + a.excerpt).toLowerCase().includes(state.q))
      );
      grid.replaceChildren(...list.slice(0, state.shown).map((a, i) =>
        el('a', ext({ class: 'post', href: `${INTEL}/blog/${a.slug}`, style: `animation-delay:${(i % PAGE) * 0.04}s` }), [
          el('div', { class: 'thumb' }, a.image ? el('img', { src: thumb(a.image), alt: '', loading: 'lazy', width: 640, height: 360 }) : []),
          el('div', { class: 'body' }, [
            el('div', { class: 'meta' }, [el('span', { text: fmtDate(a.date) }), el('span', { text: `${a.minutes} min read` })]),
            el('h3', { text: a.title }),
            el('p', { text: a.excerpt }),
            el('ul', { class: 'tags' }, a.tags.map((t) => el('li', { text: t }))),
          ]),
        ])
      ));
      empty.hidden = list.length > 0;
      more.hidden = list.length <= state.shown;
      more.textContent = `Show more (${Math.max(0, list.length - state.shown)} left)`;
    }
    render();
  })();

  /* ---------- Interactive terminal ---------- */
  (function terminal() {
    const out = $('term-out'), input = $('term-in'), body = $('term-body');
    const history = []; let cursor = 0;
    const line = (content, cls) => { const d = el('div', cls ? { class: cls } : {}, content); out.append(d); return d; };
    const link = (url, text) => el('a', ext({ href: url, text: text || url }));

    const commands = {
      help: () => line('Commands: ' + Object.keys(commands).join('  ')),
      whoami: () => { line(`${P.name} — ${P.location}`); P.roles.forEach((r) => line('  · ' + r)); },
      skills: () => P.expertise.forEach((x) => line(`${x.title.padEnd(26)} ${x.skills.join(', ')}`)),
      experience: () => P.experience.forEach((x) => line(`${x.period.padEnd(20)} ${x.role} @ ${x.org}`)),
      ventures: () => P.ventures.forEach((v) => line([`${v.name.padEnd(22)} `, link(v.url, v.cta)])),
      certs: () => P.certifications.forEach((c) => line('  ✓ ' + c)),
      latest: () => ARTICLES.slice(0, 5).forEach((a) => line([`${a.date}  `, link(`${INTEL}/blog/${a.slug}`, a.title)])),
      contact: () => { line(['email     ', link('mailto:' + P.contact.email, P.contact.email)]); P.contact.links.slice(0, 2).forEach((l) => line([l.label.toLowerCase().padEnd(10), link(l.url, l.handle)])); },
      theme: () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; setTheme(t); line(`theme set to ${t}`); },
      clear: () => out.replaceChildren(),
    };

    function run(raw) {
      const cmd = raw.trim().toLowerCase();
      if (!cmd) return;
      line('$ ' + raw.trim(), 'cmd');
      (commands[cmd] || (() => line(`command not found: ${cmd} — try 'help'`, 'err')))();
      body.scrollTop = body.scrollHeight;
    }

    $('term-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value.trim()) { history.push(input.value); cursor = history.length; }
      run(input.value);
      input.value = '';
    });
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      cursor = Math.max(0, Math.min(history.length, cursor + (e.key === 'ArrowUp' ? -1 : 1)));
      input.value = history[cursor] || '';
    });
    body.addEventListener('click', (e) => { if (!e.target.closest('a') && !getSelection().toString()) input.focus({ preventScroll: true }); });
    ['whoami', 'skills', 'ventures', 'latest', 'contact'].forEach((c) => {
      const b = el('button', { type: 'button', text: c });
      b.addEventListener('click', () => run(c));
      $('term-chips').append(b);
    });

    line("Welcome. Type 'help' or tap a command below.");
    run('whoami');
  })();

  /* ---------- Hero network canvas ---------- */
  (function network() {
    const canvas = $('net'), ctx = canvas.getContext('2d');
    if (reduceMotion || !ctx) return;
    let w, h, nodes = [], raf, visible = true;
    const mouse = { x: -999, y: -999 };

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(70, Math.round((w * h) / 18000));
      nodes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 }));
    }
    function frame() {
      const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ctx.strokeStyle = color;
      for (const p of nodes) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 130) continue;
          const near = Math.hypot((a.x + b.x) / 2 - mouse.x, (a.y + b.y) / 2 - mouse.y) < 160;
          ctx.globalAlpha = (1 - d / 130) * (near ? 0.6 : 0.16);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (visible) raf = requestAnimationFrame(frame);
    }
    addEventListener('resize', resize);
    canvas.parentElement.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    }).observe(canvas);
    resize();
  })();
})();
