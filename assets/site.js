/* Cricketers Academy, shared interactions */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    /* ---- mobile nav toggle ---- */
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        links.classList.toggle('open');
      });
    }

    /* ---- accordion ---- */
    document.querySelectorAll('[data-accordion]').forEach(function (acc) {
      var items = acc.querySelectorAll('.acc-item');
      items.forEach(function (item) {
        var head = item.querySelector('.acc-head');
        var body = item.querySelector('.acc-body');
        if (!head || !body) return;
        head.addEventListener('click', function () {
          var isOpen = item.classList.contains('open');
          items.forEach(function (o) {
            o.classList.remove('open');
            var b = o.querySelector('.acc-body');
            if (b) b.style.maxHeight = null;
          });
          if (!isOpen) {
            item.classList.add('open');
            body.style.maxHeight = body.scrollHeight + 'px';
          }
        });
      });
      // open first by default
      var first = acc.querySelector('.acc-item');
      if (first) {
        first.classList.add('open');
        var fb = first.querySelector('.acc-body');
        if (fb) fb.style.maxHeight = fb.scrollHeight + 'px';
      }
    });

    /* ---- carousel ---- */
    document.querySelectorAll('[data-carousel]').forEach(function (car) {
      var track = car.querySelector('.car-track');
      var slides = car.querySelectorAll('.car-slide');
      var prev = car.querySelector('[data-car-prev]');
      var next = car.querySelector('[data-car-next]');
      var dotsWrap = car.querySelector('[data-car-dots]');
      var i = 0;
      var dots = [];
      if (dotsWrap) {
        slides.forEach(function (_, idx) {
          var d = document.createElement('button');
          d.className = 'car-dot';
          d.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
          d.addEventListener('click', function () { go(idx); });
          dotsWrap.appendChild(d);
          dots.push(d);
        });
      }
      function go(n) {
        i = (n + slides.length) % slides.length;
        track.style.transform = 'translateX(' + (-i * 100) + '%)';
        dots.forEach(function (d, idx) { d.classList.toggle('active', idx === i); });
      }
      if (prev) prev.addEventListener('click', function () { go(i - 1); });
      if (next) next.addEventListener('click', function () { go(i + 1); });
      go(0);
      // auto-advance
      var timer = setInterval(function () { go(i + 1); }, 6500);
      car.addEventListener('mouseenter', function () { clearInterval(timer); });
    });

    /* ---- tabs ---- */
    document.querySelectorAll('[data-tabs]').forEach(function (tabs) {
      var btns = tabs.querySelectorAll('[data-tab]');
      // panels may live outside the [data-tabs] element; prefer an explicit
      // [data-tab-panels] container, otherwise fall back to the document.
      var panelScope = document.querySelector('[data-tab-panels]') || document;
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var key = btn.getAttribute('data-tab');
          btns.forEach(function (b) { b.classList.toggle('active', b === btn); });
          panelScope.querySelectorAll('[data-panel]').forEach(function (p) {
            p.classList.toggle('active', p.getAttribute('data-panel') === key);
          });
          var anchor = tabs.querySelector('[data-tab-anchor]');
          if (anchor) {
            var top = anchor.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        });
      });
    });

    /* ---- reveal on scroll ---- */
    var revs = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revs.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      revs.forEach(function (el) { io.observe(el); });
    } else {
      revs.forEach(function (el) { el.classList.add('in'); });
    }

    /* ---- count-up numbers ("275+" counts 0→275, keeps the suffix) ---- */
    var counters = document.querySelectorAll('.stat-val, [data-count]');
    function runCount(el) {
      var m = (el.textContent || '').trim().match(/^(\d+)(.*)$/);
      if (!m) return;
      var end = +m[1], suffix = m[2], t0 = null, dur = 1300;
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
      function frame(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if ('IntersectionObserver' in window && counters.length) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }

    /* ---- form validation ---- */
    document.querySelectorAll('[data-validate]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        form.querySelectorAll('[required]').forEach(function (input) {
          var field = input.closest('.field');
          var valid = input.value.trim() !== '';
          if (input.type === 'email') valid = valid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
          if (field) field.classList.toggle('invalid', !valid);
          input.classList.toggle('err', !valid);
          if (!valid) ok = false;
        });
        if (ok) {
          var success = (form.closest('.form-card') || form.parentElement || document).querySelector('.form-success');
          if (success) {
            success.classList.add('show');
            success.scrollIntoView ? null : null;
          }
          form.querySelectorAll('input,textarea,select').forEach(function (el) {
            if (el.type !== 'submit') el.value = '';
          });
        }
      });
      form.querySelectorAll('input,textarea,select').forEach(function (el) {
        el.addEventListener('input', function () {
          var field = el.closest('.field');
          if (field && field.classList.contains('invalid')) {
            field.classList.remove('invalid');
            el.classList.remove('err');
          }
        });
      });
    });
  });
})();
