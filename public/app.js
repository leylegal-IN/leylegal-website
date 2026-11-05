// Ley Legal homepage behaviour: headline roll, hero film, layer story, demo player, waitlist forms.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const qs = new URLSearchParams(location.search);
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || qs.has('static');
  const shot = qs.has('shot');
  const still = reduce || shot;
  const view = qs.get('view'); // comp-only: story | demo | close
  if (reduce) root.classList.add('reduce');
  if (shot) root.classList.add('shot');
  if (view) root.classList.add('v-only', 'v-' + view);
  if (qs.has('og')) root.classList.add('og'); // comp-only: renders the link-preview image (og.png)
  const ABORT = Symbol('abort');

  /* ================= Language: English (in the page) or Hindi (hi.js) ================= */
  const SITE = 'https://leylegal.in'; // the Vercel build swaps this for the production address
  const HI = window.LL_HI || {};
  // English for the lines app.js writes itself. Lines in index.html keep their English there (data-t="…").
  const EN = {
    authority: 'Authority', checked: 'Checked', next: 'Next hearing', date: 'Fri, 18 Dec 2026', Nov: 'Nov', Dec: 'Dec',
    'cta.join': 'Join the waitlist', 'pause.pause': 'Pause the examples', 'pause.play': 'Play the examples',
    'x1.st1': 'Reading your question', 'x1.st2': 'Searching Supreme Court and High Court judgements',
    'x1.st3': 'Checking each citation against its judgement', 'x1.done': 'Citations checked',
    'x1.lead': '<b>No, not automatically.</b> Police must first meet the conditions in <b>Section 35, BNSS</b> <span class="was">(formerly 41 and 41A, CrPC)</span> and record their reasons.',
    'x1.provK': 'Provision',
    'x1.prov': 'Cruelty by husband or relatives: <mark class="hl" data-s="hl1"><b>Section 85, BNS</b></mark><span class="was was-line">formerly Section 498A, IPC</span>',
    'x1.court': 'Supreme Court', 'x1.open': 'Open judgement',
    'x2.st': 'Fetching the case status', 'x2.done': 'Updated from court records',
    'x2.type': 'Title Suit 245/2024', 'x2.sample': 'Sample case', 'x2.case': 'Ramesh Prasad v. Sunita Devi', 'x2.court': 'Civil Judge (Senior Division) I, Patna',
    'x2.stageK': 'Stage', 'x2.stage': 'Evidence', 'x2.orderK': 'Last order', 'x2.order': '28 Oct 2026 · PW-2 examined, listed for further evidence',
    'x3.st': 'Checking the IPC to BNS mapping', 'x3.done': 'From the reviewed old to new mapping',
    'f.name': 'Your name', 'f.namePh': 'e.g. Anjali Sinha', 'f.email': 'Email', 'f.wa': 'WhatsApp number', 'f.opt': 'Optional',
    'f.role': 'I am', 'f.adv': 'Advocate', 'f.stu': 'Law student',
    'f.consent': 'We’ll use your email, and your WhatsApp number if you add one, only to tell you when your access opens.', 'f.privacy': 'Privacy policy',
    'e.name': 'Please enter your name.', 'e.email': 'Enter a valid email address.',
    'e.wa': 'Enter a 10-digit Indian mobile number, or leave it empty.', 'e.role': 'Choose advocate or law student.',
    'e.server': 'We couldn’t save that just now. Please try again in a minute.',
    'e.offline': 'You seem to be offline. Check your connection and try again.', 'e.other': 'Something went wrong. Please try again.',
    'd.new': 'You’re registered, {name}.', 'd.old': 'You’re already registered, {name}.',
    'd.mail': 'We’ll email {email} when your access opens.', 'd.mailWa': 'We’ll email {email} and message you on WhatsApp when your access opens.',
    'd.share': 'Tell a colleague on WhatsApp', 'd.shareText': 'Ley Legal: legal research for advocates, in English, Hindi or Hinglish. Join the waitlist: ',
    'st.new': 'Registered', 'st.old': 'Already registered',
  };
  // ?lang= wins (links and comp shots), then the visitor's own earlier choice; English otherwise.
  let L = 'en';
  try { const q = qs.get('lang'); L = q === 'hi' || q === 'en' ? q : localStorage.getItem('ll_lang') === 'hi' ? 'hi' : 'en'; } catch {}
  if (!HI.title) L = 'en';
  const t = (k, vars) => {
    const s = (L === 'hi' && HI[k]) || EN[k] || '';
    return vars ? s.replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? '') : s;
  };
  const orig = new WeakMap();
  // Puts every marked line in scope into the current language. English comes back from what the page first had.
  function apply(scope = document) {
    for (const node of scope.querySelectorAll('[data-t],[data-t-label],[data-t-ph]')) {
      if (!orig.has(node)) orig.set(node, { html: node.innerHTML, label: node.getAttribute('aria-label'), ph: node.getAttribute('placeholder') });
      const o = orig.get(node), hi = L === 'hi';
      if (node.dataset.t) node.innerHTML = (hi && HI[node.dataset.t]) || o.html;
      if (node.dataset.tLabel) node.setAttribute('aria-label', (hi && HI[node.dataset.tLabel]) || o.label);
      if (node.dataset.tPh) node.setAttribute('placeholder', (hi && HI[node.dataset.tPh]) || o.ph);
    }
  }
  const titleEN = document.title;
  root.lang = L;
  if (L === 'hi') { document.title = HI.title; apply(); }

  /* ================= Shared helpers ================= */
  const seg = Intl.Segmenter ? new Intl.Segmenter('hi', { granularity: 'grapheme' }) : null;
  const graphemes = s => seg ? Array.from(seg.segment(s), x => x.segment) : Array.from(s);
  const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const cellsOf = (el, n) => { el.innerHTML = '<i class="sp"></i>'.repeat(n); return [...el.children]; };
  function setCell(c, ch, animate) {
    c.textContent = ch === ' ' ? '' : ch;
    c.classList.toggle('sp', ch === ' ');
    if (!animate) return;
    c.classList.remove('flip'); void c.offsetWidth; c.classList.add('flip');
  }
  // Each cell rattles through a few characters, then settles, left to right.
  function flapTo(cells, text, instant) {
    const target = text.padEnd(cells.length, ' ');
    cells.forEach((c, i) => {
      const want = target[i];
      if (instant) return setCell(c, want, false);
      if ((c.textContent || ' ') === want) return;
      const steps = want === ' ' ? 1 : 3 + ((i * 7 + text.length) % 4);
      for (let k = 0; k < steps; k++) setTimeout(() => setCell(c, FLAP_CHARS[(i * 11 + k * 5 + text.length) % FLAP_CHARS.length], true), i * 34 + k * 62);
      setTimeout(() => setCell(c, want, true), i * 34 + steps * 62);
    });
  }
  // A sleep that respects a pause flag and can be cancelled by bumping a token.
  function makeClock() {
    const C = { token: 0, paused: false };
    C.sleep = ms => {
      const t = C.token;
      return new Promise((res, rej) => {
        let left = ms, last = performance.now();
        const tick = now => {
          if (t !== C.token) return rej(ABORT);
          const dt = Math.min(now - last, 64); last = now;
          if (!C.paused) left -= dt;
          left <= 0 ? res() : requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    };
    return C;
  }

  /* ================= Headline: English, Hindi, Hinglish ================= */
  // The rolling half of the headline. The page's own language leads.
  const ROLL = {
    en: [['en', 'in your language.'], ['hi', 'अपनी भाषा में।'], ['en', 'apni bhasha mein.']],
    hi: [['hi', 'अपनी भाषा में।'], ['en', 'in your language.'], ['en', 'apni bhasha mein.']],
  };
  const roll = $('.roll');
  let variants = [], vi = 0;
  function buildRoll(start) {
    roll.innerHTML = ROLL[L].map(([lang, s]) => `<span class="rv" lang="${lang}">${s.split(' ').map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(' ')}</span>`).join('');
    variants = $$('.rv', roll);
    vi = Math.min(Math.max(start, 0), variants.length - 1);
    variants[vi].classList.add('is-on');
  }
  buildRoll(parseInt(qs.get('variant') || '0', 10) || 0); // ?variant= is comp-only
  if (!still) setInterval(() => {
    if (document.hidden) return;
    const cur = variants[vi];
    vi = (vi + 1) % variants.length;
    cur.classList.remove('is-on'); cur.classList.add('is-out');
    variants[vi].classList.add('is-on');
    setTimeout(() => { cur.classList.add('no-t'); cur.classList.remove('is-out'); void cur.offsetWidth; cur.classList.remove('no-t'); }, 1000);
  }, 3400);

  /* ================= Hero film: five close-ups of the product ================= */
  const film = $('#film'), takes = $$('.take', film);
  // Measure the space between the nav and the headline; the close-ups size themselves to fit it.
  const hero = $('#hero'), heroCopy = $('.hero-copy');
  const sideBySide = matchMedia('(orientation: landscape) and (max-height: 520px)');
  function sizeFilm() {
    const copyH = sideBySide.matches ? 0 : heroCopy.offsetHeight;
    hero.style.setProperty('--copy-h', copyH + 'px');
    hero.style.setProperty('--zone-h', Math.max(hero.clientHeight - 64 - copyH - 24, 110) + 'px');
  }
  sizeFilm();
  new ResizeObserver(sizeFilm).observe(hero);
  new ResizeObserver(sizeFilm).observe(heroCopy);
  const F = makeClock();
  const mcells = cellsOf($('#mflap'), 10);
  const CAL = [['Nov', '4'], ['Nov', '11'], ['Nov', '18'], ['Nov', '25'], ['Dec', '2'], ['Dec', '9'], ['Dec', '16'], ['Dec', '18']];
  // The camera follows the caret, so the end of the line stays in shot.
  function followCaret(tk) {
    const pan = $('.pan', tk), line = pan.firstElementChild, cam = $('.cam', tk);
    const over = cam.offsetLeft + line.offsetWidth - innerWidth * 0.86;
    pan.style.transform = `translateX(${-Math.max(0, over)}px)`;
  }
  async function typeInto(tk, text, per) {
    const t = $('.m-text', tk); t.textContent = '';
    for (const ch of graphemes(text)) { t.textContent += ch; followCaret(tk); await F.sleep(ch === ' ' ? per + 55 : per); }
  }
  const TAKES = [
    async (tk, fin) => {
      const text = '498A mein seedha arrest ho sakta hai?';
      $('.m-text', tk).textContent = ''; $('.pan', tk).style.transform = '';
      if (fin) { $('.m-text', tk).textContent = text; return followCaret(tk); }
      await F.sleep(450); await typeInto(tk, text, 55); await F.sleep(1100);
    },
    async (tk, fin) => {
      const s = $('.m-stamp', tk); s.classList.remove('in');
      if (fin) return s.classList.add('in');
      await F.sleep(1400); s.classList.add('in'); await F.sleep(2600);
    },
    async (tk, fin) => {
      flapTo(mcells, fin ? 'BNS 103(1)' : 'IPC 302', true);
      if (fin) return;
      await F.sleep(1200); flapTo(mcells, 'BNS 103(1)', false); await F.sleep(2900);
    },
    async (tk, fin) => {
      const m = $('.m-tile span', tk), d = $('.m-tile b', tk), hl = $('.m-date', tk);
      hl.classList.remove('on'); m.textContent = t('Nov'); d.textContent = '4';
      if (fin) { m.textContent = t('Dec'); d.textContent = '18'; return hl.classList.add('on'); }
      await F.sleep(1000);
      for (const [mm, dd] of CAL.slice(1)) { m.textContent = t(mm); d.textContent = dd; d.classList.remove('flip'); void d.offsetWidth; d.classList.add('flip'); await F.sleep(130); }
      await F.sleep(250); hl.classList.add('on'); await F.sleep(2000);
    },
    async (tk, fin) => {
      const text = 'जैसे सोचते हैं, वैसे पूछिए।';
      $('.m-text', tk).textContent = ''; $('.pan', tk).style.transform = '';
      if (fin) { $('.m-text', tk).textContent = text; return followCaret(tk); }
      await F.sleep(500); await typeInto(tk, text, 80); await F.sleep(1300);
    },
  ];
  const showTake = i => takes.forEach((el, k) => el.classList.toggle('on', k === i));
  async function runFilm() {
    let i = 0;
    try { for (;;) { showTake(i); await TAKES[i](takes[i], false); i = (i + 1) % TAKES.length; } }
    catch (e) { if (e !== ABORT) throw e; }
  }
  if (!view) {
    if (still) {
      const k = Math.min(Math.max(parseInt(qs.get('take') || '1', 10) - 1, 0), TAKES.length - 1); // ?take= is comp-only
      showTake(k); TAKES[k](takes[k], true);
    } else {
      runFilm();
      new IntersectionObserver(([e]) => { F.paused = !e.isIntersecting; film.classList.toggle('paused', F.paused); }, { threshold: 0.05 }).observe($('#hero'));
      document.addEventListener('visibilitychange', () => { F.paused = document.hidden; });
    }
  }

  /* ================= Story: layers stack as you scroll ================= */
  const track = $('#track'), iso = $('#iso'), slabs = $$('.slab', iso), layers = $$('.layer'), storyBar = $('#story-bar'), storyCta = $('#story-cta');
  const N = slabs.length; // five layers and the cap
  let storyK = -1;
  function setStory(k, p) {
    if (k !== storyK) {
      storyK = k;
      slabs.forEach((s, i) => { s.classList.toggle('placed', i <= k); s.classList.toggle('active', i === k && i < N - 1); });
      layers.forEach((l, i) => { l.classList.toggle('on', i === k); $('.lbtn', l).setAttribute('aria-expanded', String(i === k)); });
      iso.classList.toggle('closed', k === N - 1);
      storyCta.classList.toggle('on', k === N - 1);
    }
    storyBar.style.transform = `scaleX(${p})`;
    iso.style.setProperty('--sp', p.toFixed(4));
  }
  function storyFromScroll() {
    const r = track.getBoundingClientRect(), total = r.height - innerHeight;
    const p = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 0;
    setStory(Math.min(N - 1, Math.floor(p * N)), p);
  }
  // A layer button scrolls to that layer's place in the story.
  layers.forEach((l, i) => $('.lbtn', l).addEventListener('click', () => {
    const top = track.getBoundingClientRect().top + scrollY, total = track.offsetHeight - innerHeight;
    scrollTo({ top: top + total * ((i + 0.5) / N), behavior: reduce ? 'auto' : 'smooth' });
  }));
  if (view === 'story') { const k = Math.min(Math.max(parseInt(qs.get('story') || '3', 10) - 1, 0), N - 1); setStory(k, (k + 0.5) / N); }
  else storyFromScroll();

  /* ================= Nav, reveals and scroll ================= */
  const nav = $('#nav');
  let ticking = false;
  function onScroll() {
    ticking = false;
    nav.classList.toggle('solid', scrollY > 24 || !!view);
    if (view !== 'story') storyFromScroll();
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
  const revealIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { threshold: 0.12 });
  $$('.reveal').forEach(el => still || view ? el.classList.add('in') : revealIO.observe(el));

  /* ================= Demo stage player ================= */
  const thread = $('#thread'), composer = $('#composer'), ctext = $('#ctext'), cph = $('#cph'), cchip = $('#cchip'), send = $('#send');
  const tabs = $$('.reel-tab');
  const bars = tabs.map(t => $('.bar i', t));
  const pauseBtn = $('#pause'), stage = $('#stage'), exhibit = $('#exhibit');
  // ff: fast-forward target in ms (comp screenshots and reduced motion); frozen: stopped at that target.
  const P = { token: 0, scene: 0, elapsed: 0, duration: 1, user: false, hover: false, off: false, frozen: false, ff: null };
  const paused = () => P.user || P.hover || P.off || P.frozen;
  const check = t => { if (t !== P.token) throw ABORT; };
  function wait(ms) {
    const t = P.token;
    if (P.ff !== null) {
      if (P.elapsed + ms < P.ff) { P.elapsed += ms; return Promise.resolve().then(() => check(t)); }
      P.elapsed = P.ff; P.ff = null; P.frozen = true;
    }
    return new Promise((resolve, reject) => {
      let left = ms, last = performance.now();
      const tick = now => {
        if (t !== P.token) return reject(ABORT);
        const dt = Math.min(now - last, 64); last = now;
        if (!paused()) { left -= dt; P.elapsed += dt; }
        left <= 0 ? resolve() : requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  const instant = () => P.ff !== null || reduce;
  async function type(text, { per = 42, onChar } = {}) {
    let out = '', i = 0;
    cph.hidden = true; composer.classList.add('typing'); send.classList.add('ready');
    for (const ch of graphemes(text)) {
      out += ch; ctext.textContent = out;
      if (onChar) onChar(out);
      await wait(ch === ' ' ? per + 45 : per + ((i++ * 37) % 5 - 2) * 9);
    }
  }
  function resetComposer() {
    ctext.textContent = ''; cph.hidden = false; cchip.hidden = true;
    send.classList.remove('ready', 'press'); composer.classList.remove('is-mono', 'typing');
  }
  const el = k => thread.querySelector(`[data-s="${k}"]`);
  function follow() { thread.scrollTo({ top: thread.scrollHeight, behavior: instant() ? 'auto' : 'smooth' }); }
  function show(k) {
    const e = el(k); if (!e) return;
    if (e.hidden) { e.hidden = false; void e.offsetWidth; }
    e.classList.add('in'); follow();
  }
  function tokenize(node) {
    const out = [];
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.append(p); return; }
          const s = document.createElement('span'); s.className = 'tk'; s.textContent = p; frag.append(s); out.push(s);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && !c.classList.contains('k')) walk(c);
    });
    walk(node);
    return out;
  }
  async function stream(k, per = 32) {
    const toks = tokenize(el(k));
    show(k);
    for (const t of toks) { t.classList.add('on'); await wait(per); }
    follow();
  }
  function setStatus(text) {
    const st = el('status').querySelector('.st');
    st.textContent = text;
    if (!instant()) st.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  function doneStatus(text) { setStatus(text); el('status').classList.add('done'); }
  function stampOn(k, cardK) {
    el(k).classList.add('in');
    const c = el(cardK); if (!c || instant()) return;
    setTimeout(() => { c.classList.remove('thud'); void c.offsetWidth; c.classList.add('thud'); }, 230);
  }
  async function submit() { send.classList.add('press'); await wait(200); resetComposer(); show('q'); await wait(420); }
  function setThread(html) { thread.innerHTML = html; thread.scrollTop = 0; thread.classList.remove('out'); }
  const I = {
    check: '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    ext: '<svg aria-hidden="true" focusable="false" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>',
    alert: '<svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  };
  const status = text => `<div class="status r" data-s="status" hidden><span class="spinner"></span><span class="okic">${I.check}</span><span class="st">${text}</span></div>`;

  async function research() {
    setThread(`
      <div class="msg-user r" data-s="q" hidden>498A mein seedha arrest ho sakta hai?</div>
      ${status(t('x1.st1'))}
      <div class="answer r" data-s="lead" hidden>${t('x1.lead')}</div>
      <div class="row r" data-s="prov" hidden><span class="k">${t('x1.provK')}</span><span>${t('x1.prov')}</span></div>
      <div class="cite r" data-s="auth" hidden>
        <div class="cite-main"><span class="k">${t('authority')}</span><span class="case-name" lang="en">Arnesh Kumar v. State of Bihar</span><span class="citation">(2014) 8 SCC 273 · <span class="court">${t('x1.court')}</span></span></div>
        <div class="cite-chips"><span class="stamp" data-s="ok">${I.check}${t('checked')}</span><span class="chip chip-link">${t('x1.open')} ${I.ext}</span></div>
      </div>`);
    await wait(700);
    await type('498A mein seedha arrest ho sakta hai?');
    await wait(380); await submit();
    show('status'); await wait(800);
    setStatus(t('x1.st2')); await wait(1000);
    setStatus(t('x1.st3')); await wait(900);
    doneStatus(t('x1.done'));
    await stream('lead', 34); await wait(250);
    await stream('prov', 34);
    el('hl1').classList.add('on'); await wait(500);
    show('auth'); await wait(650);
    stampOn('ok', 'auth');
  }
  async function caseStatus() {
    setThread(`
      <div class="msg-user mono r" data-s="q" hidden><span class="tag">CNR</span>BRPT010024512024</div>
      ${status(t('x2.st'))}
      <div class="record r" data-s="rec" hidden>
        <div class="rec-top"><div class="rec-head"><span class="k">${t('x2.type')}</span><span class="chip chip-muted">${t('x2.sample')}</span></div><div class="case-name">${t('x2.case')}</div><div class="rec-court">${t('x2.court')}</div></div>
        <dl class="rec-rows"><div class="r" data-s="r1"><dt>${t('x2.stageK')}</dt><dd>${t('x2.stage')}</dd></div><div class="r" data-s="r2"><dt>${t('x2.orderK')}</dt><dd>${t('x2.order')}</dd></div></dl>
        <div class="next r" data-s="next"><div class="tile"><span>${t('Nov')}</span><b>4</b></div><div><span class="k">${t('next')}</span><mark class="hl date" data-s="hl2">${t('date')}</mark></div></div>
      </div>`);
    composer.classList.add('is-mono');
    await wait(600);
    await type('BRPT010024512024', { per: 55, onChar: s => { if (s.length === 4) cchip.hidden = false; } });
    await wait(380); await submit();
    show('status'); await wait(1100);
    doneStatus(t('x2.done'));
    show('rec'); await wait(400); show('r1'); await wait(320); show('r2'); await wait(420);
    show('next'); await wait(300);
    const m = el('next').querySelector('.tile span'), d = el('next').querySelector('.tile b');
    for (const [mm, dd] of CAL) {
      m.textContent = t(mm); d.textContent = dd;
      if (!instant()) { d.classList.remove('flip'); void d.offsetWidth; d.classList.add('flip'); }
      await wait(95);
    }
    el('hl2').classList.add('on');
  }
  async function sections() {
    setThread(`
      <div class="msg-user r" data-s="q" lang="hi" hidden>IPC 302 का BNS में कौन-सा सेक्शन है?</div>
      ${status(t('x3.st'))}
      <div class="map r" data-s="map" hidden>
        <div class="sec old"><span class="k">IPC · 1860</span><span class="num">302</span><span class="cap" lang="hi">हत्या के लिए दंड</span></div>
        <svg aria-hidden="true" focusable="false" class="arrow" viewBox="0 0 48 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h42"/><path d="m38 2 6 6-6 6"/></svg>
        <div class="sec new" data-s="new"><span class="k">BNS · 2023</span><span class="flap big" data-s="nflap"></span><span class="cap" lang="hi">हत्या के लिए दंड</span></div>
      </div>
      <div class="row r" data-s="def" lang="hi" hidden><span class="k">परिभाषा</span><span>हत्या की परिभाषा <mark class="hl" data-s="hl3"><b>धारा 101, BNS</b></mark> में है <span class="was">(पहले धारा 300, IPC)</span></span></div>
      <div class="caution r" data-s="warn" lang="hi" hidden>${I.alert}<span><b>ध्यान दें:</b> BNS की धारा 302 अलग अपराध है — धार्मिक भावनाओं को ठेस पहुँचाने के इरादे से कहे गए शब्द। हत्या के लिए इसे न लिखें।</span></div>`);
    const cells = cellsOf(el('nflap'), 6);
    await wait(600);
    await type('IPC 302 का BNS में कौन-सा सेक्शन है?', { per: 60 });
    await wait(380); await submit();
    show('status'); await wait(1000);
    doneStatus(t('x3.done'));
    show('map'); await wait(450);
    el('map').classList.add('go'); await wait(350);
    flapTo(cells, '103(1)', instant()); await wait(instant() ? 0 : 900);
    el('new').classList.add('done'); await wait(450);
    await stream('def', 40);
    el('hl3').classList.add('on'); await wait(600);
    show('warn');
  }
  const SCENES = [{ run: research, dur: 14000 }, { run: caseStatus, dur: 10500 }, { run: sections, dur: 13000 }];
  async function play(i, { freeze = null } = {}) {
    ++P.token;
    Object.assign(P, { scene: i, elapsed: 0, duration: SCENES[i].dur, frozen: false });
    P.ff = freeze === 'end' ? P.duration - 1 : (Number.isFinite(freeze) ? freeze : null);
    tabs.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    try {
      if (P.ff === null && thread.childElementCount) { thread.classList.add('out'); await wait(280); P.elapsed = 0; }
      resetComposer();
      await SCENES[i].run();
      await wait(Math.max(0, P.duration - P.elapsed));
      if (!reduce) play((i + 1) % SCENES.length);
    } catch (e) { if (e !== ABORT) throw e; } // a newer play() took over; this run just stops
  }
  (function frame() {
    bars.forEach((b, k) => {
      const v = reduce ? +(k === P.scene) : k < P.scene ? 1 : k > P.scene ? 0 : Math.min(P.elapsed / P.duration, 1);
      b.style.transform = `scaleX(${v})`;
    });
    requestAnimationFrame(frame);
  })();
  function syncPause() {
    pauseBtn.classList.toggle('is-paused', P.user || P.frozen);
    pauseBtn.setAttribute('aria-pressed', String(P.user));
    pauseBtn.setAttribute('aria-label', t(P.user ? 'pause.play' : 'pause.pause'));
  }
  pauseBtn.addEventListener('click', () => { if (P.frozen) { P.frozen = false; P.user = false; } else P.user = !P.user; syncPause(); });
  tabs.forEach((b, k) => b.addEventListener('click', () => { P.user = false; syncPause(); play(k, reduce ? { freeze: 'end' } : {}); }));
  stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') P.hover = true; });
  stage.addEventListener('pointerleave', () => { P.hover = false; });
  // The demo waits (paused) until it scrolls into view.
  P.off = !view;
  new IntersectionObserver(([e]) => { P.off = !e.isIntersecting; }, { threshold: 0.3 }).observe(exhibit);
  if (reduce) pauseBtn.hidden = true;
  const start = Math.min(Math.max(parseInt(qs.get('scene') || '1', 10) - 1, 0), SCENES.length - 1);
  const at = qs.get('at');
  play(start, { freeze: reduce || at === 'end' ? 'end' : at ? Number(at) : null });

  /* ================= Pointer effects (mouse only) ================= */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !still) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.1; cy += (ty - cy) * 0.1;
      exhibit.style.transform = `perspective(1600px) rotateX(${cx.toFixed(3)}deg) rotateY(${cy.toFixed(3)}deg)`;
      raf = Math.abs(tx - cx) > 0.005 || Math.abs(ty - cy) > 0.005 ? requestAnimationFrame(loop) : 0;
      if (!raf && !tx && !ty) exhibit.style.transform = '';
    };
    exhibit.addEventListener('pointermove', e => {
      const r = exhibit.getBoundingClientRect();
      tx = ((e.clientY - r.top) / r.height - 0.5) * -3; ty = ((e.clientX - r.left) / r.width - 0.5) * 4;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    exhibit.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }

  /* ================= Waitlist forms (dialog and closing block) → POST /api/waitlist ================= */
  // Built in English with data-t keys; apply() then puts them in the page's language.
  const formHTML = p => `
    <form class="wl" novalidate>
      <div class="form-grid">
        <div class="field"><label class="lab" for="${p}-name" data-t="f.name">${EN['f.name']}</label><input class="input" id="${p}-name" name="name" autocomplete="name" maxlength="80" placeholder="${EN['f.namePh']}" data-t-ph="f.namePh" aria-describedby="${p}-e-name"><p class="err" id="${p}-e-name" hidden></p></div>
        <div class="field"><label class="lab" for="${p}-email" data-t="f.email">${EN['f.email']}</label><input class="input" id="${p}-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" maxlength="254" placeholder="you@example.com" aria-describedby="${p}-e-email"><p class="err" id="${p}-e-email" hidden></p></div>
        <div class="field"><label class="lab" for="${p}-wa"><span data-t="f.wa">${EN['f.wa']}</span> <span class="opt" data-t="f.opt">${EN['f.opt']}</span></label><div class="tel"><span class="cc">+91</span><input class="input" id="${p}-wa" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel-national" maxlength="18" placeholder="98765 43210" aria-describedby="${p}-e-wa"></div><p class="err" id="${p}-e-wa" hidden></p></div>
        <fieldset class="field" aria-describedby="${p}-e-role"><legend data-t="f.role">${EN['f.role']}</legend><div class="seg"><label><input type="radio" name="role" value="advocate"><span data-t="f.adv">${EN['f.adv']}</span></label><label><input type="radio" name="role" value="student"><span data-t="f.stu">${EN['f.stu']}</span></label></div><p class="err" id="${p}-e-role" hidden></p></fieldset>
        <button class="btn-primary submit" type="submit"><span data-t="cta.join">${EN['cta.join']}</span><svg aria-hidden="true" focusable="false" class="arw" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg><span class="spin"></span></button>
      </div>
      <input class="hp" type="text" name="ll_check" value="" tabindex="-1" autocomplete="off" data-lpignore="true" data-1p-ignore data-bwignore aria-hidden="true">
      <p class="err form-err" id="${p}-e-form" role="alert" hidden></p>
      <p class="consent"><span data-t="f.consent">${EN['f.consent']}</span> <a href="/privacy" data-t="f.privacy">${EN['f.privacy']}</a></p>
    </form>
    <div class="done" tabindex="-1" hidden>
      <h3 class="done-title"></h3>
      <p class="done-msg"></p>
      <div class="done-actions">
        <a class="btn-ghost share" target="_blank" rel="noopener"></a>
        <span class="stamp stamp-lg"><svg aria-hidden="true" focusable="false" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span class="stamp-text"></span></span>
      </div>
    </div>`;
  const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i; // same rule as api/waitlist.js
  // WhatsApp is optional and Indian: takes 98765 43210, 098765…, 91…, +91…; gives +919876543210.
  // '' = left empty, null = not a valid number. Same rule as api/waitlist.js.
  const toWhatsApp = v => {
    let d = String(v ?? '').replace(/[\s\-().]/g, '');
    if (!d) return '';
    d = d.replace(/^(\+|00)91(?=\d{10}$)/, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
    return /^[6-9]\d{9}$/.test(d) ? '+91' + d : null;
  };
  const hosts = $$('[data-form]');
  let joined = null;
  function showJoined() {
    hosts.forEach(h => {
      $('form', h).hidden = true;
      const d = $('.done', h), first = joined.name.split(' ')[0];
      $('.done-title', d).textContent = t(joined.already ? 'd.old' : 'd.new', { name: first });
      const [before, after = ''] = t(joined.whatsapp ? 'd.mailWa' : 'd.mail').split('{email}');
      const mail = document.createElement('span');
      mail.className = 'mono done-email'; mail.textContent = joined.email;
      $('.done-msg', d).replaceChildren(before, mail, after);
      $('.stamp-text', d).textContent = t(joined.already ? 'st.old' : 'st.new');
      const share = $('.share', d);
      share.textContent = t('d.share');
      share.href = 'https://wa.me/?text=' + encodeURIComponent(t('d.shareText') + SITE + (L === 'hi' ? '/?lang=hi' : ''));
      if (d.hidden) { d.hidden = false; d.classList.add('in'); $('.stamp', d).classList.add('in'); }
    });
  }
  hosts.forEach(h => {
    const p = h.dataset.form;
    h.innerHTML = formHTML(p);
    apply(h);
    const form = $('form', h), nameIn = form.name, emailIn = form.email, waIn = form.whatsapp, segBox = $('.seg', form), formErr = $(`#${p}-e-form`);
    // Errors hold a key, not text, so they can change language while showing.
    const setErr = (input, id, key) => { const e = $('#' + id); e.dataset.k = key || ''; e.textContent = key ? t(key) : ''; e.hidden = !key; input.setAttribute('aria-invalid', key ? 'true' : 'false'); };
    const showFormErr = key => { formErr.dataset.k = key || ''; formErr.textContent = key ? t(key) : ''; formErr.hidden = !key; };
    nameIn.addEventListener('input', () => nameIn.getAttribute('aria-invalid') === 'true' && setErr(nameIn, `${p}-e-name`));
    emailIn.addEventListener('input', () => emailIn.getAttribute('aria-invalid') === 'true' && setErr(emailIn, `${p}-e-email`));
    waIn.addEventListener('input', () => waIn.getAttribute('aria-invalid') === 'true' && setErr(waIn, `${p}-e-wa`));
    segBox.addEventListener('change', () => setErr(segBox, `${p}-e-role`));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = nameIn.value.trim().replace(/\s+/g, ' ');
      const email = emailIn.value.trim().toLowerCase();
      const whatsapp = toWhatsApp(waIn.value);
      const role = form.role.value;
      showFormErr('');
      setErr(nameIn, `${p}-e-name`, name.length < 2 ? 'e.name' : '');
      setErr(emailIn, `${p}-e-email`, EMAIL.test(email) ? '' : 'e.email');
      setErr(waIn, `${p}-e-wa`, whatsapp === null ? 'e.wa' : '');
      setErr(segBox, `${p}-e-role`, role ? '' : 'e.role');
      const bad = form.querySelector('[aria-invalid="true"]');
      if (bad) { (bad === segBox ? $('input', segBox) : bad).focus(); return; }
      const btn = $('.submit', form);
      btn.setAttribute('aria-busy', 'true');
      try {
        let res, data = {};
        try {
          // The bot trap (ll_check) goes to the server, which decides; the browser never drops a sign-up silently.
          res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, whatsapp, role, trap: form.ll_check.value }) });
          data = await res.json().catch(() => ({}));
        } catch { res = null; }
        if (res && res.status === 400 && data.fields) {
          // The server's checks match the ones above; show whatever it caught.
          if (data.fields.name) setErr(nameIn, `${p}-e-name`, 'e.name');
          if (data.fields.email) setErr(emailIn, `${p}-e-email`, 'e.email');
          if (data.fields.whatsapp) setErr(waIn, `${p}-e-wa`, 'e.wa');
          if (data.fields.role) setErr(segBox, `${p}-e-role`, 'e.role');
          return;
        }
        if (!res || !res.ok) return showFormErr(res ? 'e.server' : 'e.offline');
        joined = { name, email, whatsapp, already: data.status === 'exists' };
        showJoined();
        $('.done', h).focus();
      } catch (err) {
        console.error(err);
        showFormErr('e.other');
      } finally {
        btn.removeAttribute('aria-busy');
      }
    });
  });

  /* ================= Dialogs ================= */
  const wl = $('#wl-dlg'), login = $('#login-dlg');
  function openWaitlist() {
    login.close();
    wl.showModal();
    if (!joined) setTimeout(() => $('input[name="name"]', wl).focus(), reduce ? 0 : 200);
  }
  $$('[data-join]').forEach(b => b.addEventListener('click', openWaitlist));
  $('#login').addEventListener('click', () => { $('#dlg-join').hidden = !!joined; login.showModal(); });
  $('#dlg-join').addEventListener('click', openWaitlist);
  $$('dialog').forEach(d => {
    $('[data-close]', d).addEventListener('click', () => d.close());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
  });

  /* ================= Language switch (top bar): English ⇄ हिंदी ================= */
  const langBtns = $$('.lang-b');
  const syncLang = () => langBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === L)));
  function setLang(next) {
    if (next === L) return;
    L = next;
    root.lang = L;
    document.title = L === 'hi' ? HI.title : titleEN;
    apply();
    buildRoll(0);
    syncLang(); syncPause();
    $$('.err').forEach(e => { if (e.dataset.k) e.textContent = t(e.dataset.k); });
    if (joined) showJoined();
    if (!view || view === 'demo') play(P.scene, { freeze: reduce || P.frozen ? 'end' : null }); // the example restarts in the new language
    try { localStorage.setItem('ll_lang', L); } catch {}
    if (!reduce) $$('.hero-copy, .story-head, .layers, .demo-head, .reel, .trust, .close-card, .foot').forEach(n => n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' }));
  }
  if (HI.title) langBtns.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  else $('.lang').hidden = true; // hi.js didn't load: offer English only
  syncLang(); syncPause();
  root.classList.remove('t-wait');
})();
