/* ============================================================
   CINEMATIC VIDEO HERO — home page only
   Source selection, scroll parallax, mouse drift, progress, pause.
   ============================================================ */
(function () {
  const hero  = document.querySelector('.hero--video');
  if (!hero) return;

  const video  = hero.querySelector('.hv-video');
  const bar    = hero.querySelector('.hv-progress__bar');
  const toggle = hero.querySelector('.hv-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;

  /* ---- Video source: 720p on small screens, 1080p otherwise ---- */
  if (video && !saveData) {
    const small = window.matchMedia('(max-width: 900px)').matches;
    video.src = small ? video.dataset.srcSmall : video.dataset.srcLarge;
    video.muted = true;

    video.addEventListener('playing', () => {
      video.classList.add('is-playing');
      setPaused(false);
    });

    if (!reduceMotion) {
      const p = video.play();
      if (p && p.catch) p.catch(() => setPaused(true));
    } else {
      setPaused(true);
    }
  } else {
    if (toggle) toggle.hidden = true;
  }

  function setPaused(paused) {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(paused));
    const key = paused ? 'hero.video.play' : 'hero.video.pause';
    toggle.setAttribute('aria-label', typeof t === 'function' ? t(key) : key);
  }

  if (toggle && video) {
    toggle.addEventListener('click', () => {
      if (video.paused) {
        video.play().then(() => setPaused(false)).catch(() => {});
      } else {
        video.pause();
        setPaused(true);
      }
    });
  }

  /* ---- Pause the video when the hero is off-screen (saves CPU) ---- */
  let heroVisible = true;
  if ('IntersectionObserver' in window && video) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      const userPaused = toggle && toggle.getAttribute('aria-pressed') === 'true';
      if (!heroVisible) video.pause();
      else if (!userPaused && !reduceMotion) video.play().catch(() => {});
    }, { threshold: 0.05 }).observe(hero);
  }

  if (reduceMotion) return;

  /* ---- Scroll parallax + mouse drift (one rAF loop) ---- */
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  let mx = 0, my = 0, cx = 0, cy = 0;

  if (finePointer) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width  - 0.5);
      my = ((e.clientY - r.top)  / r.height - 0.5);
    });
    hero.addEventListener('pointerleave', () => { mx = 0; my = 0; });
  }

  const style = hero.style;

  function frame() {
    const h = hero.offsetHeight || 1;
    const progress = Math.min(Math.max(window.scrollY / h, 0), 1);

    if (heroVisible) {
      /* eased mouse drift, a few pixels only */
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      style.setProperty('--hv-mx', (-cx * 18).toFixed(2) + 'px');
      style.setProperty('--hv-my', (-cy * 12).toFixed(2) + 'px');

      /* video sinks and pushes in; copy lifts and fades */
      style.setProperty('--hv-py', (progress * h * 0.28).toFixed(1) + 'px');
      style.setProperty('--hv-ps', (progress * 0.1).toFixed(4));
      style.setProperty('--hv-cy', (progress * -90).toFixed(1) + 'px');
      style.setProperty('--hv-co', Math.max(1 - progress * 1.6, 0).toFixed(3));
      style.setProperty('--hv-dark', (progress * 0.6).toFixed(3));

      if (bar && video && video.duration) {
        bar.style.transform = 'scaleX(' + (video.currentTime / video.duration).toFixed(4) + ')';
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
