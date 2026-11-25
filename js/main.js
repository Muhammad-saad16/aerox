/* Aerox ERP — site behaviour (v2): nav, reveal, active section, demo form */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* nav: solid on scroll, mobile panel */
  const nav = $('#nav'), btn = $('#menuBtn');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const setMenu = open => { nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
  btn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('#mobilePanel a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* active nav link */
  const links = $$('.nav-links a');
  const so = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'projects', 'services', 'founder', 'event', 'contact'].forEach(id => { const s = document.getElementById(id); if (s) so.observe(s); });

  /* service card spotlight follows pointer */
  $$('.svc').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* demo form: no backend, so compose an email */
  const form = $('#demoForm'), note = $('#formNote');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    const bad = !f.name.trim() ? 'f-name' : !/^\S+@\S+\.\S+$/.test(f.email) ? 'f-email' : null;
    if (bad) { note.textContent = bad === 'f-name' ? 'Please add your name.' : 'Please add a valid email.'; note.style.color = 'var(--amber)'; $('#' + bad).focus(); return; }
    const body = `Name: ${f.name}\nOrganisation: ${f.org || '-'}\nEmail: ${f.email}\nArea: ${f.topic}\n\n${f.msg || ''}`;
    location.href = `mailto:aeroxerp@gmail.com?subject=${encodeURIComponent('Demo request: ' + f.topic)}&body=${encodeURIComponent(body)}`;
    note.textContent = 'Your email app should open now. If not, write to aeroxerp@gmail.com.'; note.style.color = '';
  });

  $('#yr').textContent = new Date().getFullYear();
})();
