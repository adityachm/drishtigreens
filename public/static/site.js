// Header, mobile menu, hero slider, project filters and lightbox. Every page works without this file.
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

  // Galleries: category chips and lightbox
  Array.prototype.forEach.call(document.querySelectorAll('[data-gallery]'), function (g) {
    var cards = Array.prototype.slice.call(g.querySelectorAll('.proj'));
    g.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (chip) {
        var cat = chip.getAttribute('data-cat');
        g.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        var n = 0;
        cards.forEach(function (card) {
          var on = cat === 'all' || (cat === 'featured' ? card.getAttribute('data-featured') === '1' : card.getAttribute('data-cat') === cat);
          card.hidden = !on;
          card.classList.remove('enter');
          if (on && !reduce) { void card.offsetWidth; card.style.animationDelay = (n++ * 60) + 'ms'; card.classList.add('enter'); }
        });
        return;
      }
      var open = e.target.closest('.proj-open');
      if (open && open.getAttribute('data-full')) {
        var lb = g.querySelector('dialog.lightbox');
        var img = lb.querySelector('img');
        img.src = open.getAttribute('data-full');
        img.alt = open.getAttribute('data-alt') || '';
        lb.querySelector('h3').textContent = open.getAttribute('data-title') || '';
        lb.querySelector('p').textContent = open.getAttribute('data-caption') || '';
        if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
      }
    });
    var lb = g.querySelector('dialog.lightbox');
    if (lb) {
      lb.querySelector('.lb-close').addEventListener('click', function () { lb.close ? lb.close() : lb.removeAttribute('open'); });
      lb.addEventListener('click', function (e) { if (e.target === lb && lb.close) lb.close(); });
    }
  });
})();
