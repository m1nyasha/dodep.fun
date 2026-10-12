(() => {
  'use strict';

  /* ───────── helpers ───────── */
  const page = document.body.dataset.page || 'game';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nf = new Intl.NumberFormat('ru-RU');
  const fmt = n => nf.format(Math.round(Number(n) || 0));
  const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; };
  const cells = n => `${n} ${plural(n, 'клетка', 'клетки', 'клеток')}`;
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const coin = '<i class="c" aria-hidden="true"></i>';
  const ago = d => {
    const s = (Date.now() - new Date(d)) / 1000;
    if (s < 60) return 'только что';
    if (s < 3600) return `${Math.floor(s / 60)} мин назад`;
    if (s < 86400) return `${Math.floor(s / 3600)} ч назад`;
    return new Date(d).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'});
  };
  const stamp = d => new Date(d).toLocaleString('ru-RU', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});

  const svg = body => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  const I = {
    sound: svg('<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
    mute: svg('<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    dice: svg('<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    down: svg('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
    chev: svg('<path d="M7 10l5 5 5-5"/>'),
    eye: svg('<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'),
    eyeOff: svg('<path d="M4 4l16 16M10 6a10 10 0 0 1 2-.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.5 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.2-1"/>'),
    search: svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
    grid: svg('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'),
    trophy: svg('<path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7"/>'),
    book: svg('<path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18v13H6.5A1.5 1.5 0 0 0 5 18.5v-13zM5 18.5A1.5 1.5 0 0 0 6.5 20H18"/>'),
    list: svg('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
    mine: svg('<circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.6 5.6l2.5 2.5M15.9 15.9l2.5 2.5M5.6 18.4l2.5-2.5M15.9 8.1l2.5-2.5"/>'),
  };
  const LOGO = `<svg viewBox="0 0 14 14" aria-hidden="true">${[0, 1, 2].flatMap(y => [0, 1, 2].map(x => `<rect x="${x * 5}" y="${y * 5}" width="4" height="4" rx="1"${x === 2 && y === 0 ? ' class="hot"' : ''}/>`)).join('')}</svg>`;

  /* ───────── state ───────── */
  const KEY = 'dodep_prototype_v1';
  const initial = {nickname: '', loggedOut: false, balance: 10000, lastBet: 100, rounds: [], dailyDate: '', sound: true, status: '', adminBlocked: [], hiddenStatuses: [], adminActions: [], gameVersion: '1.0'};
  let state;
  try { state = {...initial, ...JSON.parse(localStorage.getItem(KEY) || '{}')}; } catch { state = {...initial}; }
  state.adminActions ||= [];
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const authed = () => Boolean(state.nickname && !state.loggedOut);
  const isBlocked = n => state.adminBlocked.includes(n);
  const myNet = () => sum(state.rounds, r => r.net);

  /* ───────── game math ───────── */
  const CELLS = 25, MINES = 5, SAFE = 20, RTP = 0.973, MIN_BET = 100, STEP = 100, START = 10000;
  const pSafe = k => { let p = 1; for (let i = 0; i < k; i++) p *= (SAFE - i) / (CELLS - i); return p; };
  const mult = k => (k ? RTP / pSafe(k) : 1);
  const fx = x => (x < 100 ? x.toFixed(2) : x < 1000 ? x.toFixed(1) : fmt(x)).replace('.', ',') + '×';
  const pct = p => { const v = p * 100; const s = v >= 10 ? String(Math.round(v * 10) / 10) : v >= 1 ? v.toFixed(1) : v.toPrecision(2); return s.replace('.', ',') + '%'; };

  /* ───────── daily coins (МСК = UTC+3) ───────── */
  const msk = () => { const d = new Date(Date.now() + 3 * 3600e3); return {d, day: d.toISOString().slice(0, 10), hour: d.getUTCHours()}; };
  const mosDay = () => msk().day;
  const canDaily = () => authed() && !isBlocked(state.nickname) && state.balance < START && state.dailyDate !== mosDay() && msk().hour >= 12;
  const nextDailyIn = () => {
    const {d, day, hour} = msk(), t = new Date(d);
    t.setUTCHours(12, 0, 0, 0);
    if (hour >= 12 || state.dailyDate === day) t.setUTCDate(t.getUTCDate() + 1);
    return t - d;
  };
  const dur = ms => { const m = Math.ceil(ms / 60000), h = Math.floor(m / 60); return h ? `${h} ч ${m % 60} мин` : `${m} мин`; };
  const dailyText = () => {
    if (!authed()) return 'После входа — до 10 000 монет каждый день в 12:00 МСК.';
    if (state.balance >= START) return 'Откроется, когда баланс опустится ниже 10 000.';
    if (canDaily()) return `Можно добрать ${fmt(START - state.balance)} монет.`;
    return `Следующая выдача через ${dur(nextDailyIn())}.`;
  };

  /* ───────── demo players ───────── */
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  const HUMANS = [
    ['northstar', 46400, 36400, 248, 'Сначала думай, потом жми.'],
    ['no_signal', 31800, 21800, 311, 'Выход — тоже ход.'],
    ['kletka17', 24650, 14650, 189, 'Держу дистанцию.'],
    ['mono', 17900, 7900, 203, 'Сегодня без лишних кликов.'],
    ['sasha_t', 15200, 5200, 97, 'Третья клетка — моя.'],
    ['felix', 14300, 4300, 151, 'Одна клетка за раз.'],
    ['signal404', 12700, 2700, 80, ''],
    ['vera_k', 10000, -6400, 122, ''],
    ['pixelpanda', 10000, -21800, 340, ''],
    ['tormoz', 9800, -26200, 410, ''],
    ['babka_ezhka', 8700, -12300, 175, ''],
    ['lena_m', 6100, -3900, 37, ''],
    ['zhenya', 2300, -31700, 290, ''],
    ['qwerty', 400, -9600, 66, ''],
  ].map(([name, balance, net, rounds, status]) => ({name, balance, net, rounds, status, kind: 'human'}));

  const AI_TYPES = [
    {name: 'Осторожный', note: 'Забирает после первой-второй клетки.', mu: 9400, sd: 900, bust: 0, depth: [1, 2]},
    {name: 'Рисковый', note: 'Идёт глубоко ради крупного множителя.', mu: 9000, sd: 9000, bust: .3, depth: [5, 10]},
    {name: 'Фиксированный', note: 'Одна и та же ставка, одна и та же глубина.', mu: 9600, sd: 1500, bust: 0, depth: [3, 3]},
    {name: 'Догоняющий', note: 'Удваивает ставку после проигрыша.', mu: 8000, sd: 7000, bust: .35, depth: [2, 4]},
    {name: 'Дисциплинированный', note: 'Заранее ставит лимит и уходит по нему.', mu: 9800, sd: 1200, bust: 0, depth: [2, 3]},
    {name: 'Искатель узоров', note: 'Ищет закономерности в раскладке.', mu: 8700, sd: 3000, bust: .1, depth: [2, 6]},
    {name: 'Терпеливый', note: 'Маленькие ставки, длинная дистанция.', mu: 9900, sd: 700, bust: 0, depth: [1, 3]},
    {name: 'Импульсивный', note: 'Ставит большую долю баланса.', mu: 7500, sd: 8000, bust: .3, depth: [1, 6]},
    {name: 'Статистик', note: 'Считает шанс перед каждым ходом.', mu: 9500, sd: 1600, bust: 0, depth: [2, 4]},
    {name: 'Суеверный', note: 'Открывает «счастливые» клетки.', mu: 9000, sd: 3500, bust: .15, depth: [1, 5]},
  ];
  const AGENTS = (() => {
    const r = rng(73), out = [];
    AI_TYPES.forEach(type => {
      for (let i = 1; i <= 10; i++) {
        const bust = r() < type.bust, g = (r() + r() + r() - 1.5) * 2;
        const balance = bust ? Math.floor(r() * 10) * 10 : Math.max(200, Math.round((type.mu + g * type.sd) / 100) * 100);
        const rounds = bust ? 12 + Math.floor(r() * 35) : type.name === 'Дисциплинированный' ? 18 + Math.floor(r() * 30) : 50;
        out.push({name: `${type.name} #${String(i).padStart(2, '0')}`, kind: 'ai', type, balance, net: balance - START, rounds, status: ''});
      }
    });
    return out;
  })();

  function ranked() {
    const list = [...HUMANS, ...AGENTS];
    if (authed()) list.push({name: state.nickname, kind: 'me', balance: state.balance, net: myNet(), rounds: state.rounds.length, status: state.status});
    const out = list.filter(p => !isBlocked(p.name)).sort((a, b) => b.balance - a.balance);
    let h = 0;
    out.forEach((p, i) => { p.rank = i + 1; p.humanRank = p.kind === 'ai' ? 0 : ++h; });
    return out;
  }
  const statusOf = p => (p.kind !== 'ai' && p.humanRank <= 5 && !state.hiddenStatuses.includes(p.name) ? p.status : '');
  const betsOf = p => (p.kind === 'me' ? sum(state.rounds, r => r.bet) : p.rounds * (200 + hash(p.name) % 6 * 100) + Math.max(0, -p.net));

  function avatar(name, kind = 'human', size = 36) {
    const h = hash(name);
    let rects = '';
    for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) {
      if (!(h >> (y * 3 + x) & 1)) continue;
      rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      if (x < 2) rects += `<rect x="${4 - x}" y="${y}" width="1" height="1"/>`;
    }
    return `<span class="ava ava-${kind}" style="--s:${size}px"><svg viewBox="-.5 -.5 6 6" aria-hidden="true">${rects}</svg></span>`;
  }

  /* ───────── sound & motion ───────── */
  let actx;
  function sfx(kind, step = 0) {
    if (!state.sound) return;
    try {
      actx ||= new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime, up = Math.pow(2, step / 12);
      const seq = {
        tap: [[660, 0, .05]],
        start: [[392, 0, .08], [523, .07, .12]],
        safe: [[523 * up, 0, .1], [784 * up, .05, .14]],
        lose: [[190, 0, .25, 'sawtooth'], [95, .08, .45, 'sawtooth']],
        win: [[523, 0, .12], [659, .08, .12], [784, .16, .14], [1047, .26, .32]],
        coin: [[1568, 0, .04], [2093, .03, .07]],
      }[kind] || [[660, 0, .05]];
      seq.forEach(([f, d, len, type = 'triangle']) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t + d);
        g.gain.setValueAtTime(.0001, t + d);
        g.gain.exponentialRampToValueAtTime(kind === 'lose' ? .045 : kind === 'coin' ? .03 : .08, t + d + .01);
        g.gain.exponentialRampToValueAtTime(.0001, t + d + len);
        o.connect(g).connect(actx.destination); o.start(t + d); o.stop(t + d + len + .02);
      });
    } catch {}
  }

  function tween(el, to, {dur = 600, format = fmt, from} = {}) {
    if (!el) return;
    const start = from ?? Number(el.dataset.v ?? to);
    el.dataset.v = to;
    cancelAnimationFrame(el._raf);
    if (reduce || start === to) { el.textContent = format(to); return; }
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = format(start + (to - start) * e);
      if (p < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }
  const replay = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const nudge = el => replay(el, 'nudge');

  function burst(el, n = 7) {
    if (reduce || !el) return;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'particle';
      document.body.append(p);
      const a = Math.PI * 2 * i / n + Math.random() * .6, d = Math.max(30, r.width) * (.55 + Math.random() * .5);
      p.animate([
        {transform: `translate(${cx}px,${cy}px) rotate(0) scale(1)`, opacity: 1},
        {transform: `translate(${cx + Math.cos(a) * d}px,${cy + Math.sin(a) * d}px) rotate(${Math.random() * 220}deg) scale(.2)`, opacity: 0},
      ], {duration: 520 + Math.random() * 220, easing: 'cubic-bezier(.2,.7,.3,1)'}).finished.then(() => p.remove());
    }
  }

  function flyCoins(from, n) {
    const to = $('#wallet');
    if (reduce || !from || !to) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const tx = b.left + 22, ty = b.top + b.height / 2;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.className = 'c fly';
      document.body.append(c);
      const sx = a.left + a.width / 2 + (Math.random() - .5) * a.width * .7, sy = a.top + a.height / 2 + (Math.random() - .5) * 20;
      const mx = (sx + tx) / 2 + (Math.random() - .5) * 260, my = Math.min(sy, ty) - 60 - Math.random() * 140;
      c.animate([
        {transform: `translate(${sx}px,${sy}px) scale(.3)`, opacity: 0},
        {transform: `translate(${sx}px,${sy - 26}px) scale(1.15)`, opacity: 1, offset: .14},
        {transform: `translate(${mx}px,${my}px) scale(1)`, offset: .55},
        {transform: `translate(${tx}px,${ty}px) scale(.55)`, opacity: 1},
      ], {duration: 720 + Math.random() * 260, delay: i * 42, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both'})
        .finished.then(() => { c.remove(); if (i % 3 === 0) sfx('coin'); });
    }
  }

  function revealOnScroll(root = document) {
    const els = $$('[data-reveal]', root);
    const show = el => { el.classList.add('in'); $$('[data-count]', el).forEach(countUp); };
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(show); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), {threshold: .15});
    els.forEach(el => io.observe(el));
  }
  function countUp(el) {
    const to = Number(el.dataset.count), kind = el.dataset.fmt;
    const format = kind === 'pct' ? v => v.toFixed(1).replace('.', ',') + '%' : kind === 'signed' ? v => signed(v) : fmt;
    tween(el, to, {from: 0, dur: 1000, format});
  }

  function segSync(seg) {
    const on = $('button.on', seg), th = $('.seg-thumb', seg);
    if (!on || !th) return;
    th.style.width = `${on.offsetWidth}px`;
    th.style.transform = `translateX(${on.offsetLeft - 3}px)`;
  }

  /* ───────── shell ───────── */
  const NAV = [
    {id: 'game', href: 'index.html', label: 'Игра', icon: 'grid'},
    {id: 'stats', href: 'stats.html', label: 'Рейтинг', icon: 'trophy'},
    {id: 'rules', href: 'rules.html', label: 'Правила', icon: 'book'},
    {id: 'journal', href: 'journal.html', label: 'Журнал', icon: 'list'},
  ];

  function shell(main) {
    $('#app').innerHTML = `
      <header class="top" id="top"></header>
      <main class="page page-${page}">${main}</main>
      <footer class="foot">
        <span>dodep.fun — игра на виртуальные монеты. Без покупки, депозита и вывода.</span>
        <span class="foot-links"><a href="rules.html">Правила</a><a href="journal.html">Проверка раундов</a><a href="admin.html">Автор</a></span>
      </footer>
      <div class="toasts" id="toasts" aria-live="polite"></div>`;
    renderTop();
    revealOnScroll();
  }

  function renderTop() {
    $('#top').innerHTML = `
      <a class="logo" href="index.html" aria-label="dodep.fun — к игре"><span class="logo-mark">${LOGO}</span><span>dodep<em>.fun</em></span></a>
      <nav class="nav" id="nav">${NAV.map(n => `<a href="${n.href}" class="${page === n.id ? 'on' : ''}">${I[n.icon]}<span>${n.label}</span></a>`).join('')}<i class="nav-pill"></i></nav>
      <div class="top-right">
        <button class="icon-btn" id="sound" aria-label="Звук" aria-pressed="${state.sound}" title="Звук">${state.sound ? I.sound : I.mute}</button>
        <div class="wallet-wrap">
          <button class="wallet" id="wallet" aria-haspopup="dialog" aria-expanded="false" title="Баланс">${coin}<span id="wallet-amount" data-v="${state.balance}">${fmt(state.balance)}</span><i class="wallet-dot"${canDaily() ? '' : ' hidden'}></i></button>
          <div class="wallet-pop" id="wallet-pop" role="dialog" aria-label="Баланс" hidden></div>
        </div>
        ${authed()
          ? `<a class="me" href="profile.html" title="Профиль">${avatar(state.nickname, 'me', 32)}<span>${esc(state.nickname)}</span></a>`
          : `<a class="btn btn-ink sm" href="auth.html">Войти</a>`}
      </div>`;

    $('#sound').onclick = () => {
      state.sound = !state.sound; save();
      $('#sound').innerHTML = state.sound ? I.sound : I.mute;
      $('#sound').setAttribute('aria-pressed', state.sound);
      sfx('tap');
    };
    $('#wallet').onclick = () => toggleWallet();

    const nav = $('#nav'), pill = $('.nav-pill', nav);
    const place = a => {
      if (!a) { pill.style.opacity = 0; return; }
      pill.style.opacity = 1;
      pill.style.width = `${a.offsetWidth}px`;
      pill.style.transform = `translateX(${a.offsetLeft - 4}px)`;
    };
    place($('a.on', nav));
    requestAnimationFrame(() => nav.classList.add('ready'));
    $$('a', nav).forEach(a => a.addEventListener('mouseenter', () => place(a)));
    nav.addEventListener('mouseleave', () => place($('a.on', nav)));
  }

  function renderWalletPop() {
    const pop = $('#wallet-pop'), can = canDaily(), net = myNet();
    pop.innerHTML = `
      <div class="wp-row"><span>Баланс</span><b class="mono">${fmt(state.balance)}</b></div>
      ${authed() ? `<div class="wp-row"><span>Итог ставок</span><b class="mono ${net >= 0 ? 'pos' : 'neg'}">${signed(net)}</b></div>` : ''}
      <div class="wp-daily${can ? ' ready' : ''}">
        <div><b>Ежедневно до 10 000</b><span>${dailyText()}</span></div>
        ${can ? '<button class="btn btn-coin sm" id="daily">Забрать</button>' : ''}
      </div>
      <p class="wp-note">Монеты виртуальные: их нельзя купить или вывести.</p>`;
    $('#daily', pop)?.addEventListener('click', e => claimDaily(e.currentTarget));
  }
  function toggleWallet(force) {
    const pop = $('#wallet-pop'), open = force ?? pop.hidden;
    if (open) renderWalletPop();
    pop.hidden = !open;
    $('#wallet').setAttribute('aria-expanded', open);
  }
  document.addEventListener('click', e => { if (!e.target.closest('.wallet-wrap') && $('#wallet-pop') && !$('#wallet-pop').hidden) toggleWallet(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#wallet-pop') && !$('#wallet-pop').hidden) toggleWallet(false); });

  function claimDaily(btn) {
    if (!canDaily()) return;
    const add = START - state.balance;
    state.balance = START; state.dailyDate = mosDay(); save();
    burst(btn, 10); sfx('win');
    refreshWallet(0, add);
    renderWalletPop();
    toast('Баланс пополнен', `+${fmt(add)} монет — снова 10 000.`, 'good');
    dispatchEvent(new Event('dodep:balance'));
  }

  function refreshWallet(delay = 0, delta = 0) {
    setTimeout(() => {
      const w = $('#wallet');
      if (!w) return;
      tween($('#wallet-amount'), state.balance, {dur: 700});
      replay(w, 'bump');
      $('.wallet-dot', w).hidden = !canDaily();
      if (delta && !reduce) {
        const d = document.createElement('span');
        d.className = `wallet-delta ${delta > 0 ? 'pos' : 'neg'}`;
        d.textContent = signed(delta);
        w.parentElement.append(d);
        setTimeout(() => d.remove(), 1200);
      }
    }, reduce ? 0 : delay);
  }

  function toast(title, detail = '', tone = '') {
    const box = $('#toasts');
    if (!box) return;
    const t = document.createElement('div');
    t.className = `toast ${tone}`;
    t.innerHTML = `<b>${esc(title)}</b>${detail ? `<span>${esc(detail)}</span>` : ''}`;
    box.append(t);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, 3400);
  }

  function modal(html) {
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}</div>`;
    document.body.append(wrap);
    requestAnimationFrame(() => wrap.classList.add('open'));
    const onKey = e => { if (e.key === 'Escape') close(); };
    const close = () => {
      wrap.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => wrap.remove(), 220);
    };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
    $$('[data-close]', wrap).forEach(b => b.onclick = close);
    return {el: wrap, close};
  }

  /* ───────── crypto ───────── */
  const randInt = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const randHex = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
  const sha256 = async s => {
    if (!crypto.subtle) return '';
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  };
  const layoutString = (mines, salt) => `${mines.join(',')}:${salt}`;

  function miniBoard({mines = [], picks = [], hit = -1, lit = []} = {}) {
    return `<div class="mini" aria-hidden="true">${Array.from({length: CELLS}, (_, i) => {
      const cls = i === hit ? 'm hit' : mines.includes(i) ? 'm' : picks.includes(i) || lit.includes(i) ? 's' : '';
      return `<i class="${cls}"></i>`;
    }).join('')}</div>`;
  }

  /* ───────── auth form (page + modal) ───────── */
  function authForm(mode) {
    return `<form class="auth-form" id="auth-form" data-mode="${mode}" novalidate>
      <div class="seg seg-wide"><button type="button" data-mode="login">Вход</button><button type="button" data-mode="register">Регистрация</button><i class="seg-thumb"></i></div>
      <h1></h1>
      <p class="form-sub reg-only">10 000 монет на старте. Email не нужен.</p>
      <label class="field"><span>Никнейм</span><input name="nickname" maxlength="20" autocomplete="username" placeholder="например, kletka17" spellcheck="false"><em class="field-msg"></em></label>
      <label class="field"><span>Пароль</span>
        <div class="pw"><input name="password" type="password" placeholder="не меньше 8 символов"><button type="button" class="pw-eye" aria-label="Показать пароль">${I.eye}</button></div>
        <div class="meter reg-only" data-s="0"><i></i><i></i><i></i><i></i></div>
        <em class="field-msg"></em>
      </label>
      <label class="check reg-only"><input type="checkbox" name="agree"><span>Понимаю: восстановить пароль нельзя — без него доступ к аккаунту пропадёт.</span></label>
      <button class="btn btn-ink wide submit" type="submit"></button>
    </form>`;
  }

  function bindAuth(form, done) {
    const seg = $('.seg', form);
    const setMode = m => {
      form.dataset.mode = m;
      $$('button', seg).forEach(b => b.classList.toggle('on', b.dataset.mode === m));
      $('h1', form).textContent = m === 'register' ? 'Новый игрок' : 'С возвращением';
      $('.submit', form).textContent = m === 'register' ? 'Создать аккаунт' : 'Войти';
      form.password.autocomplete = m === 'register' ? 'new-password' : 'current-password';
      $$('.field,.check', form).forEach(f => f.classList.remove('err'));
      $$('.field-msg', form).forEach(f => f.textContent = '');
      if (page === 'auth') history.replaceState(null, '', m === 'register' ? '?mode=register' : location.pathname);
      segSync(seg);
    };
    $$('button', seg).forEach(b => b.onclick = () => { setMode(b.dataset.mode); sfx('tap'); });
    setMode(form.dataset.mode);
    requestAnimationFrame(() => { segSync(seg); seg.classList.add('ready'); });

    const eye = $('.pw-eye', form);
    eye.onclick = () => {
      const show = form.password.type === 'password';
      form.password.type = show ? 'text' : 'password';
      eye.innerHTML = show ? I.eyeOff : I.eye;
      eye.classList.toggle('on', show);
    };
    form.password.addEventListener('input', () => {
      const v = form.password.value;
      const s = (v.length >= 8) + (v.length >= 12) + (/[a-zа-яё]/.test(v) && /[A-ZА-ЯЁ]/.test(v)) + (/\d/.test(v) && /[^\p{L}\p{N}]/u.test(v));
      $('.meter', form).dataset.s = v ? Math.max(1, s) : 0;
    });

    const err = (input, msg) => {
      const f = input.closest('.field,.check');
      f.classList.toggle('err', !!msg);
      const m = $('.field-msg', f);
      if (m) m.textContent = msg || '';
      if (msg) nudge(f);
      return !!msg;
    };
    const taken = n => [...HUMANS, ...AGENTS].some(p => p.name.toLowerCase() === n.toLowerCase());
    form.nickname.addEventListener('input', () => err(form.nickname, ''));
    form.password.addEventListener('input', () => err(form.password, ''));
    form.agree.addEventListener('change', () => err(form.agree, ''));

    form.onsubmit = e => {
      e.preventDefault();
      const register = form.dataset.mode === 'register';
      const nick = form.nickname.value.trim(), pass = form.password.value;
      let bad = false;
      if (!/^[\p{L}\p{N}_]{3,20}$/u.test(nick)) bad = err(form.nickname, '3–20 символов: буквы, цифры или _');
      else if (register && taken(nick)) bad = err(form.nickname, 'Этот ник уже занят');
      else if (isBlocked(nick)) bad = err(form.nickname, 'Аккаунт заблокирован автором');
      if (pass.length < 8) bad = err(form.password, 'Нужно минимум 8 символов') || bad;
      if (register && !form.agree.checked) bad = err(form.agree, 'x') || bad;
      if (bad) { sfx('lose'); return; }

      const fresh = register || state.nickname !== nick;
      if (fresh) state = {...initial, sound: state.sound, adminBlocked: state.adminBlocked, hiddenStatuses: state.hiddenStatuses, adminActions: state.adminActions, nickname: nick, dailyDate: mosDay()};
      else state.loggedOut = false;
      save(); sfx('win');
      toast(fresh ? 'Аккаунт создан' : 'С возвращением', fresh ? `${nick}, на балансе 10 000 монет.` : `Баланс: ${fmt(state.balance)} монет.`, 'good');
      done();
    };
  }

  function askAuth() {
    const m = modal(authForm('register'));
    bindAuth($('#auth-form', m.el), () => {
      m.close();
      renderTop();
      dispatchEvent(new Event('dodep:balance'));
    });
    setTimeout(() => $('#auth-form', m.el)?.nickname.focus(), 60);
  }

  /* ═════════ GAME ═════════ */
  let round = null, last = null, busy = false;

  function gamePage() {
    const chips = [['100', 100], ['500', 500], ['1к', 1000], ['/2', 'half'], ['×2', 'double'], ['Макс', 'max']];
    shell(`
      <section class="console" id="console">
        <div class="ladder" id="ladder">${Array.from({length: SAFE}, (_, i) => `<div class="rung" data-k="${i + 1}" title="${cells(i + 1)} подряд: шанс ${pct(pSafe(i + 1))}"><b>${fx(mult(i + 1))}</b><small>${pct(pSafe(i + 1))}</small></div>`).join('')}</div>
        <div class="arena">
          <div class="board" id="board">${Array.from({length: CELLS}, (_, i) => `<button class="tile" data-i="${i}" style="--r:${Math.floor(i / 5)};--c:${i % 5}" aria-label="Клетка ${i + 1}"></button>`).join('')}</div>
          <div class="stamp-slot" id="stamp"></div>
        </div>
        <div class="readout">
          <div><span>Открыто</span><b class="mono" id="ro-open">0/20</b></div>
          <div><span>Множитель</span><b class="mono" id="ro-mult">—</b></div>
          <div><span>Шанс следующей</span><b class="mono" id="ro-chance">80%</b></div>
        </div>
        <div class="controls">
          <div class="bet" id="bet">
            <div class="bet-field">
              <button type="button" data-d="-1" aria-label="Уменьшить ставку">−</button>
              <label>${coin}<input id="bet-input" inputmode="numeric" autocomplete="off" aria-label="Ставка" value="${fmt(Math.min(state.lastBet || MIN_BET, maxBet()))}"></label>
              <button type="button" data-d="1" aria-label="Увеличить ставку">+</button>
            </div>
            <div class="bet-chips">${chips.map(([l, v]) => `<button type="button" data-bet="${v}">${l}</button>`).join('')}</div>
          </div>
          <button class="dice" id="dice" title="Случайная клетка · R" aria-label="Открыть случайную клетку" hidden>${I.dice}</button>
          <button class="cta" id="cta"><span class="cta-label">Играть</span><span class="cta-sub"><span class="mono" id="cta-amt"></span>${coin}</span><kbd>Space</kbd></button>
        </div>
        <div class="seal" id="seal"></div>
      </section>
      <aside class="side">
        <section class="panel">
          <header class="panel-head"><h2>Мои раунды</h2><b class="mono" id="session-net"></b></header>
          <ol class="hist" id="hist"></ol>
          <a class="more" href="journal.html">Весь журнал</a>
        </section>
        <section class="panel">
          <header class="panel-head"><h2><i class="live-dot"></i>За столом</h2><span class="tag">демо</span></header>
          <ol class="feed" id="feed"></ol>
        </section>
      </aside>`);

    const board = $('#board');
    board.addEventListener('click', e => { const t = e.target.closest('.tile'); if (t) openCell(t); });
    // mouse clicks shouldn't steal focus — Space stays the primary action
    $('#console').addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });

    $$('#bet [data-d]').forEach(b => b.onclick = () => setBet(readBet() + STEP * b.dataset.d));
    $$('#bet [data-bet]').forEach(b => b.onclick = () => {
      const v = b.dataset.bet, cur = readBet();
      setBet(v === 'half' ? cur / 2 : v === 'double' ? cur * 2 : v === 'max' ? maxBet() : Number(v));
    });
    const input = $('#bet-input');
    input.addEventListener('input', () => { input.value = input.value.replace(/[^\d\s]/g, ''); syncUI(); });
    input.addEventListener('blur', () => setBet(readBet(), true));
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); setBet(readBet() + (e.key === 'ArrowUp' ? STEP : -STEP)); }
      if (e.key === 'Enter') input.blur();
    });
    input.addEventListener('wheel', e => { if (document.activeElement !== input) return; e.preventDefault(); setBet(readBet() + (e.deltaY < 0 ? STEP : -STEP)); }, {passive: false});

    $('#cta').onclick = () => (round ? cashOut() : startRound());
    $('#dice').onclick = randomTile;
    document.addEventListener('keydown', e => {
      if (e.target.closest('input,textarea,a') || e.metaKey || e.ctrlKey || e.altKey || $('.modal')) return;
      if (e.code === 'Space') {
        if (e.target.closest('button') && e.target.id !== 'cta') return; // let focused buttons behave natively
        e.preventDefault();
        if (!e.repeat) round ? cashOut() : startRound();
      } else if (e.code === 'KeyR' && round) randomTile();
    });
    addEventListener('dodep:balance', () => { setBet(readBet(), true); syncUI(); });

    renderHist();
    startFeed();
    syncUI();
  }

  const maxBet = () => Math.max(MIN_BET, Math.floor(state.balance / STEP) * STEP);
  const readBet = () => Number(String($('#bet-input')?.value || '').replace(/\D/g, '')) || 0;
  function setBet(v, silent) {
    v = Math.min(maxBet(), Math.max(MIN_BET, Math.round(v / STEP) * STEP));
    const input = $('#bet-input');
    if (readBet() !== v || input.value !== fmt(v)) {
      input.value = fmt(v);
      if (!silent) { replay(input, 'tick'); sfx('tap'); }
    }
    state.lastBet = v; save();
    syncUI();
  }

  function syncUI() {
    if (page !== 'game') return;
    const live = !!round, k = live ? round.opened.length : 0, shownK = live ? k : last?.k || 0;
    const broke = !live && authed() && state.balance < MIN_BET;
    const con = $('#console'), cta = $('#cta');
    con.classList.toggle('live', live);
    $('#bet').classList.toggle('locked', live);
    $$('#bet button, #bet input').forEach(b => b.disabled = live);
    $('#dice').hidden = !live;

    cta.classList.toggle('is-wait', live && !k || broke);
    cta.classList.toggle('is-cash', live && k > 0);
    cta.disabled = live && !k || broke;
    $('.cta-label', cta).textContent = broke ? 'Нет монет' : !live ? 'Играть' : k ? 'Забрать' : 'Открой клетку';
    tween($('#cta-amt'), broke ? 0 : !live ? readBet() : k ? Math.round(round.bet * mult(k)) : round.bet, {dur: 450});

    $$('#bet [data-bet]').forEach(b => b.classList.toggle('on', Number(b.dataset.bet) === readBet()));
    $('#ro-open').textContent = `${shownK}/${SAFE}`;
    const ro = $('#ro-mult');
    if (live && k) tween(ro, mult(k), {format: fx, dur: 450});
    else { ro.dataset.v = 1; ro.textContent = live ? '1,00×' : last && !last.lost ? fx(mult(last.k)) : '—'; }
    $('#ro-chance').textContent = pct(live ? (SAFE - k) / (CELLS - k) : SAFE / CELLS);
    $('#board').style.setProperty('--next', `"${fx(mult(k + 1))}"`);

    $$('.rung').forEach(r => {
      const n = Number(r.dataset.k);
      r.classList.toggle('done', n <= shownK);
      r.classList.toggle('next', live && n === k + 1);
      r.classList.toggle('boom', Boolean(!live && last?.lost && n === last.k + 1));
    });
    const ladder = $('#ladder'), target = $(`.rung[data-k="${Math.min(SAFE, shownK + 1)}"]`);
    ladder.scrollTo({left: target.offsetLeft - ladder.clientWidth / 2 + target.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth'});
    syncSeal();
  }

  function syncSeal() {
    const s = $('#seal');
    if (round) s.innerHTML = `${I.lock}<span>Раскладка зафиксирована${round.hash ? ` · <span class="mono" title="SHA-256 раскладки">${round.hash.slice(0, 12)}</span>` : ''}</span>`;
    else if (authed() && state.balance < MIN_BET) s.innerHTML = `<span>${esc(dailyText())}</span>${canDaily() ? ' <button class="link" id="seal-daily">Забрать</button>' : ''}`;
    else if (last) s.innerHTML = `${I.check}<span>Раунд записан · <a href="journal.html#${last.id}">сверить раскладку</a></span>`;
    else s.innerHTML = `${I.lock}<span>Мины расставляются до первого хода и не двигаются</span>`;
    $('#seal-daily')?.addEventListener('click', e => { e.stopPropagation(); toggleWallet(true); });
  }

  function startRound() {
    if (round || busy) return;
    if (!authed()) return askAuth();
    if (isBlocked(state.nickname)) return toast('Аккаунт заблокирован', 'Новые ставки недоступны.', 'bad');
    if (state.balance < MIN_BET) { nudge($('#cta')); return toast('Монеты закончились', dailyText(), 'bad'); }
    const bet = readBet();
    if (bet < MIN_BET || bet > state.balance || bet % STEP) { setBet(bet); nudge($('#bet')); return; }

    const order = [...Array(CELLS).keys()];
    for (let i = CELLS - 1; i > 0; i--) { const j = randInt(i + 1); [order[i], order[j]] = [order[j], order[i]]; }
    const mines = order.slice(0, MINES).sort((a, b) => a - b), salt = randHex(8);
    round = {id: `DDF-${Date.now().toString(36).toUpperCase()}`, bet, mines: new Set(mines), mineList: mines, salt, hash: '', opened: []};
    const r = round;
    r.hashP = sha256(layoutString(mines, salt)).then(h => { r.hash = h; if (round === r) syncSeal(); return h; });

    state.balance -= bet; state.lastBet = bet; save();
    refreshWallet(0, -bet);
    last = null;
    $('#stamp').innerHTML = '';
    $$('.tile').forEach(t => {
      t.className = 'tile';
      t.innerHTML = '';
      t.style.removeProperty('--d');
      if (!reduce) { t.classList.add('wave'); setTimeout(() => t.classList.remove('wave'), 900); }
    });
    sfx('start');
    syncUI();
  }

  async function openCell(tile) {
    if (!round) { nudge($('#cta')); return; }
    if (busy || tile.classList.contains('open')) return;
    const r = round, i = Number(tile.dataset.i);
    busy = true;
    tile.classList.add('open', 'flip');
    await wait(130);
    tile.classList.remove('flip');
    busy = false;
    if (r.mines.has(i)) {
      tile.classList.add('mine', 'hit');
      tile.innerHTML = I.mine;
      return lose(i);
    }
    r.opened.push(i);
    const k = r.opened.length;
    tile.classList.add('safe');
    tile.innerHTML = `<span class="mono">${fx(mult(k))}</span>`;
    sfx('safe', k); burst(tile, 6);
    navigator.vibrate?.(8);
    syncUI();
    replay($('#cta'), 'pop');
    if (k === SAFE) cashOut();
  }

  function randomTile() {
    const free = $$('.tile:not(.open)');
    if (round && free.length) openCell(free[randInt(free.length)]);
  }

  function revealRest(r) {
    let n = 0;
    $$('.tile').forEach(t => {
      if (t.classList.contains('open')) return;
      t.classList.add('open');
      if (r.mines.has(Number(t.dataset.i))) {
        t.style.setProperty('--d', `${150 + n++ * 90}ms`);
        t.classList.add('mine', 'ghost');
        t.innerHTML = I.mine;
      } else t.classList.add('dim');
    });
  }

  function lose(hit) {
    const r = round;
    round = null; r.hit = hit;
    replay($('#console'), 'shake');
    sfx('lose'); navigator.vibrate?.([30, 40, 70]);
    revealRest(r);
    showStamp('loss', `−${fmt(r.bet)}`, `мина на ${r.opened.length + 1}-й клетке`);
    last = {k: r.opened.length, lost: true, id: r.id};
    record(r, 'lose', 0);
    syncUI();
  }

  function cashOut() {
    if (!round || busy || !round.opened.length) return;
    const r = round, k = r.opened.length, payout = Math.round(r.bet * mult(k));
    round = null;
    state.balance += payout;
    revealRest(r);
    sfx('win');
    showStamp('win', `+${fmt(payout - r.bet)}`, `${fx(mult(k))} · ${cells(k)}`);
    flyCoins($('#cta'), Math.min(18, 5 + k * 2));
    refreshWallet(reduce ? 0 : 780, payout);
    last = {k, lost: false, id: r.id};
    record(r, 'win', payout);
    syncUI();
  }

  function showStamp(kind, big, small) {
    $('#stamp').innerHTML = `<div class="stamp ${kind}"><b class="mono">${big}</b><small>${small}</small></div>`;
  }

  function record(r, result, payout) {
    const rec = {
      id: r.id, date: new Date().toISOString(), bet: r.bet, payout, net: payout - r.bet, opened: r.opened.length, result,
      version: state.gameVersion, mines: r.mineList, picks: r.opened, hit: r.hit ?? -1, salt: r.salt, hash: r.hash,
    };
    state.rounds.unshift(rec);
    state.rounds = state.rounds.slice(0, 100);
    save();
    if (!rec.hash) r.hashP.then(h => { rec.hash = h; save(); });
    renderHist(true);
    pushFeed({name: state.nickname, kind: 'me', k: result === 'win' ? r.opened.length : r.opened.length + 1, win: result === 'win', net: rec.net});
  }

  function renderHist(fresh) {
    const list = state.rounds.slice(0, 6), net = myNet(), el = $('#session-net');
    el.className = `mono ${net >= 0 ? 'pos' : 'neg'}`;
    el.textContent = state.rounds.length ? signed(net) : '';
    $('#hist').innerHTML = list.map((r, i) => `
      <li class="${r.result}${fresh && i === 0 ? ' enter' : ''}">
        <i class="h-dot"></i>
        <span>${r.result === 'win' ? fx(mult(r.opened)) : 'Мина'}<small>${r.result === 'win' ? cells(r.opened) : `на ${r.opened + 1}-й клетке`} · ${ago(r.date)}</small></span>
        <b class="mono ${r.net >= 0 ? 'pos' : 'neg'}">${signed(r.net)}</b>
      </li>`).join('') || '<li class="empty">Здесь появятся твои раунды.</li>';
  }

  /* live table feed — demo stream of people & agents */
  const FEED_POOL = [
    ...HUMANS.map(h => ({name: h.name, kind: 'human', depth: [1, 5]})),
    ...AGENTS.filter((a, i) => a.balance > 0 && i % 2 === 0).map(a => ({name: a.name, kind: 'ai', depth: a.type.depth})),
  ];
  function simulate() {
    const p = FEED_POOL[Math.floor(Math.random() * FEED_POOL.length)];
    const want = p.depth[0] + Math.floor(Math.random() * (p.depth[1] - p.depth[0] + 1));
    const bet = [100, 100, 200, 300, 500, 500, 1000, 2000][Math.floor(Math.random() * 8)];
    for (let k = 0; k < want; k++) if (Math.random() >= (SAFE - k) / (CELLS - k)) return {...p, k: k + 1, win: false, net: -bet};
    return {...p, k: want, win: true, net: Math.round(bet * mult(want)) - bet};
  }
  function pushFeed(e, quiet) {
    const feed = $('#feed');
    if (!feed) return;
    const li = document.createElement('li');
    if (!quiet) li.className = 'enter';
    li.innerHTML = `${avatar(e.name, e.kind, 30)}
      <div><span class="f-who"><b>${esc(e.name)}</b>${e.kind === 'ai' ? '<em class="tag-ai">AI</em>' : e.kind === 'me' ? '<em class="tag-me">ты</em>' : ''}</span>
      <small>${e.win ? `стоп на ${e.k}-й · ${fx(mult(e.k))}` : `мина на ${e.k}-й`}</small></div>
      <b class="mono ${e.net >= 0 ? 'pos' : 'neg'}">${signed(e.net)}</b>`;
    feed.prepend(li);
    while (feed.children.length > 6) feed.lastElementChild.remove();
  }
  function startFeed() {
    for (let i = 0; i < 5; i++) pushFeed(simulate(), true);
    const tick = () => { if (!document.hidden) pushFeed(simulate()); setTimeout(tick, 1800 + Math.random() * 2800); };
    setTimeout(tick, 1500);
  }

  /* ═════════ RULES ═════════ */
  function rulesPage() {
    const order = [12, 6, 18, 7, 13, 1, 22, 16, 8, 3, 11, 19, 23, 0, 14, 9, 21, 4, 17, 2, 10, 24, 5, 15, 20];
    shell(`
      <header class="intro"><h1>Правила</h1><p>Поле 5×5, под пятью клетками — мины. Открывай по одной и забирай выплату, когда решишь остановиться.</p></header>
      <section class="steps">
        <article class="panel step"><div class="step-art"><div class="art-bet"><span>−</span><b class="mono">100</b>${coin}<span>+</span></div></div><h3><span class="mono">1</span>Ставка</h3><p>От 100 монет с шагом 100. Списывается в начале раунда.</p></article>
        <article class="panel step"><div class="step-art">${miniBoard()}<span class="art-lock">${I.lock}</span></div><h3><span class="mono">2</span>Клетки</h3><p>Мины расставлены до первого хода и не двигаются до конца раунда.</p></article>
        <article class="panel step"><div class="step-art"><div class="art-choice"><span class="a">Ещё</span><span class="b">Забрать</span></div></div><h3><span class="mono">3</span>Решение</h3><p>После каждой безопасной клетки можно забрать выплату. Мина — ставка сгорает.</p></article>
      </section>
      <section class="rules-main">
        <div class="panel calc">
          <div>
            <h2>Сколько клеток открыть?</h2>
            <div class="k-out"><b class="mono" id="k-out">3</b><span id="k-word">клетки подряд</span></div>
            <input type="range" id="k" min="1" max="20" value="3" aria-label="Число клеток">
            <div class="calc-board" id="calc-board">${Array.from({length: CELLS}, (_, i) => `<i style="--d:${order.indexOf(i) * 18}ms" data-o="${order.indexOf(i)}"></i>`).join('')}</div>
          </div>
          <div>
            <dl class="kv">
              <div><dt>Шанс не встретить мину</dt><dd class="mono" id="c-p"></dd></div>
              <div><dt>Множитель</dt><dd class="mono" id="c-m"></dd></div>
              <div><dt>Выплата со ставки <input id="c-bet" class="mini-input mono" value="100" inputmode="numeric" aria-label="Ставка"></dt><dd class="mono" id="c-pay"></dd></div>
            </dl>
            <p class="formula">выплата = ставка × 0,973 ÷ шанс</p>
            <p class="muted small">Поэтому в среднем игра возвращает 97,3% поставленного — но только на очень длинной дистанции. Отдельному раунду или вечеру это ничего не обещает.</p>
          </div>
        </div>
        <div class="panel ptable-wrap">
          <table class="ptable"><thead><tr><th>Клеток</th><th>Шанс</th><th>Множитель</th></tr></thead>
          <tbody>${Array.from({length: SAFE}, (_, i) => `<tr data-k="${i + 1}"><td>${i + 1}</td><td>${pct(pSafe(i + 1))}</td><td>${fx(mult(i + 1))}</td></tr>`).join('')}</tbody></table>
        </div>
      </section>
      <section class="facts">
        <div><b class="mono">10 000</b><span>монет при регистрации</span></div>
        <div><b class="mono">12:00</b><span>по Москве баланс можно добрать до 10 000, если он ниже</span></div>
        <div><b class="mono">0 ₽</b><span>монеты нельзя купить или вывести — это не деньги</span></div>
      </section>`);

    const k = $('#k'), bet = $('#c-bet');
    const update = () => {
      const n = Number(k.value), b = Math.max(MIN_BET, Number(bet.value.replace(/\D/g, '')) || MIN_BET);
      k.style.setProperty('--fill', `${(n - 1) / 19 * 100}%`);
      $('#k-out').textContent = n;
      $('#k-word').textContent = `${plural(n, 'клетка', 'клетки', 'клеток')} подряд`;
      $$('#calc-board i').forEach(c => c.classList.toggle('s', Number(c.dataset.o) < n));
      tween($('#c-p'), pSafe(n), {format: pct, dur: 350});
      tween($('#c-m'), mult(n), {format: fx, dur: 350});
      tween($('#c-pay'), b * mult(n), {dur: 350});
      $$('.ptable tr[data-k]').forEach(r => r.classList.toggle('on', Number(r.dataset.k) === n));
    };
    k.addEventListener('input', () => { update(); sfx('safe', Number(k.value) - 1); });
    bet.addEventListener('input', update);
    $$('.ptable tr[data-k]').forEach(r => r.onclick = () => { k.value = r.dataset.k; update(); sfx('tap'); });
    update();
  }

  /* ═════════ STATS / LEADERBOARD ═════════ */
  function statsPage() {
    const all = ranked();
    const humans = all.filter(p => p.kind !== 'ai'), ais = all.filter(p => p.kind === 'ai');
    const top3 = humans.slice(0, 3);
    let filter = 'all', query = '', shown = 15, scope = 'human';

    shell(`
      <header class="intro"><h1>Рейтинг</h1><p>Люди и AI-агенты играют по одним правилам и стоят в одной таблице. Место — по текущему балансу.</p></header>
      <section class="podium">${top3.map(p => `
        <a class="pod p${p.humanRank}" href="profile.html?player=${encodeURIComponent(p.name)}">
          <span class="place">${p.humanRank}</span>
          ${avatar(p.name, p.kind, 48)}
          <span class="pod-name">${esc(p.name)}${p.kind === 'me' ? '<em class="tag-me">ты</em>' : ''}</span>
          ${statusOf(p) ? `<q>${esc(statusOf(p))}</q>` : ''}
          <span class="pod-bal mono">${fmt(p.balance)} ${coin}</span>
        </a>`).join('')}</section>
      <section class="panel lb-panel">
        <div class="tbar">
          <div class="seg" id="filter"><button class="on" data-f="all">Все</button><button data-f="human">Люди</button><button data-f="ai">AI</button><i class="seg-thumb"></i></div>
          <label class="search">${I.search}<input id="q" type="search" placeholder="Найти игрока" aria-label="Найти игрока"></label>
        </div>
        <div class="tscroll"><table class="lb">
          <thead><tr><th>#</th><th>Игрок</th><th class="r">Баланс</th><th class="r">Итог ставок</th><th class="r">Раунды</th></tr></thead>
          <tbody id="lb"></tbody>
        </table></div>
        <button class="btn btn-line sm more-btn" id="more">Показать ещё</button>
        <p class="tnote">Итог ставок — выплаты минус ставки; ежедневные монеты в него не входят. Пятеро лучших людей получают отметку и могут оставить статус — AI это право не занимают.</p>
      </section>
      <section class="sec">
        <div class="sec-head"><h2>Игра в цифрах</h2><div class="seg" id="scope"><button class="on" data-s="human">Люди</button><button data-s="ai">AI-агенты</button><i class="seg-thumb"></i></div></div>
        <div class="numbers" id="numbers"></div>
      </section>
      <section class="sec panel types" data-reveal>
        <div class="sec-head"><div><h2>AI-типажи</h2><p class="muted small">10 характеров по 10 агентов, 50 раундов на каждого. Точка — один агент, черта — медиана.</p></div><span class="tag">демо-данные</span></div>
        ${dotplot()}
      </section>`);

    const rowHtml = (p, i) => {
      const st = statusOf(p), top = p.kind !== 'ai' && p.humanRank <= 5;
      const cls = [top && 'is-top', top && p.humanRank <= 3 && 'is-top3', p.kind === 'me' && 'is-me'].filter(Boolean).join(' ');
      return `<tr class="${cls}" style="--i:${i}" data-href="profile.html?player=${encodeURIComponent(p.name)}">
        <td class="rk mono">${p.rank}</td>
        <td><div class="who">${avatar(p.name, p.kind, 34)}<div>
          <a href="profile.html?player=${encodeURIComponent(p.name)}">${esc(p.name)}</a>${p.kind === 'ai' ? '<em class="tag-ai">AI</em>' : ''}${p.kind === 'me' ? '<em class="tag-me">ты</em>' : ''}${top ? `<em class="tag-top">топ-${p.humanRank}</em>` : ''}
          ${st ? `<small>«${esc(st)}»</small>` : p.kind === 'ai' ? `<small>${p.type.note}</small>` : ''}
        </div></div></td>
        <td class="r mono">${fmt(p.balance)}</td>
        <td class="r mono ${p.net >= 0 ? 'pos' : 'neg'}">${signed(p.net)}</td>
        <td class="r mono">${fmt(p.rounds)}</td></tr>`;
    };
    const render = () => {
      const q = query.toLowerCase();
      const list = all.filter(p => (filter === 'all' || (filter === 'ai') === (p.kind === 'ai')) && p.name.toLowerCase().includes(q));
      $('#lb').innerHTML = list.slice(0, shown).map(rowHtml).join('') || '<tr><td colspan="5" class="empty">Никого не нашли.</td></tr>';
      $('#more').hidden = list.length <= shown;
      $('#more').textContent = `Показать ещё · ${list.length - shown}`;
    };
    $('#lb').addEventListener('click', e => { const tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a')) location.href = tr.dataset.href; });
    $$('#filter button').forEach(b => b.onclick = () => {
      filter = b.dataset.f; shown = 15;
      $$('#filter button').forEach(x => x.classList.toggle('on', x === b));
      segSync($('#filter')); sfx('tap'); render();
    });
    $('#q').addEventListener('input', e => { query = e.target.value.trim(); shown = 15; render(); });
    $('#more').onclick = () => { shown += 25; render(); };

    const renderNumbers = () => {
      const list = scope === 'human' ? humans : ais;
      const bets = sum(list, betsOf), net = sum(list, p => p.net), bals = list.map(p => p.balance).sort((a, b) => a - b);
      const median = bals[Math.floor(bals.length / 2)];
      const edges = [0, 2500, 5000, 7500, 10000, 12500, 15000, 20000, 30000, Infinity];
      const buckets = edges.slice(0, -1).map((lo, i) => list.filter(p => p.balance >= lo && p.balance < edges[i + 1]).length);
      const maxB = Math.max(...buckets);
      $('#numbers').innerHTML = `
        <div class="kpis" data-reveal>
          <div class="panel kpi"><span>Раундов</span><b class="mono" data-count="${sum(list, p => p.rounds)}">0</b><small>n = ${list.length} ${plural(list.length, 'аккаунт', 'аккаунта', 'аккаунтов')}</small></div>
          <div class="panel kpi"><span>Фактический RTP</span><b class="mono" data-count="${(bets + net) / bets * 100}" data-fmt="pct">0</b><small>теория — 97,3%</small></div>
          <div class="panel kpi"><span>В плюсе по ставкам</span><b class="mono" data-count="${list.filter(p => p.net > 0).length / list.length * 100}" data-fmt="pct">0</b><small>доля игроков</small></div>
          <div class="panel kpi"><span>Медианный баланс</span><b class="mono" data-count="${median}">0</b><small>старт — 10 000</small></div>
        </div>
        <div class="panel histo" data-reveal>
          <div class="panel-head"><h2>Распределение балансов</h2><span class="tag">n = ${list.length}</span></div>
          <div class="bars">${buckets.map((c, i) => `<div class="bar${edges[i] === 10000 ? ' mark' : ''}" style="--h:${maxB ? c / maxB * 100 : 0}%;--n:${i}"><em>${c}</em><i></i></div>`).join('')}</div>
          <div class="bar-labels">${['0', '2,5к', '5к', '7,5к', '10к', '12,5к', '15к', '20к', '30к+'].map(l => `<span>${l}</span>`).join('')}</div>
        </div>`;
      revealOnScroll($('#numbers'));
    };
    $$('#scope button').forEach(b => b.onclick = () => {
      scope = b.dataset.s;
      $$('#scope button').forEach(x => x.classList.toggle('on', x === b));
      segSync($('#scope')); sfx('tap'); renderNumbers();
    });

    render();
    renderNumbers();
    requestAnimationFrame(() => $$('.seg').forEach(s => { segSync(s); s.classList.add('ready'); }));
  }

  function dotplot() {
    const max = Math.max(30000, Math.ceil(Math.max(...AGENTS.map(a => a.balance)) / 10000) * 10000);
    const x = v => `${v / max * 100}%`;
    const rows = AI_TYPES.map(t => {
      const list = AGENTS.filter(a => a.type === t).sort((a, b) => a.balance - b.balance);
      return {t, list, med: (list[4].balance + list[5].balance) / 2};
    }).sort((a, b) => b.med - a.med);
    return `<div class="dp" style="--start:${x(START)}">
      ${rows.map((r, ri) => `<div class="dp-row">
        <span class="dp-name">${r.t.name}</span>
        <div class="dp-track">
          <i class="med" style="--m:${x(r.med)}"></i>
          ${r.list.map((a, j) => `<a class="dot${a.balance < MIN_BET ? ' bust' : ''}" href="profile.html?player=${encodeURIComponent(a.name)}" style="--x:${x(a.balance)};--j:${j};--row:${ri};--y:${(hash(a.name) % 15) - 7}px" data-tip="${esc(a.name)} · ${fmt(a.balance)}"></a>`).join('')}
        </div>
        <span class="dp-med mono">${fmt(r.med)}</span>
      </div>`).join('')}
      <div class="dp-axis"><span></span><div>${[0, 10000, 20000, 30000, 40000, 50000].filter(v => v <= max).map(v => `<span style="left:${x(v)}">${v ? `${v / 1000}к` : '0'}</span>`).join('')}</div><span class="mono">медиана</span></div>
    </div>`;
  }

  /* ═════════ JOURNAL ═════════ */
  function journalPage() {
    const R = state.rounds, net = myNet();
    shell(`
      <header class="intro row"><div><h1>Журнал</h1><p>Каждый твой раунд: ставка, исход, выплата и раскладка мин, которую можно сверить с хэшем.</p></div>
        <button class="btn btn-line" id="export"${R.length ? '' : ' disabled'}>${I.down}JSON</button></header>
      <section class="kpis sum" data-reveal>
        <div class="panel kpi"><span>Раундов</span><b class="mono" data-count="${R.length}">0</b></div>
        <div class="panel kpi"><span>Поставлено</span><b class="mono" data-count="${sum(R, r => r.bet)}">0</b></div>
        <div class="panel kpi"><span>Выплачено</span><b class="mono" data-count="${sum(R, r => r.payout)}">0</b></div>
        <div class="panel kpi"><span>Итог ставок</span><b class="mono ${net >= 0 ? 'pos' : 'neg'}" data-count="${net}" data-fmt="signed">0</b></div>
      </section>
      ${R.length > 1 ? `<section class="panel chart-panel"><div class="panel-head"><h2>Итог по раундам</h2><span class="tag">по ${R.length} ${plural(R.length, 'раунду', 'раундам', 'раундам')}</span></div>${sparkline(R)}</section>` : ''}
      <section class="panel jpanel">
        ${R.length ? `<div class="jhead"><span></span><span>Раунд</span><span>Ставка</span><span>Клеток</span><span>Выплата</span><span>Итог</span><span></span></div>` : ''}
        ${R.map(r => `<details class="jrow" id="${esc(r.id)}">
          <summary>
            <i class="h-dot ${r.result}"></i>
            <span><b class="mono">${esc(r.id)}</b><small>${stamp(r.date)}</small></span>
            <span class="mono">${fmt(r.bet)}</span>
            <span class="mono">${r.opened}</span>
            <span class="mono">${fmt(r.payout)}</span>
            <span class="mono ${r.net >= 0 ? 'pos' : 'neg'}">${signed(r.net)}</span>
            <span class="chev">${I.chev}</span>
          </summary>
          <div class="jbody">
            ${r.mines ? miniBoard({mines: r.mines, picks: r.picks || [], hit: r.hit ?? -1}) : ''}
            ${r.mines && r.salt ? `<dl class="verify">
              <div><dt>Мины</dt><dd class="mono">${r.mines.map(m => m + 1).join(', ')}</dd></div>
              <div><dt>Соль</dt><dd class="mono">${esc(r.salt)}</dd></div>
              <div><dt>SHA-256 до первого хода</dt><dd class="mono hash">${esc(r.hash || '—')}</dd></div>
              <div><dt>Правила</dt><dd class="mono">v${esc(r.version)} · RTP 97,3%</dd></div>
              <button class="btn btn-ink sm" data-verify="${esc(r.id)}">${I.check}Проверить</button>
            </dl>` : '<p class="muted small">Раунд сыгран в старой версии прототипа — раскладка не сохранилась.</p>'}
          </div>
        </details>`).join('') || `<div class="empty big">Пока пусто. <a href="index.html">Сыграй первый раунд</a> — он появится здесь.</div>`}
      </section>
      <p class="tnote">Прототип хранит записи в этом браузере, поэтому они не доказывают исход. В рабочей версии журнал ведёт сервер, а код открыт.</p>`);

    $('#export').onclick = () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify({prototype: true, player: state.nickname, rounds: R}, null, 2)], {type: 'application/json'}));
      const a = Object.assign(document.createElement('a'), {href: url, download: 'dodep-journal.json'});
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Журнал скачан', `${R.length} ${plural(R.length, 'раунд', 'раунда', 'раундов')} в JSON.`);
    };
    $$('[data-verify]').forEach(b => b.onclick = async () => {
      const r = R.find(x => x.id === b.dataset.verify);
      const h = await sha256(layoutString(r.mines, r.salt));
      const ok = h && h === r.hash;
      b.outerHTML = ok ? `<span class="verdict pos">${I.check}Совпадает с хэшем, показанным до первого хода</span>` : '<span class="verdict neg">Не совпадает</span>';
      sfx(ok ? 'win' : 'lose');
    });
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) { target.open = true; setTimeout(() => target.scrollIntoView({block: 'center', behavior: reduce ? 'auto' : 'smooth'}), 300); target.classList.add('flash'); }
    bindSpark();
  }

  function sparkline(R) {
    const pts = [0];
    [...R].reverse().forEach(r => pts.push(pts.at(-1) + r.net));
    const W = 800, H = 180, P = 10, min = Math.min(0, ...pts), max = Math.max(0, ...pts), span = max - min || 1;
    const x = i => i / (pts.length - 1) * W, y = v => P + (H - 2 * P) * (1 - (v - min) / span);
    const d = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const tone = pts.at(-1) >= 0 ? 'pos' : 'neg';
    return `<div class="spark ${tone}" data-pts="${pts.join(',')}" data-min="${min}" data-span="${span}">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".2"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
        <line class="zero" x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}"/>
        <path class="area" d="${d}L${W},${H}L0,${H}Z"/>
        <path class="line" d="${d}" pathLength="1"/>
      </svg>
      <i class="spark-dot"></i><span class="spark-tip mono"></span>
    </div>`;
  }
  function bindSpark() {
    const s = $('.spark');
    if (!s) return;
    const pts = s.dataset.pts.split(',').map(Number), min = Number(s.dataset.min), span = Number(s.dataset.span);
    const dot = $('.spark-dot', s), tip = $('.spark-tip', s);
    s.addEventListener('pointermove', e => {
      const r = s.getBoundingClientRect(), i = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (pts.length - 1));
      const px = i / (pts.length - 1) * r.width, py = (10 / 180 + (160 / 180) * (1 - (pts[i] - min) / span)) * r.height;
      dot.style.transform = tip.style.transform = `translate(${px}px,${py}px)`;
      tip.textContent = i ? `после ${i}-го: ${signed(pts[i])}` : 'старт: 0';
      s.classList.add('hover');
    });
    s.addEventListener('pointerleave', () => s.classList.remove('hover'));
  }

  /* ═════════ PROFILE ═════════ */
  function profilePage() {
    const q = new URLSearchParams(location.search).get('player');
    if (!q && !authed()) { location.replace('auth.html'); return; }
    const all = ranked(), p = q ? all.find(x => x.name === q) : all.find(x => x.kind === 'me');
    if (!p) {
      shell(`<div class="empty big">Игрок не найден или скрыт из рейтинга. <a href="stats.html">К рейтингу</a></div>`);
      return;
    }
    const mine = p.kind === 'me', st = statusOf(p), canStatus = mine && p.humanRank <= 5;
    const humans = all.filter(x => x.kind !== 'ai'), fifth = humans[4];
    const gap = mine && !canStatus && fifth ? fifth.balance - p.balance + 1 : 0;

    shell(`
      <section class="profile">
        <div class="panel pcard">
          ${avatar(p.name, p.kind, 84)}
          <h1>${esc(p.name)}</h1>
          <div class="ptags">${p.kind === 'ai' ? `<em class="tag-ai">AI · ${p.type.name}</em>` : p.humanRank <= 5 ? `<em class="tag-top">топ-${p.humanRank} среди людей</em>` : ''}${mine ? '<em class="tag-me">это ты</em>' : ''}</div>
          ${st ? `<blockquote id="pquote">«${esc(st)}»</blockquote>` : ''}
          ${p.kind === 'ai' ? `<p class="muted">${p.type.note} Играет по тем же правилам, без ежедневных монет во время запуска.</p>` : ''}
          <dl class="pstats" data-reveal>
            <div><dt>Место</dt><dd class="mono">#${p.rank}</dd></div>
            <div><dt>Баланс</dt><dd class="mono" data-count="${p.balance}">0</dd></div>
            <div><dt>Итог ставок</dt><dd class="mono ${p.net >= 0 ? 'pos' : 'neg'}" data-count="${p.net}" data-fmt="signed">0</dd></div>
            <div><dt>Раундов</dt><dd class="mono" data-count="${p.rounds}">0</dd></div>
          </dl>
          ${mine ? '<button class="btn btn-line sm" id="logout">Выйти</button>' : '<a class="more" href="stats.html">← К рейтингу</a>'}
        </div>
        <div class="pmain">
          ${mine ? (canStatus ? `
            <section class="panel status-ed">
              <div class="panel-head"><h2>Публичный статус</h2><span class="tag">топ-5 людей</span></div>
              <textarea id="status" maxlength="72" placeholder="Короткая мысль о своей игре">${esc(state.status)}</textarea>
              <div class="status-meta"><span class="counter mono" id="counter"></span><button class="btn btn-ink sm" id="status-save">Опубликовать</button></div>
              <div class="preview"><small>Так увидят в рейтинге</small><div class="who">${avatar(p.name, 'me', 34)}<div><b>${esc(p.name)}</b><em class="tag-top">топ-${p.humanRank}</em><small id="pv">«${esc(state.status || '…')}»</small></div></div></div>
              <p class="muted small">Публикуется сразу, без ссылок. Право пропадёт, если опустишься ниже пятого места среди людей.</p>
            </section>` : `
            <section class="panel">
              <div class="panel-head"><h2>Публичный статус</h2>${I.lock}</div>
              <p class="muted">Статус открывается пятёрке лучших людей. Ты сейчас ${p.humanRank}-й среди людей${gap > 0 ? ` — до пятого места не хватает <b class="mono">${fmt(gap)}</b> монет` : ''}.</p>
              ${fifth ? `<div class="gap-bar" data-reveal><i style="--w:${Math.min(100, p.balance / fifth.balance * 100)}%"></i></div>` : ''}
            </section>`) : ''}
          ${mine ? `
            <section class="panel">
              <div class="panel-head"><h2>Последние раунды</h2><a class="more" href="journal.html">Журнал</a></div>
              <ol class="hist" id="hist"></ol>
            </section>
            <section class="panel daily-card${canDaily() ? ' ready' : ''}">
              <div><h2>Ежедневная выдача</h2><p class="muted">${dailyText()}</p></div>
              ${canDaily() ? '<button class="btn btn-coin" id="p-daily">Забрать</button>' : ''}
            </section>` : `
            <section class="panel"><div class="empty">История раундов других игроков появится вместе с серверным журналом.</div></section>`}
        </div>
      </section>`);

    if (mine) {
      const list = state.rounds.slice(0, 8);
      $('#hist').innerHTML = list.map(r => `<li class="${r.result}"><i class="h-dot"></i><span>${r.result === 'win' ? fx(mult(r.opened)) : 'Мина'}<small>ставка ${fmt(r.bet)} · ${ago(r.date)}</small></span><b class="mono ${r.net >= 0 ? 'pos' : 'neg'}">${signed(r.net)}</b></li>`).join('') || '<li class="empty">Раундов пока нет. <a href="index.html">К игре</a></li>';
      $('#logout').onclick = () => { state.loggedOut = true; save(); location.href = 'index.html'; };
      $('#p-daily')?.addEventListener('click', e => { claimDaily(e.currentTarget); setTimeout(profilePage, 900); });
    }
    if (canStatus) {
      const ta = $('#status'), counter = $('#counter');
      const sync = () => { const n = ta.value.length; counter.textContent = `${n}/72`; counter.classList.toggle('warn', n > 60); $('#pv').textContent = `«${ta.value.trim() || '…'}»`; };
      ta.addEventListener('input', sync); sync();
      $('#status-save').onclick = () => {
        state.status = ta.value.replace(/(https?:\/\/|www\.)\S+/gi, '').replace(/\s+/g, ' ').trim().slice(0, 72);
        save(); sfx('win');
        ta.value = state.status; sync();
        toast('Статус опубликован', state.status ? 'Он уже виден в рейтинге.' : 'Статус очищен.', 'good');
      };
    }
  }

  /* ═════════ AUTH ═════════ */
  function authPage() {
    const mode = new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login';
    shell(`
      <section class="auth">
        <div class="auth-art" aria-hidden="true">
          <div class="toy" id="toy">${'<i></i>'.repeat(CELLS)}</div>
          <p>25 клеток, 5 мин<br>и одно решение — когда остановиться.</p>
        </div>
        <div class="auth-box">${authForm(mode)}</div>
      </section>`);
    bindAuth($('#auth-form'), () => setTimeout(() => location.href = 'index.html', 450));
    if (reduce) return;
    const toy = $$('#toy i');
    setInterval(() => {
      const t = toy[Math.floor(Math.random() * CELLS)];
      if (t.className) return;
      t.className = Math.random() < .2 ? 'm' : 's';
      setTimeout(() => t.className = '', 1400 + Math.random() * 1200);
    }, 380);
  }

  /* ═════════ ADMIN ═════════ */
  function adminPage() {
    const TABS = [['overview', 'Обзор'], ['config', 'Правила'], ['accounts', 'Аккаунты'], ['statuses', 'Статусы'], ['audit', 'История']];
    let tab = TABS.some(t => t[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
    shell(`
      <header class="intro"><h1>Панель автора</h1><p>Демо-режим: действия хранятся только в этом браузере.</p></header>
      <div class="admin">
        <nav class="panel admin-nav" id="anav">${TABS.map(([id, l]) => `<button data-tab="${id}">${l}<span class="count mono" data-of="${id}"></span></button>`).join('')}</nav>
        <div id="acontent"></div>
      </div>`);

    const accounts = () => [...HUMANS, ...AGENTS, ...(state.nickname ? [{name: state.nickname, kind: 'me', balance: state.balance, status: state.status}] : [])];
    const withStatus = () => accounts().filter(p => p.kind !== 'ai' && p.status);
    const act = (kind, name) => {
      const prop = kind === 'account' ? 'adminBlocked' : 'hiddenStatuses', active = state[prop].includes(name);
      const action = kind === 'account' ? (active ? 'Разблокировать' : 'Заблокировать') : (active ? 'Показать статус' : 'Скрыть статус');
      const m = modal(`<h2>${action}</h2><p><b>${esc(name)}</b>. Причина попадёт в историю действий — её можно будет проверить и отменить.</p>
        <textarea id="reason" maxlength="180" placeholder="Причина"></textarea>
        <div class="modal-actions"><button class="btn btn-line" data-close>Отмена</button><button class="btn ${active ? 'btn-ink' : 'btn-danger'}" id="ok">${action}</button></div>`);
      const reason = $('#reason', m.el);
      setTimeout(() => reason.focus(), 60);
      $('#ok', m.el).onclick = () => {
        if (!reason.value.trim()) { nudge(reason); reason.focus(); return; }
        state[prop] = active ? state[prop].filter(x => x !== name) : [...state[prop], name];
        state.adminActions.unshift({at: new Date().toISOString(), kind, name, action, reason: reason.value.trim()});
        save(); sfx('tap'); m.close();
        toast(`${action}: ${name}`, 'Записано в историю.');
        render();
      };
    };

    const views = {
      overview: () => `
        <div class="kpis" data-reveal>
          <div class="panel kpi"><span>Аккаунтов</span><b class="mono" data-count="${accounts().length}">0</b><small>из них AI — ${AGENTS.length}</small></div>
          <div class="panel kpi"><span>Заблокировано</span><b class="mono" data-count="${state.adminBlocked.length}">0</b></div>
          <div class="panel kpi"><span>Скрыто статусов</span><b class="mono" data-count="${state.hiddenStatuses.length}">0</b></div>
          <div class="panel kpi"><span>Правила</span><b class="mono">v${esc(state.gameVersion)}</b><small>зафиксированы</small></div>
        </div>
        <section class="panel"><div class="panel-head"><h2>Последние действия</h2></div>${auditList(5)}</section>`,
      config: () => `
        <section class="panel">
          <div class="panel-head"><h2>Правила v${esc(state.gameVersion)}</h2><span class="tag">${I.lock} зафиксированы</span></div>
          <dl class="cfg">${[['Поле', '5 × 5'], ['Мины', '5'], ['Теоретический RTP', '97,3%'], ['Ставка', 'от 100, шаг 100'], ['Стартовый баланс', '10 000'], ['Ежедневно', 'до 10 000 · 12:00 МСК'], ['Лимит агента', '50 раундов'], ['RNG', 'crypto · CSPRNG']].map(([k, v]) => `<div><dt>${k}</dt><dd class="mono">${v}</dd></div>`).join('')}</dl>
          <p class="muted small">Пока идёт запуск агентов, версия не меняется. Новая версия создаётся отдельно и попадает в историю.</p>
          <button class="btn btn-line sm" id="draft">Черновик v1.1</button>
        </section>`,
      accounts: () => `
        <section class="panel">
          <label class="search wide">${I.search}<input id="asearch" type="search" placeholder="Никнейм" aria-label="Поиск аккаунта"></label>
          <div class="rows" id="arows"></div>
        </section>`,
      statuses: () => `
        <section class="panel">
          <div class="panel-head"><h2>Публичные статусы</h2></div>
          <p class="muted small">Публикуются сразу. Скрытие не трогает аккаунт и рейтинг.</p>
          <div class="rows">${withStatus().map(p => { const hidden = state.hiddenStatuses.includes(p.name); return `
            <div class="arow${hidden ? ' off' : ''}">${avatar(p.name, p.kind, 32)}<div class="grow"><b>${esc(p.name)}</b><small>«${esc(p.status)}»${hidden ? ' · скрыт' : ''}</small></div>
            <button class="btn btn-line sm" data-act="status" data-name="${esc(p.name)}">${hidden ? 'Показать' : 'Скрыть'}</button></div>`; }).join('')}</div>
        </section>`,
      audit: () => `<section class="panel"><div class="panel-head"><h2>История действий</h2></div>${auditList()}</section>`,
    };
    const auditList = (n = Infinity) => {
      const list = state.adminActions.slice(0, n);
      return list.length ? `<ol class="audit">${list.map(a => `<li><b>${esc(a.action)} · ${esc(a.name)}</b><span>${esc(a.reason)}</span><small class="mono">${stamp(a.at)}</small></li>`).join('')}</ol>` : '<div class="empty">Действий пока не было.</div>';
    };
    const drawAccounts = () => {
      const q = ($('#asearch')?.value || '').trim().toLowerCase();
      const list = accounts().filter(p => p.name.toLowerCase().includes(q)).slice(0, 30);
      $('#arows').innerHTML = list.map(p => { const b = isBlocked(p.name); return `
        <div class="arow${b ? ' off' : ''}">${avatar(p.name, p.kind, 32)}<div class="grow"><b>${esc(p.name)}</b>${p.kind === 'ai' ? '<em class="tag-ai">AI</em>' : ''}<small>баланс ${fmt(p.balance)} · ${b ? 'заблокирован' : 'активен'}</small></div>
        <button class="btn sm ${b ? 'btn-line' : 'btn-danger-line'}" data-act="account" data-name="${esc(p.name)}">${b ? 'Разблокировать' : 'Заблокировать'}</button></div>`; }).join('') || '<div class="empty">Не найдено.</div>';
    };
    function render() {
      $$('#anav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      $('[data-of="accounts"]').textContent = state.adminBlocked.length || '';
      $('[data-of="statuses"]').textContent = state.hiddenStatuses.length || '';
      $('[data-of="audit"]').textContent = state.adminActions.length || '';
      const out = $('#acontent');
      out.innerHTML = views[tab]();
      replay(out, 'swap');
      if (tab === 'accounts') { drawAccounts(); $('#asearch').addEventListener('input', drawAccounts); }
      $('#draft')?.addEventListener('click', () => toast('Черновик версии', 'Редактор появится вместе с API.'));
      revealOnScroll(out);
      history.replaceState(null, '', `#${tab}`);
    }
    $('#acontent').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act, b.dataset.name); });
    $$('#anav button').forEach(b => b.onclick = () => { tab = b.dataset.tab; sfx('tap'); render(); });
    render();
  }

  /* ───────── boot ───────── */
  ({game: gamePage, rules: rulesPage, stats: statsPage, journal: journalPage, profile: profilePage, auth: authPage, admin: adminPage}[page] || gamePage)();
  const resync = () => { $$('.seg').forEach(segSync); const on = $('#nav a.on'); on && $('#nav a.on').dispatchEvent(new Event('mouseenter')); $('#nav')?.dispatchEvent(new Event('mouseleave')); };
  addEventListener('resize', resync);
  document.fonts?.ready.then(resync);
})();
