(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // header border once the page scrolls
  var hdr = document.querySelector('header.site');
  function onScrollHdr() { if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 20); }
  addEventListener('scroll', onScrollHdr, { passive: true }); onScrollHdr();

  if (!reduce && 'IntersectionObserver' in window) {
    // reveals: only elements that start below the fold get hidden, so the first frame is complete
    var vh = innerHeight;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove('pre'); e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.16 });
    document.querySelectorAll('.reveal, .visit').forEach(function (el) {
      if (el.getBoundingClientRect().top > vh * 0.9) { el.classList.add('pre'); io.observe(el); }
      else el.classList.add('in');
    });

    // gentle parallax on framed portraits
    var pel = [].slice.call(document.querySelectorAll('[data-parallax]'));
    var ticking = false;
    function px() {
      var h = innerHeight;
      pel.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var off = r.top + r.height / 2 - h / 2;
        el.style.transform = 'translateY(' + (off * -parseFloat(el.dataset.parallax)) + 'px)';
      });
      ticking = false;
    }
    if (pel.length) { addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(px); ticking = true; } }, { passive: true }); px(); }

    // Moe wanders in from an edge now and then as you scroll
    var moe = document.getElementById('moe-roam');
    if (moe) {
      var last = 0, busy = false;
      addEventListener('scroll', function () {
        var y = window.scrollY;
        if (busy || Math.abs(y - last) < 1400) return;
        last = y; busy = true;
        var side = Math.random() < 0.5 ? 'left' : 'right';
        moe.className = 'moe-roam ' + side;
        moe.style.bottom = (18 + Math.round(Math.random() * 40)) + 'vh';
        requestAnimationFrame(function () { requestAnimationFrame(function () { moe.classList.add('out'); }); });
        setTimeout(function () { moe.classList.remove('out'); setTimeout(function () { busy = false; }, 800); }, 2600);
      }, { passive: true });
    }
  }

  // Let's talk form: handled on the page until it's connected to the CRM
  var form = document.getElementById('talk-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var missing = [].filter.call(form.querySelectorAll('[required]'), function (el) { return !el.value.trim(); });
      if (missing.length) { missing[0].focus(); return; }
      form.hidden = true;
      var t = document.getElementById('talk-thanks'); t.hidden = false; t.scrollIntoView({ block: 'start' });
    });
  }
})();
