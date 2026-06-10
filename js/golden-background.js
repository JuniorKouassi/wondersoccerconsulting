/* ============================================================
   THE WONDER SOCCER CONSULTING — Golden Football Background
   ----------------------------------------------------------
   Subtle animated canvas background:
     · soft golden bokeh haze   (out-of-focus floodlight orbs)
     · faint pitch geometry     (centre circle + halfway line + corner arcs)
     · occasional "long pass"   (a glowing ball tracing a flight path)

   Canvas-based (~6KB), no dependencies. Scales density down on
   small screens, pauses when the tab is hidden, and falls back
   to a static frame for prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  var canvas = document.getElementById("wsc-bg");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var GOLD = "212,175,55"; // #D4AF37
  var reduce = window.matchMedia &&
               window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var dpr = 1, W = 0, H = 0, diag = 0;
  var bokeh = [], passes = [], nextPass = 0;
  var t0 = performance.now(), last = t0, running = true;

  /* ---------- sizing ---------- */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    diag = Math.hypot(W, H);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedBokeh();
    if (reduce) drawStatic();
  }

  /* ---------- soft golden bokeh (out-of-focus floodlight haze) ---------- */
  function seedBokeh() {
    var target = Math.round(Math.min(28, Math.max(12, (W * H) / 75000)));
    bokeh = [];
    for (var i = 0; i < target; i++) bokeh.push(makeOrb());
  }
  function makeOrb() {
    var ang = Math.random() * Math.PI * 2;
    var speed = 3 + Math.random() * 7;      // px/s, very slow drift
    var r = Math.min(W, H) * (0.06 + Math.random() * 0.16); // big & soft
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: r,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      base: 0.04 + Math.random() * 0.055,    // low but visible alpha
      ph: Math.random() * Math.PI * 2,       // pulse phase
      phs: 0.10 + Math.random() * 0.18       // pulse speed
    };
  }

  /* ---------- pitch geometry (faint, slowly breathing) ---------- */
  function drawPitch(time) {
    var cx = W * 0.5, cy = H * 0.5;
    var breathe = 1 + Math.sin(time * 0.00016) * 0.012;
    var R = Math.min(W, H) * 0.26 * breathe;
    var a = 0.05 + Math.sin(time * 0.0004) * 0.012; // ~0.038-0.062

    ctx.save();
    ctx.lineWidth = 1;

    // halfway line
    ctx.strokeStyle = "rgba(" + GOLD + "," + (a * 0.7) + ")";
    ctx.beginPath();
    ctx.moveTo(cx, cy - R * 1.9);
    ctx.lineTo(cx, cy + R * 1.9);
    ctx.stroke();

    // centre circle (very slow rotation gives it life without motion)
    ctx.strokeStyle = "rgba(" + GOLD + "," + a + ")";
    ctx.setLineDash([6, 10]);
    ctx.lineDashOffset = -time * 0.004;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // centre spot
    ctx.fillStyle = "rgba(" + GOLD + "," + (a * 1.4) + ")";
    ctx.beginPath();
    ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // corner arcs (subtle texture in the four corners)
    var cr = Math.min(W, H) * 0.06;
    ctx.strokeStyle = "rgba(" + GOLD + "," + (a * 0.8) + ")";
    corner(0, 0, cr, 0, Math.PI / 2);
    corner(W, 0, cr, Math.PI / 2, Math.PI);
    corner(W, H, cr, Math.PI, Math.PI * 1.5);
    corner(0, H, cr, Math.PI * 1.5, Math.PI * 2);

    ctx.restore();
    function corner(x, y, r, s, e) {
      ctx.beginPath();
      ctx.arc(x, y, r, s, e);
      ctx.stroke();
    }
  }

  /* ---------- "long pass" arcs ---------- */
  function spawnPass() {
    var fromLeft = Math.random() < 0.5;
    var x0 = fromLeft ? -0.08 * W : 1.08 * W;
    var x1 = fromLeft ? 1.08 * W : -0.08 * W;
    var y0 = H * (0.25 + Math.random() * 0.5);
    var y1 = H * (0.25 + Math.random() * 0.5);
    var lift = H * (0.18 + Math.random() * 0.22); // arc height
    passes.push({
      x0: x0, y0: y0, x1: x1, y1: y1, lift: lift,
      t: 0, dur: 3.4 + Math.random() * 1.8, trail: []
    });
  }
  function passPoint(p, u) {
    var x = p.x0 + (p.x1 - p.x0) * u;
    var y = p.y0 + (p.y1 - p.y0) * u - p.lift * (4 * u * (1 - u)); // parabola
    return { x: x, y: y };
  }
  function updatePasses(dt, time) {
    if (time > nextPass) {
      spawnPass();
      nextPass = time + 7000 + Math.random() * 7000; // every ~7-14 s
    }
    for (var i = passes.length - 1; i >= 0; i--) {
      var p = passes[i];
      p.t += dt;
      var u = p.t / p.dur;
      if (u >= 1) { passes.splice(i, 1); continue; }
      var pt = passPoint(p, u);
      p.trail.push({ x: pt.x, y: pt.y, life: 1 });
      if (p.trail.length > 46) p.trail.shift();

      // fade-in/out envelope so it never pops
      var env = Math.sin(Math.min(Math.PI, u * Math.PI)); // 0->1->0

      // trail
      for (var j = 0; j < p.trail.length; j++) {
        var tp = p.trail[j];
        tp.life -= dt * 1.6;
        if (tp.life <= 0) continue;
        var frac = j / p.trail.length;
        var alpha = tp.life * frac * 0.5 * env;
        if (alpha <= 0.002) continue;
        var rr = 0.6 + frac * 1.8;
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + GOLD + "," + alpha + ")";
        ctx.arc(tp.x, tp.y, rr, 0, Math.PI * 2);
        ctx.fill();
      }

      // glowing ball head
      ctx.save();
      ctx.shadowColor = "rgba(" + GOLD + ",0.85)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "rgba(" + GOLD + "," + (0.85 * env) + ")";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ---------- frame ---------- */
  function background() {
    // solid base + a gentle warm vignette
    ctx.fillStyle = "#121214";
    ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, diag * 0.62);
    g.addColorStop(0, "rgba(40,34,18,0.30)");
    g.addColorStop(0.55, "rgba(20,18,14,0.10)");
    g.addColorStop(1, "rgba(8,8,9,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function paintOrb(m, a) {
    var g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
    g.addColorStop(0,    "rgba(" + GOLD + "," + a + ")");
    g.addColorStop(0.55, "rgba(" + GOLD + "," + (a * 0.35) + ")");
    g.addColorStop(1,    "rgba(" + GOLD + ",0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  }
  function updateBokeh(dt) {
    var m, i;
    for (i = 0; i < bokeh.length; i++) {
      m = bokeh[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.ph += m.phs * dt;
      // wrap softly around the edges (account for the soft radius)
      if (m.x < -m.r) m.x = W + m.r;
      else if (m.x > W + m.r) m.x = -m.r;
      if (m.y < -m.r) m.y = H + m.r;
      else if (m.y > H + m.r) m.y = -m.r;
      var a = m.base * (0.6 + 0.4 * Math.sin(m.ph));
      paintOrb(m, a);
    }
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var time = now - t0;

    background();
    updateBokeh(dt);
    drawPitch(time);
    updatePasses(dt, time);

    requestAnimationFrame(frame);
  }

  /* ---------- reduced motion: render one calm static frame ---------- */
  function drawStatic() {
    background();
    for (var i = 0; i < bokeh.length; i++) paintOrb(bokeh[i], bokeh[i].base);
    drawPitch(0);
  }

  /* ---------- lifecycle ---------- */
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
    } else if (!reduce) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  });

  resize();
  if (!reduce) requestAnimationFrame(frame);
})();
