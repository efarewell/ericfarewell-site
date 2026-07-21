// Eric Farewell site — shared behaviour
(function () {
  var docEl = document.documentElement;

  // Header background on scroll
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  var mobile = document.querySelector('.mobile-menu');
  var closeBtn = document.querySelector('.mobile-close');
  function setMenu(open) {
    if (!mobile) return;
    mobile.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
  if (mobile) mobile.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  // Video testimonials — click-to-play facade (avoids preloading large files)
  document.querySelectorAll('.vtst-player').forEach(function (player) {
    player.addEventListener('click', function () {
      var src = player.getAttribute('data-src');
      if (!src || player.dataset.playing) return;
      player.dataset.playing = '1';
      var v = document.createElement('video');
      v.src = src;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.preload = 'auto';
      player.innerHTML = '';
      player.appendChild(v);
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  });

  // Reveal on scroll — only enable if the page is genuinely scrollable and IO exists.
  var reveals = document.querySelectorAll('.reveal');
  function revealAll() { reveals.forEach(function (el) { el.classList.add('in'); }); }
  var scrollable = document.documentElement.scrollHeight > window.innerHeight + 140;

  if (reveals.length && scrollable && 'IntersectionObserver' in window) {
    docEl.classList.add('can-animate'); // now CSS hides them; we reveal as they enter
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = Math.min((i % 4) * 90, 270) + 'ms';
      io.observe(el);
    });
    // Failsafe: if anything hasn't revealed within 3s, show it.
    setTimeout(revealAll, 3000);
  } else {
    // Not scrollable (preview/short page) or no IO: leave everything visible.
    revealAll();
  }
})();
