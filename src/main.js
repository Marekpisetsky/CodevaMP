  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Live subscriber count: fetches the real number from the YouTube Data
  // API and updates the counter's data-value before it animates into
  // view. If the key is missing or the request fails for any reason,
  // it silently keeps the hardcoded fallback already in the HTML —
  // the page never shows a broken or blank number.
  (function() {
    const YOUTUBE_API_KEY = 'AIzaSyC41og2LykuoewS4CnbRCqT3l73O4ksRuw';
    const CHANNEL_ID = 'UCPGRMPnG2ktwn2Tt21zUR4w';
    if (!YOUTUBE_API_KEY) return;

    const el = document.querySelector('.proof-number.counter[data-format="k1"]');
    if (!el || typeof fetch !== 'function') return;

    fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`)
      .then(r => r.ok ? r.json() : Promise.reject('HTTP ' + r.status))
      .then(data => {
        const count = data?.items?.[0]?.statistics?.subscriberCount;
        if (count) el.dataset.value = count;
      })
      .catch(() => { /* keeps the static fallback already in the HTML */ });
  })();

  // Latest videos: pulls the channel's most recent uploads automatically
  // via the YouTube API, so nobody has to paste links by hand. If it
  // fails for any reason, the grid just stays empty (see the
  // .more-videos:empty CSS rule) and the hand-picked featured video
  // above keeps working exactly as before.
  (function() {
    const YOUTUBE_API_KEY = 'AIzaSyC41og2LykuoewS4CnbRCqT3l73O4ksRuw';
    const CHANNEL_ID = 'UCPGRMPnG2ktwn2Tt21zUR4w';
    if (!YOUTUBE_API_KEY) return;

    const container = document.getElementById('more-videos');
    if (!container || typeof fetch !== 'function') return;

    fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`)
      .then(r => r.ok ? r.json() : Promise.reject('HTTP ' + r.status + ' (paso 1: channels)'))
      .then(data => {
        const uploadsId = data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsId) return Promise.reject('sin playlist de uploads (paso 1 respondió pero sin datos)');
        return fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=5&key=${YOUTUBE_API_KEY}`);
      })
      .then(r => r.ok ? r.json() : Promise.reject('HTTP ' + r.status + ' (paso 2: playlistItems)'))
      .then(data => {
        const items = (data?.items || [])
          .filter(it => it?.snippet?.resourceId?.videoId)
          .slice(0, 4); // skip the newest one if it matches the featured video, keep up to 4
        items.forEach((it, i) => {
          const vid = it.snippet.resourceId.videoId;
          const title = it.snippet.title;

          const a = document.createElement('a');
          a.className = 'mini-video';
          a.href = 'https://youtu.be/' + vid;
          a.target = '_blank';
          a.rel = 'noopener';
          a.style.animationDelay = (i * 0.09).toFixed(2) + 's';

          const glare = document.createElement('div');
          glare.className = 'glare';

          const ratio = document.createElement('div');
          ratio.className = 'ratio';
          const img = document.createElement('img');
          img.src = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
          img.alt = title;
          img.loading = 'lazy';
          const indexTag = document.createElement('span');
          indexTag.className = 'mini-index';
          indexTag.textContent = String(i + 2).padStart(2, '0');
          const playMini = document.createElement('div');
          playMini.className = 'play-mini';
          playMini.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 4L20 12L6 20V4Z" fill="var(--white)"/></svg>';
          ratio.appendChild(img);
          ratio.appendChild(indexTag);
          ratio.appendChild(playMini);

          const titleEl = document.createElement('div');
          titleEl.className = 'mini-title';
          titleEl.textContent = title.length > 90 ? title.slice(0, 90).trim() + '…' : title;

          a.appendChild(glare);
          a.appendChild(ratio);
          a.appendChild(titleEl);
          container.appendChild(a);

          a.addEventListener('mousemove', (e) => {
            const rect = a.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;
            a.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
            a.style.setProperty('--my', (py * 100).toFixed(1) + '%');
          });
        });
      })
      .catch(() => { /* grid stays empty, featured video above is unaffected */ });
  })();

  // Featured video: loads as a fast static thumbnail, and only becomes
  // a real YouTube embed once the person actually clicks play — so it
  // stays fast by default, but plays right on the page instead of
  // sending people away to YouTube.
  (function() {
    const frame = document.getElementById('video-frame');
    const ratio = document.getElementById('video-ratio');
    if (!frame || !ratio) return;
    const VIDEO_ID = 'Ch9qbFszYt8';

    function playInline() {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + VIDEO_ID + '?autoplay=1&rel=0';
      iframe.title = 'CodevaMP · video destacado';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
      ratio.innerHTML = '';
      ratio.appendChild(iframe);
      frame.removeAttribute('role');
      frame.removeAttribute('tabindex');
      frame.removeAttribute('aria-label');
      frame.style.cursor = 'default';
    }

    frame.addEventListener('click', playInline);
    frame.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playInline();
      }
    });
  })();

  // Split every h2 into individual letters (keeping <br> intact) so each
  // one can ignite in sequence when its section scrolls into view,
  // instead of the whole heading flashing at once.
  function igniteSplit(el, baseDelay, step, className) {
    className = className || 'ignite-char';
    const parts = el.innerHTML.split(/(<br\s*\/?>)/i);
    let i = 0;
    const out = parts.map(part => {
      if (/^<br/i.test(part)) return part;
      return part.split('').map(ch => {
        if (ch === ' ') return ' ';
        const delay = (baseDelay + i++ * step).toFixed(2);
        return `<span class="${className}" style="animation-delay:${delay}s">${ch}</span>`;
      }).join('');
    }).join('');
    el.innerHTML = '<span class="ignite-wrap">' + out + '</span>';
  }
  document.querySelectorAll('h2').forEach(h2 => igniteSplit(h2, 0, 0.045));
  const epithet = document.querySelector('.lore-epithet');
  if (epithet) igniteSplit(epithet, 1.9, 0.018, 'inscribe-char');
  // The hero button ignites once on page load (it's above the fold,
  // no scroll needed); the CTA button waits until its own section's
  // title finishes igniting, so the two don't compete at the same instant.
  document.querySelectorAll('.btn-primary').forEach(btn => {
    const loadTriggered = btn.classList.contains('reveal');
    igniteSplit(btn, loadTriggered ? 1.55 : 0, 0.03);
  });

  // Hidden power easter egg: hold the portrait for a second and the
  // chaotic power Codeva doesn't know he has flickers through in purple,
  // then fades back to red — a secret tied directly to the lore, not
  // meant to be obvious. Cancels itself the moment the finger moves,
  // so it never fires mid-scroll, and blocks the native long-press menu.
  (function() {
    const portrait = document.querySelector('.hero-portrait');
    const dial = document.getElementById('dial-progress');
    const spark = document.getElementById('dial-spark');
    const flash = document.getElementById('chaos-flash');
    const ringOuter = document.querySelector('.dot-ring');
    const ringInner = document.querySelector('.portrait-dial');
    if (!portrait || !dial) return;

    const HOLD_MS = 950;
    let holdTimer = null;
    let holdStartX = 0, holdStartY = 0;

    function reveal() {
      dial.classList.remove('charging');
      dial.classList.add('chaos');
      if (spark) spark.classList.add('chaos');
      if (flash) flash.classList.add('active');
      if (ringOuter) ringOuter.classList.add('chaos-mode');
      if (ringInner) ringInner.classList.add('chaos-mode');
      chaosBurst();
      setTimeout(() => {
        dial.classList.remove('chaos');
        if (spark) spark.classList.remove('chaos');
        if (flash) flash.classList.remove('active');
        if (ringOuter) ringOuter.classList.remove('chaos-mode');
        if (ringInner) ringInner.classList.remove('chaos-mode');
      }, 1400);
    }

    function chaosBurst() {
      if (!portrait) return;
      const symbols = ['ᚲ', '火', '▲'];
      const count = 12;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const dist = 35 + Math.random() * 30;
        const p = document.createElement('span');
        p.className = 'spark-burst';
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.color = 'var(--chaos)';
        p.style.textShadow = '0 0 4px var(--chaos), 0 0 10px rgba(124,42,232,0.9)';
        p.style.setProperty('--bx', (Math.cos(angle) * dist).toFixed(1) + 'px');
        p.style.setProperty('--by', (Math.sin(angle) * dist).toFixed(1) + 'px');
        portrait.appendChild(p);
        setTimeout(() => p.remove(), 1050);
      }
    }

    function startHold(e) {
      clearTimeout(holdTimer);
      holdStartX = e.clientX;
      holdStartY = e.clientY;
      dial.classList.add('charging');
      if (ringOuter) ringOuter.classList.add('chaos-mode');
      if (ringInner) ringInner.classList.add('chaos-mode');
      holdTimer = setTimeout(reveal, reduceMotion ? 0 : HOLD_MS);
    }
    function cancelHold() {
      clearTimeout(holdTimer);
      if (dial.classList.contains('charging')) {
        dial.classList.remove('charging');
        if (ringOuter) ringOuter.classList.remove('chaos-mode');
        if (ringInner) ringInner.classList.remove('chaos-mode');
      }
    }
    function checkMove(e) {
      if (Math.abs(e.clientX - holdStartX) > 10 || Math.abs(e.clientY - holdStartY) > 10) {
        cancelHold();
      }
    }

    portrait.addEventListener('pointerdown', startHold);
    portrait.addEventListener('pointermove', checkMove);
    portrait.addEventListener('pointerup', cancelHold);
    portrait.addEventListener('pointerleave', cancelHold);
    portrait.addEventListener('pointercancel', cancelHold);
    portrait.addEventListener('contextmenu', (e) => e.preventDefault());
  })();

  // Tab-title easter egg: the title changes when you look away, and
  // reverts the moment you come back.
  (function() {
    const originalTitle = document.title;
    document.addEventListener('visibilitychange', () => {
      document.title = document.hidden ? 'No te vayas... 🔥' : originalTitle;
    });
  })();

  // Lore glossary: wraps the first mention of a few key terms in a
  // hover tooltip with a short definition, without touching every
  // repeated occurrence in the text.
  (function() {
    const frame = document.querySelector('.lore-frame');
    if (!frame) return;

    const terms = [
      { term: 'Cendraria', def: 'El reino de la Llama Negra, donde nace todo el poder de esta historia.' },
      { term: 'la Grieta', def: 'El único umbral que no da, sino que quita. Se abre solo para quien no tiene nada más que perder.' },
      { term: 'Casa Rescoldo', def: 'La primera casa de Cendraria. Existen dos versiones: la que robó el nombre, y la que lo merece.' }
    ];

    let html = frame.innerHTML;
    terms.forEach(({ term, def }) => {
      const escaped = term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp('(' + escaped + ')');
      html = html.replace(re, (match) =>
        `<span class="glossary-term" tabindex="0" data-def="${def}">${match}</span>`
      );
    });
    frame.innerHTML = html;

    // On touch devices there's no hover, so tapping a term toggles its
    // tooltip instead; tapping elsewhere closes any open one.
    if (window.matchMedia('(hover: none)').matches) {
      frame.querySelectorAll('.glossary-term').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasOpen = el.classList.contains('show');
          document.querySelectorAll('.glossary-term.show').forEach(t => t.classList.remove('show'));
          if (!wasOpen) el.classList.add('show');
        });
      });
      document.addEventListener('click', () => {
        document.querySelectorAll('.glossary-term.show').forEach(t => t.classList.remove('show'));
      });
    }
  })();

  // Opening seal: the ring draws itself, the mark reveals, then the
  // dashes fade in — the loading screen is the brand's own signature,
  // not a generic spinner. It plays in the background and never blocks
  // the page from revealing as soon as it's actually ready.
  const preloader = document.getElementById('preloader');
  const preloaderDashes = document.getElementById('preloader-dashes');
  const sealRing = document.getElementById('seal-ring');
  const sealMark = document.querySelector('.seal-mark');

  if (sealRing && !reduceMotion) {
    requestAnimationFrame(() => sealRing.classList.add('draw'));
  }
  if (sealMark) {
    setTimeout(() => sealMark.classList.add('show'), reduceMotion ? 0 : 1300);
  }

  let dashInterval;
  if (preloaderDashes && !reduceMotion) {
    setTimeout(() => preloaderDashes.classList.add('show'), 1500);
    const frames = ['- - -', '- - - =', '- - - = =', '- - - = = +', '- - = = + =', '- = = + = =', '= = + = = -'];
    let f = 0;
    dashInterval = setInterval(() => {
      preloaderDashes.textContent = frames[f % frames.length];
      f++;
    }, 90);
  } else if (preloaderDashes) {
    preloaderDashes.textContent = 'CodevaMP';
    preloaderDashes.classList.add('show');
  }

  // Reveal the page as soon as fonts are ready — never force a wait.
  // The seal keeps animating in the background regardless; if the page
  // reveals before it finishes, that's fine, it just plays out behind.
  function markReady() {
    document.body.classList.add('fonts-ready');
    if (preloader) {
      preloader.classList.add('done');
      // Fully remove it from the DOM once its fade-out finishes, instead
      // of leaving an invisible position:fixed full-screen layer sitting
      // around for the rest of the page's life.
      setTimeout(() => { if (preloader.parentNode) preloader.remove(); }, 600);
    }
    if (dashInterval) clearInterval(dashInterval);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(markReady).catch(markReady);
    setTimeout(markReady, 1200); // safety net if fonts.ready never resolves
  } else {
    setTimeout(markReady, 100);
  }

  // Respect data-saver mode: skip purely decorative texture for people on limited data.
  if (navigator.connection && navigator.connection.saveData) {
    document.documentElement.classList.add('data-saver');
  }

  // Portrait dial: the progress arc draws itself once, fully, shortly after
  // the page loads — guaranteed visible regardless of scroll speed, instead
  // of racing against the portrait scrolling out of view. A spark travels
  // the arc as it draws, and a small ember burst fires when it completes.
  (function() {
    const dial = document.getElementById('dial-progress');
    const spark = document.getElementById('dial-spark');
    const portrait = document.querySelector('.hero-portrait');
    if (!dial) return;

    if (reduceMotion) {
      dial.style.strokeDashoffset = '50.82';
      dial.classList.add('fill');
      return;
    }

    const CIRCUMFERENCE = 703.72;
    const CX = 120, CY = 120, R = 112;
    const DURATION = 1800;
    const DRAWN_FRACTION = 334 / 360; // leaves a ~26deg permanent gap: the Grieta

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function fireBurst() {
      if (!portrait) return;
      const symbols = ['ᚲ','火','▲'];
      const count = 10;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const dist = 30 + Math.random() * 20;
        const p = document.createElement('span');
        p.className = 'spark-burst';
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.setProperty('--bx', (Math.cos(angle) * dist).toFixed(1) + 'px');
        p.style.setProperty('--by', (Math.sin(angle) * dist).toFixed(1) + 'px');
        portrait.appendChild(p);
        setTimeout(() => p.remove(), 1050);
      }
    }

    function animate(startTime) {
      const now = performance.now();
      const t = Math.min(1, (now - startTime) / DURATION);
      const eased = easeOutCubic(t);
      const drawnEased = eased * DRAWN_FRACTION;

      dial.style.strokeDashoffset = (CIRCUMFERENCE * (1 - drawnEased)).toFixed(2);

      if (spark) {
        const angleDeg = -90 + drawnEased * 360;
        const angleRad = angleDeg * Math.PI / 180;
        spark.setAttribute('cx', (CX + R * Math.cos(angleRad)).toFixed(2));
        spark.setAttribute('cy', (CY + R * Math.sin(angleRad)).toFixed(2));
        if (t > 0 && t < 1) spark.classList.add('active');
      }

      if (t < 1) {
        requestAnimationFrame(() => animate(startTime));
      } else {
        dial.classList.add('fill');
        if (spark) spark.classList.remove('active');
        fireBurst();
      }
    }

    // Small delay so it starts after the fonts-ready fade-in, not during it.
    setTimeout(() => {
      requestAnimationFrame((t) => animate(t));
    }, 500);
  })();

  // The grand climax: after the seal finishes assembling and has a brief
  // quiet moment, everything surges together — a bigger burst than any
  // single piece before it — and settles into a permanently brighter,
  // "charged" state instead of returning to where it started.
  (function() {
    const portrait = document.querySelector('.hero-portrait');
    const dial = document.querySelector('.portrait-dial');
    const ring = document.querySelector('.dot-ring');
    const dialProgress = document.getElementById('dial-progress');
    const shockwave = document.getElementById('shockwave');
    if (!portrait || reduceMotion) {
      if (dial) dial.classList.add('charged');
      if (ring) ring.classList.add('charged');
      return;
    }

    function fireShockwave() {
      if (!shockwave) return;
      shockwave.classList.remove('active');
      void shockwave.offsetWidth; // restart the animation
      shockwave.classList.add('active');
    }

    function grandBurst() {
      const symbols = ['ᚲ', '火', '▲'];
      const waves = [
        { count: 16, dist: [40, 65], delay: 0 },
        { count: 12, dist: [70, 100], delay: 220 },
        { count: 8, dist: [100, 120], delay: 480 }
      ];
      waves.forEach(wave => {
        setTimeout(() => {
          for (let i = 0; i < wave.count; i++) {
            const angle = (Math.PI * 2 * i) / wave.count + Math.random() * 0.4;
            const dist = wave.dist[0] + Math.random() * (wave.dist[1] - wave.dist[0]);
            const p = document.createElement('span');
            p.className = 'spark-burst';
            p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            p.style.setProperty('--bx', (Math.cos(angle) * dist).toFixed(1) + 'px');
            p.style.setProperty('--by', (Math.sin(angle) * dist).toFixed(1) + 'px');
            portrait.appendChild(p);
            setTimeout(() => p.remove(), 1050);
          }
        }, wave.delay);
      });
    }

    // Brief pause right after the spark completes its lap, before the release.
    setTimeout(() => {
      portrait.classList.add('climax');
      fireShockwave();
      setTimeout(fireShockwave, 350);
      if (dialProgress) {
        dialProgress.classList.add('ring-flash');
        setTimeout(() => {
          dialProgress.classList.remove('ring-flash');
          dialProgress.classList.add('charged-pulse');
        }, 900);
      }
      grandBurst();
      setTimeout(() => {
        if (dial) dial.classList.add('charged');
        if (ring) ring.classList.add('charged');
      }, 500);
    }, 4650);
  })();

  // Sticky nav background on scroll + back-to-top visibility + progress ring
  const nav = document.getElementById('main-nav');
  const backToTop = document.getElementById('back-to-top');
  const bttRing = document.getElementById('btt-ring');
  const BTT_CIRCUMFERENCE = 125.66;
  function updateNavAndBtt() {
    if (window.scrollY > 12) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    if (backToTop) {
      if (window.scrollY > 700) backToTop.classList.add('show');
      else backToTop.classList.remove('show');
    }
    if (bttRing) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      bttRing.style.strokeDashoffset = (BTT_CIRCUMFERENCE * (1 - pct)).toFixed(2);
    }
  }
  let navBttTicking = false;
  window.addEventListener('scroll', () => {
    if (navBttTicking) return;
    navBttTicking = true;
    requestAnimationFrame(() => {
      updateNavAndBtt();
      navBttTicking = false;
    });
  }, { passive: true });
  updateNavAndBtt();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // Grieta divider: the crack draws itself open the first time it scrolls
  // into view, with a small ember burst where it finishes.
  (function() {
    const crack = document.getElementById('grieta-crack');
    if (!crack || !('IntersectionObserver' in window)) return;

    function burstAt(container) {
      if (!container || reduceMotion) return;
      const symbols = ['ᚲ','火','▲'];
      const count = 6;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        p.className = 'spark-burst';
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 14 + Math.random() * 14;
        p.style.setProperty('--bx', (Math.cos(angle) * dist).toFixed(1) + 'px');
        p.style.setProperty('--by', (Math.sin(angle) * dist).toFixed(1) + 'px');
        p.style.left = '50%';
        p.style.top = '50%';
        container.appendChild(p);
        setTimeout(() => p.remove(), 1050);
      }
    }

    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          crack.classList.add('open');
          const wrap = crack.closest('.grieta-divider');
          if (wrap) {
            wrap.style.position = 'relative';
            setTimeout(() => burstAt(wrap), reduceMotion ? 0 : 1300);
          }
          cio.unobserve(crack);
        }
      });
    }, { threshold: 0.5 });
    cio.observe(crack);
  })();

  // Glitch-decode text: labels scramble through random terminal characters
  // before resolving to their real text, the first time they scroll into view.
  (function() {
    const targets = document.querySelectorAll('.glitch-text');
    if (!targets.length) return;

    const CHARS = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
    const DURATION = 800;

    function decode(el) {
      const final = el.textContent;
      const len = final.length;
      const start = performance.now();

      function frame(now) {
        const t = Math.min(1, (now - start) / DURATION);
        const revealCount = Math.floor(t * len);
        let out = '';
        for (let i = 0; i < len; i++) {
          if (i < revealCount || final[i] === ' ') {
            out += final[i];
          } else {
            out += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        el.textContent = out;
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          el.textContent = final;
          el.classList.add('resolve-flash');
          setTimeout(() => el.classList.remove('resolve-flash'), 500);
        }
      }
      requestAnimationFrame(frame);
    }

    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const gio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          decode(entry.target);
          gio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    targets.forEach(el => gio.observe(el));
  })();

  // Scroll-triggered fade-up reveal
  const revealEls = document.querySelectorAll('.fade-up, .stagger');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  // Animated counters
  function formatCounter(val, format) {
    if (format === 'k1') return (val / 1000).toFixed(1) + 'K';
    return Math.round(val).toString();
  }
  function animateCounter(el) {
    const target = parseFloat(el.dataset.value);
    const format = el.dataset.format;
    if (reduceMotion) { el.textContent = formatCounter(target, format); return; }
    const duration = 1100;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatCounter(target * eased, format);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const counters = document.querySelectorAll('.counter');
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  } else {
    counters.forEach(el => el.textContent = formatCounter(parseFloat(el.dataset.value), el.dataset.format));
  }

  // Magnetic buttons
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn-primary').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });

    // 3D tilt + glare on the game-mode cards
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = x / rect.width;
        const py = y / rect.height;
        const tiltX = (py - 0.5) * -8;
        const tiltY = (px - 0.5) * 8;
        card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    // Subtle hero parallax + cursor-following glow
    const heroStripe = document.querySelector('.hero-stripe');
    const heroGlow = document.getElementById('hero-glow');
    const heroSection = document.querySelector('.hero');
    if (heroStripe && heroSection) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        heroStripe.style.transform = `translate(${relX * 24}px, ${relY * 16}px)`;
        if (heroGlow) {
          heroGlow.style.setProperty('--mx', `${e.clientX - rect.left}px`);
          heroGlow.style.setProperty('--my', `${e.clientY - rect.top}px`);
        }
      });
      heroSection.addEventListener('mouseleave', () => { heroStripe.style.transform = ''; });
    }
  }
  // Cursor ember trail: small embers spawn as the mouse moves across the
  // whole page, drift up and fade — the fire following where you look.
  (function() {
    const canvas = document.getElementById('ember-trail');
    const dataSaver = navigator.connection && navigator.connection.saveData;
    if (!canvas || reduceMotion || dataSaver || !window.matchMedia('(hover: hover)').matches) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let raf = null;
    let lastSpawn = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function spawn(x, y) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.4 - Math.random() * 0.5,
        r: 1 + Math.random() * 1.8,
        life: 1,
        decay: 0.012 + Math.random() * 0.01
      });
      if (particles.length > 120) particles.shift();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        const a = Math.max(0, p.life) * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 52, 42, ${a})`;
        ctx.shadowColor = 'rgba(232, 52, 42, 0.7)';
        ctx.shadowBlur = 5;
        ctx.fill();
      });
      if (particles.length > 0 && !document.hidden) {
        raf = requestAnimationFrame(draw);
      } else {
        raf = null;
      }
    }

    function ensureLoop() {
      if (!raf) raf = requestAnimationFrame(draw);
    }

    window.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastSpawn > 24) {
        lastSpawn = now;
        spawn(e.clientX, e.clientY);
        ensureLoop();
      }
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) ensureLoop();
    });
  })();

  // Ember particles in the lore section
  (function() {
    const canvas = document.getElementById('lore-canvas');
    const dataSaver = navigator.connection && navigator.connection.saveData;
    if (!canvas || reduceMotion || dataSaver) return;
    const ctx = canvas.getContext('2d');
    const section = canvas.parentElement;
    let particles = [];
    let raf;
    let visible = true;

    function resize() {
      canvas.width = section.offsetWidth;
      canvas.height = section.offsetHeight;
    }

    function makeParticle() {
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 40,
        r: 1 + Math.random() * 2.2,
        speed: 0.25 + Math.random() * 0.55,
        drift: (Math.random() - 0.5) * 0.4,
        alpha: 0.15 + Math.random() * 0.35,
        flicker: Math.random() * Math.PI * 2
      };
    }

    function init() {
      resize();
      const count = Math.max(14, Math.floor(canvas.width / 90));
      particles = Array.from({ length: count }, makeParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y -= p.speed;
        p.x += p.drift;
        p.flicker += 0.05;
        if (p.y < -10) Object.assign(p, makeParticle(), { y: canvas.height + 10 });
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.flicker));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 52, 42, ${a})`;
        ctx.shadowColor = 'rgba(232, 52, 42, 0.6)';
        ctx.shadowBlur = 5;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(init, 200);
    });

    // Pause the animation loop entirely when the tab is hidden,
    // so it doesn't burn battery/CPU in a background tab.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (visible && !raf) {
        draw();
      }
    });

    const lio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) {
          init();
          if (!raf) draw();
        } else {
          cancelAnimationFrame(raf);
          raf = null;
        }
      });
    }, { threshold: 0.05 });
    lio.observe(section);
  })();
