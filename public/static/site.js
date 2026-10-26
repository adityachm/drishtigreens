// Header, section highlighting in the menu, hero slider, service details and the gallery lightbox.
// The page still works without this file: links scroll to sections and the form posts normally.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', function () { header.classList.toggle('scrolled', window.scrollY > 10); }, { passive: true });
  }

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Menu: highlight the section currently in view
  var navLinks = {};
  Array.prototype.forEach.call(document.querySelectorAll('#nav a[data-section]'), function (a) { navLinks[a.getAttribute('data-section')] = a; });
  var spied = Object.keys(navLinks).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (spied.length && 'IntersectionObserver' in window) {
    var setActive = function (id) {
      Object.keys(navLinks).forEach(function (k) {
        navLinks[k].classList.toggle('active', k === id);
        if (k === id) navLinks[k].setAttribute('aria-current', 'true'); else navLinks[k].removeAttribute('aria-current');
      });
    };
    // A section counts as current when it crosses the middle of the screen.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spied.forEach(function (el) { io.observe(el); });
  }

  // Services: "Learn more" opens the full description
  var svcModal = document.querySelector('dialog.svc-modal');
  if (svcModal) {
    var svcBody = svcModal.querySelector('.svc-modal-body');
    var lastOpener = null;
    document.addEventListener('click', function (e) {
      var opener = e.target.closest('[data-service]');
      if (opener) {
        var tpl = document.querySelector('template[data-service-body="' + opener.getAttribute('data-service') + '"]');
        if (!tpl) return;
        svcBody.textContent = '';
        svcBody.appendChild(tpl.content.cloneNode(true));
        lastOpener = opener;
        if (svcModal.showModal) svcModal.showModal(); else svcModal.setAttribute('open', '');
        return;
      }
      var closer = e.target.closest('[data-close-service]');
      if (closer && svcModal.contains(closer)) svcModal.close ? svcModal.close() : svcModal.removeAttribute('open');
    });
    svcModal.querySelector('.svc-modal-close').addEventListener('click', function () { svcModal.close ? svcModal.close() : svcModal.removeAttribute('open'); });
    svcModal.addEventListener('click', function (e) { if (e.target === svcModal && svcModal.close) svcModal.close(); });
    svcModal.addEventListener('close', function () { if (lastOpener && document.activeElement === document.body) lastOpener.focus({ preventScroll: true }); });
  }

  // Hero slider
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero .slide'));
  if (slides.length > 1) {
    var cur = document.querySelector('[data-hero="cur"]');
    var bar = document.querySelector('[data-hero="bar"]');
    var idx = 0, timer = null;
    var show = function (i) {
      slides[idx].classList.remove('active');
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add('active');
      // Later slides load lazily; start fetching as soon as one is about to show.
      var img = slides[idx].querySelector('img');
      if (img) img.loading = 'eager';
      if (cur) cur.textContent = String(idx + 1).padStart(2, '0');
      restart();
    };
    var restart = function () {
      clearTimeout(timer);
      if (!bar) return;
      bar.classList.remove('run'); void bar.offsetWidth;
      if (reduce) return;
      bar.classList.add('run');
      timer = setTimeout(function () { show(idx + 1); }, 6500);
    };
    document.querySelector('[data-hero="prev"]').addEventListener('click', function () { show(idx - 1); });
    document.querySelector('[data-hero="next"]').addEventListener('click', function () { show(idx + 1); });
    restart();
  }

  // Gallery lightbox
  Array.prototype.forEach.call(document.querySelectorAll('[data-gallery]'), function (g) {
    var lb = g.querySelector('dialog.lightbox');
    if (!lb) return;
    g.addEventListener('click', function (e) {
      var open = e.target.closest('.proj-open');
      if (!open || !open.getAttribute('data-full')) return;
      var img = lb.querySelector('img');
      img.src = open.getAttribute('data-full');
      img.alt = open.getAttribute('data-alt') || '';
      lb.querySelector('p').textContent = open.getAttribute('data-caption') || '';
      if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
    });
    lb.querySelector('.lb-close').addEventListener('click', function () { lb.close ? lb.close() : lb.removeAttribute('open'); });
    lb.addEventListener('click', function (e) { if (e.target === lb && lb.close) lb.close(); });
  });
})();
