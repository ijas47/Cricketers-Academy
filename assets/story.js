/* ============================================================
   Cricketers Academy · home orchestration
   - Three.js   : painted texture backdrop that reacts to the cursor
   - Lenis      : smooth scroll
   - GSAP + ScrollTrigger : sections reveal on scroll; the backdrop colour
     follows the active section (light sections vs the dark feature bands)
   - Splitting  : the hero title arrives letter by letter on load
   Degrades gracefully without WebGL and respects reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- tiny colour helpers (no library dependency) ---------- */
  function parseHex(hex) {
    hex = (hex || '#000').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
  }
  function rgba(hex, a) {
    var c = parseHex(hex);
    return 'rgba(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255) + ',' + a + ')';
  }

  /* ---------- DOM refs ---------- */
  var bgStage = document.getElementById('bg-stage');
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-chapter]'));

  function stageGradient(bg, ac) {
    bgStage.style.background =
      'radial-gradient(120% 90% at 78% 12%,' + rgba(ac, 0.18) + ', transparent 55%),' +
      'radial-gradient(120% 120% at 12% 88%,' + rgba(ac, 0.06) + ', transparent 60%),' + bg;
  }

  /* ============================================================
     1 · THREE.JS — painted texture backdrop reacting to the cursor
     ============================================================ */
  var gl = null; // { renderer, scene, camera, uniforms, render }

  function initThree() {
    if (prefersReduced || typeof THREE === 'undefined') return null;
    try {
      // keep hand-picked hex predictable (guard: absent before r150, renamed across versions)
      if (THREE.ColorManagement) THREE.ColorManagement.enabled = false;

      var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight);
      bgStage.appendChild(renderer.domElement);

      var scene = new THREE.Scene();
      var camera = new THREE.Camera(); // we write clip-space directly in the vertex shader

      var hero = chapters[0];
      var bg0 = parseHex(hero ? hero.dataset.bg : '#0B0C0A');
      var ac0 = parseHex(hero ? hero.dataset.accent : '#C7E63A');

      var uniforms = {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseStr: { value: 0 },
        uBg: { value: new THREE.Color(bg0.r, bg0.g, bg0.b) },
        uAccent: { value: new THREE.Color(ac0.r, ac0.g, ac0.b) }
      };

      var vert = [
        'varying vec2 vUv;',
        'void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
      ].join('\n');

      var frag = [
        // (ShaderMaterial prepends the precision declaration for us)
        'varying vec2 vUv;',
        'uniform vec2 uRes; uniform float uTime;',
        'uniform vec2 uMouse; uniform float uMouseStr;',
        'uniform vec3 uBg; uniform vec3 uAccent;',
        'float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
        'float noise(vec2 p){ vec2 i=floor(p), f=fract(p);',
        '  float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));',
        '  vec2 u=f*f*(3.-2.*f); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }',
        'float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);',
        '  for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }',
        'void main(){',
        '  vec2 uv=vUv; float aspect=uRes.x/uRes.y;',
        '  vec2 p=uv; p.x*=aspect; vec2 m=uMouse; m.x*=aspect;',
        '  float t=uTime*0.05;',
        '  vec2 q=vec2(fbm(p+vec2(0.,t)), fbm(p+vec2(5.2,1.3)+t));',
        '  vec2 toM=m-p; float md=length(toM);',
        '  float pull=uMouseStr*exp(-md*2.2);',         // the paint flows toward the cursor
        '  q += toM*pull*0.7;',
        '  vec2 r=vec2(fbm(p+1.8*q+vec2(1.7,9.2)), fbm(p+1.8*q+vec2(8.3,2.8)+t*1.3));',
        '  float f=fbm(p+2.2*r);',
        '  float strokes=0.5+0.5*sin((r.x+r.y)*3.14159 + f*5.0);', // brush banding
        '  f=mix(f, f*strokes, 0.35);',
        '  float L=clamp(dot(uBg, vec3(0.299,0.587,0.114)),0.0,1.0);', // bg luminance: tune light vs dark
        '  vec3 col=mix(uBg, uAccent, smoothstep(0.30,0.95,f)*mix(0.6,0.42,L));',
        '  col=mix(col, uBg*mix(0.55,0.97,L), smoothstep(0.5,0.0,f)*(1.0-L)*0.55);',
        '  float glow=exp(-md*3.5)*uMouseStr;',          // soft accent light at the cursor
        '  col += uAccent*glow*mix(0.5,0.34,L);',
        '  col += uAccent*pow(strokes,3.0)*0.05*(1.0-0.6*L);',
        '  float vig=smoothstep(1.25,0.35,length(uv-0.5));',
        '  col*=mix( mix(0.82,1.0,vig), mix(0.965,1.0,vig), L );', // strong vignette on dark, faint on light
        '  float g=hash(uv*uRes*0.5+fract(uTime))*2.0-1.0; col+=g*mix(0.025,0.012,L);', // film grain
        '  gl_FragColor=vec4(col,1.0);',
        '}'
      ].join('\n');

      var mat = new THREE.ShaderMaterial({ uniforms: uniforms, vertexShader: vert, fragmentShader: frag });
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

      /* cursor tracking — smoothed, with strength that eases on movement */
      var target = { x: 0.5, y: 0.5 }, curr = { x: 0.5, y: 0.5 }, curStr = 0, lastMove = -9999;
      function onMove(x, y) {
        target.x = x / window.innerWidth;
        target.y = 1 - y / window.innerHeight; // match plane uv (v up)
        lastMove = performance.now();
      }
      window.addEventListener('pointermove', function (e) { onMove(e.clientX, e.clientY); }, { passive: true });
      window.addEventListener('touchmove', function (e) {
        if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });

      function render(timeSec) {
        if (document.hidden) return;
        uniforms.uTime.value = timeSec;
        curr.x += (target.x - curr.x) * 0.08;
        curr.y += (target.y - curr.y) * 0.08;
        uniforms.uMouse.value.set(curr.x, curr.y);
        var strTarget = (performance.now() - lastMove < 160) ? 1 : 0;
        curStr += (strTarget - curStr) * 0.05;
        uniforms.uMouseStr.value = curStr;
        renderer.render(scene, camera);
      }

      function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
      }
      window.addEventListener('resize', resize);

      return { renderer: renderer, uniforms: uniforms, render: render };
    } catch (err) {
      return null; // any WebGL failure → CSS-gradient fallback
    }
  }

  gl = initThree();

  /* ============================================================
     2 · SECTION BACKGROUND COLOUR — the painted backdrop follows the
        active section (light sections vs the dark feature bands)
     ============================================================ */
  var current = -1;
  function setActive(idx) {
    if (idx === current) return;
    current = idx;
    var ch = chapters[idx];
    if (!ch) return;
    var bg = ch.dataset.bg, ac = ch.dataset.accent;
    if (gl) {
      var b = parseHex(bg), a = parseHex(ac);
      if (window.gsap) {
        gsap.to(gl.uniforms.uBg.value, { r: b.r, g: b.g, b: b.b, duration: 1.1, ease: 'sine.inOut', overwrite: true });
        gsap.to(gl.uniforms.uAccent.value, { r: a.r, g: a.g, b: a.b, duration: 1.1, ease: 'sine.inOut', overwrite: true });
      } else {
        gl.uniforms.uBg.value.setRGB(b.r, b.g, b.b);
        gl.uniforms.uAccent.value.setRGB(a.r, a.g, a.b);
      }
    } else {
      stageGradient(bg, ac); // #bg-stage has a 1.2s CSS transition → still fluid
    }
  }
  // paint the opening colour immediately
  if (!gl && chapters[0]) stageGradient(chapters[0].dataset.bg, chapters[0].dataset.accent);

  /* ============================================================
     3 · NAV behaviour (scrolled state, hide-on-scroll, mobile)
     ============================================================ */
  var lastY = 0;
  function onScrollNav(y) {
    nav.classList.toggle('scrolled', y > 40);
    if (y > lastY && y > 320) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    lastY = y;
  }
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.innerHTML = open ? '<i class="ti ti-x"></i>' : '<i class="ti ti-menu-2"></i>';
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = '<i class="ti ti-menu-2"></i>';
      });
    });
  }

  /* ============================================================
     4 · LENIS — buttery smooth scroll (drives ScrollTrigger)
     ============================================================ */
  var lenis = null;
  function goTo(el) {
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.2 });
    else el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  }

  if (!prefersReduced && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', function (e) {
      if (window.ScrollTrigger) ScrollTrigger.update();
      onScrollNav(e.scroll || window.scrollY);
    });
  } else {
    window.addEventListener('scroll', function () { onScrollNav(window.scrollY || window.pageYOffset); }, { passive: true });
  }

  // in-page anchors → smooth scroll through Lenis
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (t) { e.preventDefault(); goTo(t); }
    });
  });

  /* ============================================================
     5 · GSAP / ScrollTrigger + Splitting — cinematic scenes
     ============================================================ */
  function revealFrom(el) {
    var mode = el.getAttribute('data-reveal');
    if (mode === 'scale') return { opacity: 0, scale: 1.06 };
    if (mode === 'fade') return { opacity: 0 };
    return { opacity: 0, y: 42 }; // default "up"
  }

  function setupAnimation() {
    var hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

    // Split titles into words/chars regardless (cheap, also a nice progressive enhancement)
    if (typeof Splitting !== 'undefined') {
      try {
        Splitting({ target: '[data-words]', by: 'words' });
        Splitting({ target: '[data-chars-anim]', by: 'chars' });
      } catch (e) {}
    }

    if (prefersReduced || !hasGSAP) {
      // No motion (reduced-motion, or GSAP failed to load): drop the hidden
      // initial states so all content is visible, then colour-key the backdrop.
      document.documentElement.classList.remove('anim');
      if (gl) { // still animate the painted backdrop with a plain RAF
        var raf = function (t) { gl.render(t / 1000); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
      chapters.forEach(function (ch, i) {
        if ('IntersectionObserver' in window) {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) setActive(i); });
          }, { threshold: 0.5 });
          io.observe(ch);
        }
      });
      if (chapters[0]) setActive(0);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Lenis drives the GSAP ticker (single clock for scroll + WebGL render)
    gsap.ticker.add(function (time) {
      if (lenis) lenis.raf(time * 1000);
      if (gl) gl.render(time);
    });
    gsap.ticker.lagSmoothing(0);

    // per-section background-colour transition
    chapters.forEach(function (ch, idx) {
      ScrollTrigger.create({
        trigger: ch, start: 'top 60%', end: 'bottom 40%',
        onEnter: function () { setActive(idx); },
        onEnterBack: function () { setActive(idx); }
      });
    });

    // HERO — title arrives letter by letter on load, then the rest
    var hero = document.getElementById('ch-hero');
    if (hero) {
      var heroTitle = hero.querySelector('.hero-title');
      var tl = gsap.timeline({ delay: 0.15 });
      if (heroTitle) {
        gsap.set(heroTitle, { opacity: 1 });
        var chars = heroTitle.querySelectorAll('.char');
        tl.fromTo(chars,
          { yPercent: 120, opacity: 0, rotateX: -90, transformPerspective: 800, transformOrigin: '50% 100%' },
          { yPercent: 0, opacity: 1, rotateX: 0, stagger: 0.028, duration: 0.8, ease: 'power3.out' });
      }
      hero.querySelectorAll('[data-reveal]').forEach(function (el) {
        tl.fromTo(el, revealFrom(el), { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }, '-=0.45');
      });
    }

    // EACH OTHER CHAPTER — animates in as a cinematic scene
    chapters.forEach(function (ch) {
      if (ch.id === 'ch-hero') return;
      var tl = gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top 72%', once: true } });
      var pos = 0;
      ch.querySelectorAll('[data-reveal]').forEach(function (el) {
        if (el.hasAttribute('data-splitting')) {
          gsap.set(el, { opacity: 1 });
          var units = el.querySelectorAll('.word, .char');
          tl.fromTo(units,
            { yPercent: 115, opacity: 0, rotateX: -55, transformPerspective: 700, transformOrigin: '50% 100%' },
            { yPercent: 0, opacity: 1, rotateX: 0, stagger: 0.02, duration: 0.7, ease: 'power3.out' }, pos);
        } else {
          tl.fromTo(el, revealFrom(el),
            { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.75, ease: 'power3.out' }, pos);
        }
        pos += 0.08;
      });
    });

    // parallax on photos
    gsap.utils.toArray('[data-parallax]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: img.parentElement || img, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    setActive(0);
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  if (document.readyState !== 'loading') setupAnimation();
  else document.addEventListener('DOMContentLoaded', setupAnimation);
})();
