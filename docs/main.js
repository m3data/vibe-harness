// Nav scroll shadow
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// Reveal on scroll
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => observer.observe(el));

// Phase-coupling oscillator — hero animation
// Five oscillators cycle through: fragmented → entraining → coherent → destabilising
(function() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  let w, h;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Each oscillator has natural (uncoupled) properties.
  // During coherence, they converge toward shared values.
  const OSC = [
    { freq: 0.71, phase: 0.0, amp: 0.55, y: -0.40, rgb: '74,142,139',  a: 0.09 },
    { freq: 0.88, phase: 1.3, amp: 0.70, y: -0.18, rgb: '196,134,59',  a: 0.06 },
    { freq: 1.00, phase: 2.6, amp: 0.85, y:  0.00, rgb: '74,142,139',  a: 0.10 },
    { freq: 1.14, phase: 3.9, amp: 0.65, y:  0.18, rgb: '196,134,59',  a: 0.06 },
    { freq: 1.31, phase: 5.2, amp: 0.48, y:  0.40, rgb: '74,142,139',  a: 0.08 },
  ];

  var CYCLE = 32; // seconds per full phase cycle
  var SPEED = 0.35;

  function smoothstep(x) {
    x = Math.max(0, Math.min(1, x));
    return x * x * (3 - 2 * x);
  }

  // Coupling schedule: 0 = fragmented, 1 = coherent
  function getCoupling(t) {
    if (t < 0.25) return 0;                                       // fragmented
    if (t < 0.42) return smoothstep((t - 0.25) / 0.17);           // entraining
    if (t < 0.62) return 1;                                        // coherent
    if (t < 0.80) return 1 - smoothstep((t - 0.62) / 0.18);       // destabilising
    return 0;                                                       // fragmented
  }

  function draw(now) {
    var t = (now || 0) / 1000;
    var cycleT = (t % CYCLE) / CYCLE;
    var baseCoupling = getCoupling(cycleT);

    ctx.clearRect(0, 0, w, h);

    var cy = h * 0.52;
    var spread = h * 0.30;
    var maxA = h * 0.14;

    // Collective amplitude breath during coherence
    var breath = baseCoupling * Math.sin(t * 0.7) * 0.12;

    for (var i = 0; i < OSC.length; i++) {
      var o = OSC[i];

      // Staggered coupling: center locks first, edges break first
      var dist = Math.abs(i - 2) / 2;
      var stagger = dist * 0.035;
      var c;
      if (cycleT > 0.55) {
        c = getCoupling(cycleT + stagger);     // edges decouple first
      } else if (cycleT > 0.20 && cycleT < 0.45) {
        c = getCoupling(cycleT - stagger);     // center couples first
      } else {
        c = baseCoupling;
      }

      // Interpolate toward coherent state
      var freq = o.freq * (1 - c) + 1.0 * c;
      var rawAmp = o.amp * (1 - c) + 0.65 * c;

      // Per-oscillator organic wobble (slow, non-repeating feel)
      var wobble = Math.sin(t * 0.27 + o.phase * 5) * 0.08
                 + Math.sin(t * 0.13 + o.phase * 3) * 0.04;
      var amp = rawAmp * (1 + wobble + breath) * maxA;

      // Vertical convergence
      var yOff = (o.y * (1 - c)) * spread;

      // Phase convergence: individual → shared
      var own = o.phase + t * SPEED * o.freq;
      var shared = t * SPEED;
      var phase = own * (1 - c) + shared * c;

      // Opacity lifts during coherence
      var alpha = o.a * (1 + c * 0.5);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(' + o.rgb + ',' + alpha.toFixed(3) + ')';
      ctx.lineWidth = 1 + c * 0.4;

      for (var x = 0; x <= w; x += 3) {
        var xn = x / w;
        var py = cy + yOff + amp * Math.sin(xn * freq * Math.PI * 6 + phase);
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }

      ctx.stroke();
    }

    if (!reducedMotion) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);

  if (reducedMotion) {
    // Draw once in coherent state
    draw(CYCLE * 0.5 * 1000);
  } else {
    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 2s ease';
    setTimeout(function() { canvas.style.opacity = '1'; }, 600);
    requestAnimationFrame(draw);
  }
})();
