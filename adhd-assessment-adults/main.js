(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header state, nav, back to top ---------- */
  var header = document.querySelector('.site-header');
  var toTop = document.querySelector('.to-top');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 60);
    toTop.classList.toggle('is-visible', y > 900);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  /* ---------- Hero video ---------- */
  var heroVideo = document.querySelector('.hero-video');
  var videoToggle = document.querySelector('.video-toggle');
  if (heroVideo && videoToggle) {
    var setPaused = function (paused) {
      videoToggle.classList.toggle('is-paused', paused);
      videoToggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
    };
    videoToggle.hidden = false;
    heroVideo.addEventListener('play', function () { setPaused(false); });
    heroVideo.addEventListener('pause', function () { setPaused(true); });
    videoToggle.addEventListener('click', function () {
      if (heroVideo.paused) heroVideo.play(); else heroVideo.pause();
    });
    setPaused(true);
    if (!reduceMotion) {
      var attempt = heroVideo.play();
      if (attempt && attempt.catch) attempt.catch(function () { setPaused(true); });
    }
  }

  /* ---------- qEEG video: plays muted while in view ---------- */
  var qVideo = document.querySelector('.qeeg-video');
  if (qVideo) {
    var qPlay = document.querySelector('[data-vid-play]');
    var qSound = document.querySelector('[data-vid-sound]');
    var userPaused = false;
    qVideo.addEventListener('play', function () { qPlay.classList.add('is-playing'); qPlay.setAttribute('aria-label', 'Pause video'); });
    qVideo.addEventListener('pause', function () { qPlay.classList.remove('is-playing'); qPlay.setAttribute('aria-label', 'Play video'); });
    qPlay.addEventListener('click', function () {
      userPaused = !qVideo.paused;
      if (qVideo.paused) qVideo.play(); else qVideo.pause();
    });
    qSound.addEventListener('click', function () {
      qVideo.muted = !qVideo.muted;
      qSound.classList.toggle('is-on', !qVideo.muted);
      qSound.setAttribute('aria-pressed', String(!qVideo.muted));
      qSound.setAttribute('aria-label', qVideo.muted ? 'Turn sound on' : 'Turn sound off');
      if (!qVideo.muted && qVideo.paused) { userPaused = false; qVideo.play(); }
    });
    if (!reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !userPaused) {
            var attempt = qVideo.play();
            if (attempt && attempt.catch) attempt.catch(function () {});
          } else if (!e.isIntersecting) {
            qVideo.pause();
          }
        });
      }, { threshold: 0.4 }).observe(qVideo);
    }
  }

  var nav = document.getElementById('main-nav');
  var toggle = document.querySelector('.menu-toggle');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Highlight the section in view
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var t = document.querySelector(a.getAttribute('href')); if (t) spy.observe(t); });
  }

  /* ---------- EEG traces ---------- */
  function eegPath(width, height, points, seed, spikes) {
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    var mid = height / 2, d = 'M0,' + mid.toFixed(1);
    for (var i = 1; i <= points; i++) {
      var x = (i / points) * width;
      var amp = (Math.sin(i * 0.35) * 0.5 + 0.6) * (height * 0.22);
      if (spikes && rnd() > 0.93) amp = height * 0.46;
      var y = mid + (i % 2 ? -1 : 1) * amp * (0.4 + rnd() * 0.6);
      d += ' L' + x.toFixed(1) + ',' + y.toFixed(1);
    }
    return d;
  }
  var miniEeg = document.getElementById('eeg-mini');
  if (miniEeg) miniEeg.setAttribute('d', eegPath(400, 46, 90, 3, true));

  /* ---------- Carousels ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('.carousel-track');
    var items = Array.prototype.slice.call(track.children);
    var dotsWrap = root.querySelector('[data-dots]');
    var delay = parseInt(root.getAttribute('data-autoplay'), 10) || 0;
    var timer = null, paused = false;

    function step() { return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth; }
    function index() { return Math.round(track.scrollLeft / step()); }
    function maxIndex() { return Math.max(0, Math.round((track.scrollWidth - track.clientWidth) / step())); }
    function go(i) {
      var max = maxIndex();
      if (i > max) i = 0;
      if (i < 0) i = max;
      track.scrollTo({ left: i * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    var dots = [];
    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      dots = [];
      for (var i = 0; i <= maxIndex(); i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.addEventListener('click', go.bind(null, i));
        dotsWrap.appendChild(b);
        dots.push(b);
      }
      syncDots();
    }
    function syncDots() {
      var cur = index();
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
    }

    root.querySelector('[data-prev]').addEventListener('click', function () { go(index() - 1); });
    root.querySelector('[data-next]').addEventListener('click', function () { go(index() + 1); });
    var raf;
    track.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(syncDots); }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index() - 1); }
    });

    function start() { if (delay && !reduceMotion && !timer) timer = setInterval(function () { if (!paused) go(index() + 1); }, delay); }
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { root.addEventListener(ev, function () { paused = true; }, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { root.addEventListener(ev, function () { paused = false; }); });

    buildDots();
    window.addEventListener('resize', buildDots);
    if (delay && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) start(); else { clearInterval(timer); timer = null; } });
      }).observe(root);
    }
  });

  /* ---------- Review "read more" ---------- */
  function checkClamps() {
    document.querySelectorAll('.review-card').forEach(function (card) {
      var text = card.querySelector('.review-text');
      var btn = card.querySelector('.read-more');
      if (card.classList.contains('is-expanded')) return;
      btn.hidden = text.scrollHeight <= text.clientHeight + 2;
    });
  }
  document.querySelectorAll('.review-card .read-more').forEach(function (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var card = btn.closest('.review-card');
      var open = card.classList.toggle('is-expanded');
      btn.textContent = open ? 'Read less' : 'Read more';
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  window.addEventListener('load', checkClamps);
  window.addEventListener('resize', checkClamps);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(checkClamps);

  /* ---------- Signs checklist ---------- */
  var signList = document.querySelector('[data-signs]');
  if (signList) {
    var result = document.querySelector('[data-sign-result]');
    var total = signList.querySelectorAll('button').length;
    signList.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      var n = signList.querySelectorAll('[aria-pressed="true"]').length;
      if (n === 0) result.textContent = 'Nothing selected yet.';
      else if (n < 3) result.innerHTML = 'You recognised <strong>' + n + ' of ' + total + '</strong>. If these are affecting your life, it is worth a conversation.';
      else result.innerHTML = 'You recognised <strong>' + n + ' of ' + total + '</strong>. A specialist assessment could help you understand why. Talk it through with us, free.';
    });
  }

  /* ---------- Framework panels ---------- */
  var fw = document.querySelector('[data-framework]');
  if (fw) {
    var fwPanels = Array.prototype.slice.call(fw.querySelectorAll('.fw-panel'));
    var activate = function (panel) {
      fwPanels.forEach(function (p) {
        var on = p === panel;
        p.classList.toggle('is-active', on);
        p.querySelector('.fw-trigger').setAttribute('aria-expanded', String(on));
      });
    };
    fwPanels.forEach(function (p) {
      p.querySelector('.fw-trigger').addEventListener('click', function () { activate(p); });
      p.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover) and (min-width: 901px)').matches) activate(p); });
    });
  }

  /* ---------- Assessment tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs .tab'));
  var stepImgs = document.querySelectorAll('[data-step-img]');
  var caption = document.querySelector('[data-step-caption]');
  function selectTab(i, focus) {
    tabs.forEach(function (t, j) {
      var on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    stepImgs.forEach(function (img) { img.classList.toggle('is-active', img.getAttribute('data-step-img') === String(i)); });
    if (caption) caption.textContent = tabs[i].getAttribute('data-caption');
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') selectTab((i + 1) % tabs.length, true);
      if (e.key === 'ArrowLeft') selectTab((i - 1 + tabs.length) % tabs.length, true);
    });
  });

  /* ---------- Accordion ---------- */
  document.querySelectorAll('[data-accordion] .acc-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.acc-item');
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Offer countdown ---------- */
  var cd = document.querySelector('[data-countdown]');
  if (cd) {
    var end = new Date(cd.getAttribute('data-countdown')).getTime();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var tick = function () {
      var ms = Math.max(0, end - Date.now());
      var m = Math.floor(ms / 60000);
      cd.querySelector('[data-d]').textContent = pad(Math.floor(m / 1440));
      cd.querySelector('[data-h]').textContent = pad(Math.floor((m % 1440) / 60));
      cd.querySelector('[data-m]').textContent = pad(m % 60);
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- Image reveals and parallax ---------- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal-img').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal-img').forEach(function (el) { el.classList.add('is-in'); });
  }
  var par = document.querySelector('[data-parallax]');
  if (par && !reduceMotion) {
    var parTick = function () {
      var r = par.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        par.style.transform = 'translate3d(0,' + (p * -6).toFixed(2) + '%,0)';
      }
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(parTick); }, { passive: true });
    parTick();
  }

  /* ---------- Booking form ---------- */
  var form = document.getElementById('booking-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var messages = {
      first_name: 'Enter your first name.',
      last_name: 'Enter your last name.',
      email: 'Enter an email address like name@example.com.',
      phone: 'Enter a phone number so we can call you.',
      source: 'Choose how you heard about us.'
    };
    function validate(el) {
      var field = el.closest('.field');
      if (!field) return el.checkValidity();
      var ok = el.checkValidity();
      if (ok && el.type === 'tel') ok = el.value.replace(/[^\d]/g, '').length >= 10;
      field.classList.toggle('has-error', !ok);
      field.querySelector('.err').textContent = ok ? '' : messages[el.name] || 'Check this field.';
      el.setAttribute('aria-invalid', String(!ok));
      return ok;
    }
    form.querySelectorAll('input[required], select[required]').forEach(function (el) {
      el.addEventListener('blur', function () { if (el.value) validate(el); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = Array.prototype.slice.call(form.querySelectorAll('.field input[required], .field select[required]'));
      var firstBad = null;
      fields.forEach(function (el) { if (!validate(el) && !firstBad) firstBad = el; });
      var consent = form.querySelector('input[name="consent"]');
      status.hidden = true;
      if (firstBad) { firstBad.focus(); return; }
      if (!consent.checked) {
        status.className = 'form-status is-error';
        status.textContent = 'Tick the box to let us contact you about your enquiry.';
        status.hidden = false;
        consent.focus();
        return;
      }

      // The form is not connected to a CRM yet. Set data-endpoint on the form to a URL that accepts JSON.
      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) {
        status.className = 'form-status is-info';
        status.innerHTML = 'Online requests are being set up. To book your free call now, ring <a href="tel:+441614707093">0161 470 7093</a> or email <a href="mailto:hello@refocushub.co.uk">hello@refocushub.co.uk</a>.';
        status.hidden = false;
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending…';
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.page = location.href;
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
          status.className = 'form-status is-ok';
          status.textContent = 'Thank you. Your request has been sent and our team will be in touch to arrange your call.';
        })
        .catch(function () {
          status.className = 'form-status is-error';
          status.innerHTML = 'Your request could not be sent. Please try again, or call us on <a href="tel:+441614707093">0161 470 7093</a>.';
        })
        .then(function () {
          status.hidden = false;
          btn.disabled = false;
          btn.textContent = 'Request my free call';
        });
    });
  }
})();
