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

  /* ---------- motion layer (GSAP + Lenis), skipped for reduced motion ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2 || !document.querySelector(id)) return;
      e.preventDefault(); lenis.scrollTo(id === '#top' ? 0 : id, { offset: id === '#top' ? 0 : -72 });
    }));
  }

  const mm = gsap.matchMedia();

  /* hero copy lifts away as the camera dives to the ground (desktop sticky hero) */
  mm.add('(min-width: 761px)', () => {
    gsap.to('#heroCopy', {
      yPercent: -18, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero-pin', start: 'top top', end: '30% top', scrub: true }
    });
    gsap.to('.scroll-cue', { opacity: 0, scrollTrigger: { trigger: '.hero-pin', start: 'top top', end: '15% top', scrub: true } });
  });

  /* cinematic band: frame opens, image settles, words light up in sequence */
  const band = gsap.timeline({ scrollTrigger: { trigger: '#band', start: 'top 85%', end: 'bottom 40%', scrub: 0.6 } });
  band.to('.band-media', { clipPath: 'inset(0% 0% round 0px)', ease: 'none' }, 0)
      .to('.band-media img', { scale: 1, ease: 'none' }, 0)
      .to('.band-line span', { opacity: 1, stagger: 0.15, ease: 'none' }, 0.1);

  /* project plates rise in with a 3D tilt */
  $$('.plate').forEach(p => gsap.from(p, {
    rotateX: 16, y: 90, scale: 0.94, opacity: 0, transformPerspective: 1400, transformOrigin: '50% 100%',
    ease: 'power2.out',
    scrollTrigger: { trigger: p, start: 'top 95%', end: 'top 55%', scrub: 0.6 }
  }));

  /* parallax inside service images */
  $$('.svc-media img').forEach(img => gsap.fromTo(img, { yPercent: -8 }, {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
  }));

  /* signal line in the program chain draws across */
  gsap.from('.chain-line', { scaleX: 0, transformOrigin: '0 50%', ease: 'none',
    scrollTrigger: { trigger: '.chain', start: 'top 85%', end: 'top 45%', scrub: true } });

  /* pointer tilt on cards (fine pointers only) */
  if (matchMedia('(pointer: fine)').matches) {
    $$('.svc, .build-card').forEach(el => {
      const max = el.classList.contains('build-card') ? 10 : 5;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(1000px) rotateX(${-y * max}deg) rotateY(${x * max}deg) translateZ(0)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
})();
