import { useRef, useEffect } from 'react';

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export default function HeroBackground({ poster }) {
  const canvasRef = useRef(null);
  const fallbackImgRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h, isMobile;
    const drops = [];
    const particles = [];
    const stars = [];
    const smokes = [];
    let time = 0;
    let lastLightning = 0;
    let lightningAlpha = 0;
    let raf;

    const isMobileWidth = () => window.innerWidth < 768;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      isMobile = isMobileWidth();
    }
    resize();
    window.addEventListener('resize', resize);

    function initDrops(count) {
      drops.length = 0;
      for (let i = 0; i < count; i++) {
        drops.push({
          x: Math.random() * w,
          y: Math.random() * h,
          speed: randomBetween(4, 12),
          length: randomBetween(8, 20),
          opacity: randomBetween(0.15, 0.4),
          wind: randomBetween(-0.5, 0.5),
        });
      }
    }

    function initParticles(count) {
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: randomBetween(1.5, 4),
          speed: randomBetween(0.2, 0.8),
          drift: randomBetween(-0.3, 0.3),
          opacity: randomBetween(0.3, 0.8),
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function initStars(count) {
      stars.length = 0;
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * (h * 0.35),
          size: randomBetween(0.5, 1.8),
          twinkleSpeed: randomBetween(0.01, 0.04),
          twinklePhase: Math.random() * Math.PI * 2,
          maxOpacity: randomBetween(0.3, 0.8),
        });
      }
    }

    function initSmokes(count) {
      smokes.length = 0;
      for (let i = 0; i < count; i++) {
        smokes.push({
          x: randomBetween(w * 0.1, w * 0.9),
          y: randomBetween(h * 0.3, h * 0.6),
          radius: randomBetween(40, 120),
          speed: randomBetween(0.15, 0.4),
          opacity: randomBetween(0.03, 0.08),
          driftX: randomBetween(-0.3, 0.3),
        });
      }
    }

    initDrops(isMobile ? 60 : 200);
    initParticles(isMobile ? 10 : 28);
    initStars(isMobile ? 30 : 80);
    initSmokes(isMobile ? 3 : 6);

    function waveY(x, t, amp, freq, speed) {
      return Math.sin(x * freq + t * speed) * amp;
    }

    function drawShip(cx, cy, scale, pitch) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(pitch);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#000';

      // Hull
      ctx.beginPath();
      ctx.moveTo(-50, -2);
      ctx.quadraticCurveTo(-58, 14, -48, 22);
      ctx.quadraticCurveTo(-25, 30, 15, 28);
      ctx.quadraticCurveTo(40, 26, 55, 8);
      ctx.lineTo(60, 2);
      ctx.lineTo(58, -2);
      ctx.quadraticCurveTo(40, 0, 15, -2);
      ctx.quadraticCurveTo(-15, -2, -50, -2);
      ctx.closePath();
      ctx.fill();

      // Deck rail
      ctx.fillRect(-48, -4, 106, 3);

      // Cannon ports
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(-35 + i * 14, 13, 4, 4);
      }

      // Bowsprit
      ctx.save();
      ctx.translate(58, -2);
      ctx.rotate(-0.25);
      ctx.fillRect(0, -1.5, 30, 3);
      ctx.restore();

      // Mainmast
      ctx.fillRect(-2, -75, 5, 73);
      // Crow's nest
      ctx.fillRect(-7, -70, 15, 5);
      ctx.fillRect(-5, -62, 11, 3);

      // Foremast
      ctx.fillRect(30, -55, 4, 53);

      // Mizzenmast
      ctx.fillRect(-32, -48, 4, 46);

      // Main sail
      ctx.beginPath();
      ctx.moveTo(0, -62);
      ctx.quadraticCurveTo(30, -55, 32, -38);
      ctx.quadraticCurveTo(30, -28, 3, -28);
      ctx.quadraticCurveTo(8, -45, 0, -62);
      ctx.closePath();
      ctx.fill();

      // Lower main sail
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.quadraticCurveTo(32, -22, 34, -6);
      ctx.quadraticCurveTo(30, 4, 3, 2);
      ctx.quadraticCurveTo(8, -12, 0, -26);
      ctx.closePath();
      ctx.fill();

      // Fore sail
      ctx.beginPath();
      ctx.moveTo(30, -44);
      ctx.quadraticCurveTo(52, -40, 54, -26);
      ctx.quadraticCurveTo(50, -18, 30, -16);
      ctx.quadraticCurveTo(34, -30, 30, -44);
      ctx.closePath();
      ctx.fill();

      // Mizzen sail
      ctx.beginPath();
      ctx.moveTo(-32, -38);
      ctx.quadraticCurveTo(-14, -34, -12, -20);
      ctx.quadraticCurveTo(-16, -12, -32, -10);
      ctx.quadraticCurveTo(-28, -24, -32, -38);
      ctx.closePath();
      ctx.fill();

      // Jib sail
      ctx.beginPath();
      ctx.moveTo(52, -2);
      ctx.quadraticCurveTo(70, -30, 78, -8);
      ctx.quadraticCurveTo(68, -6, 52, -2);
      ctx.closePath();
      ctx.fill();

      // Flag
      ctx.beginPath();
      ctx.moveTo(-2, -75);
      ctx.lineTo(16, -70);
      ctx.lineTo(-2, -65);
      ctx.closePath();
      ctx.fillStyle = '#D4AF37';
      ctx.fill();
      ctx.fillStyle = '#000';

      // Rigging lines
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-2, -75);
      ctx.lineTo(55, -2);
      ctx.moveTo(-2, -75);
      ctx.lineTo(-48, -2);
      ctx.moveTo(30, -55);
      ctx.lineTo(-48, -2);
      ctx.moveTo(30, -55);
      ctx.lineTo(58, -2);
      ctx.stroke();

      ctx.restore();
    }

    function draw() {
      const dt = 1;
      time += dt;
      const t = time * 0.001;

      // Cinematic slow zoom/pan
      const panX = Math.sin(t * 0.02) * w * 0.01;
      const zoom = 1 + Math.sin(t * 0.015) * 0.008;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // --- Sky gradient ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
      skyGrad.addColorStop(0, '#05050a');
      skyGrad.addColorStop(0.5, '#0d0d1a');
      skyGrad.addColorStop(1, '#0a1628');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.55);

      // --- Stars ---
      for (const s of stars) {
        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.5 + 0.5;
        const alpha = twinkle * s.maxOpacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
        if (s.size > 1.2) {
          ctx.shadowColor = 'rgba(255,255,255,0.3)';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // --- Cinematic transform ---
      ctx.translate(panX, 0);
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2, -h / 2);

      // --- Lightning ---
      if (lightningAlpha > 0) {
        ctx.fillStyle = `rgba(200,220,255,${lightningAlpha * 0.15})`;
        ctx.fillRect(0, 0, w, h);
        lightningAlpha *= 0.92;
        if (lightningAlpha < 0.005) lightningAlpha = 0;
      }

      // Random lightning trigger
      if (time > lastLightning + randomBetween(300, 900)) {
        lightningAlpha = 0.6;
        lastLightning = time;

        // Draw lightning bolt
        ctx.save();
        ctx.strokeStyle = `rgba(200,220,255,0.7)`;
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(200,220,255,0.5)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        let lx = randomBetween(w * 0.2, w * 0.8);
        let ly = 0;
        ctx.moveTo(lx, ly);
        for (let i = 0; i < 8; i++) {
          lx += randomBetween(-25, 25);
          ly += randomBetween(20, 50);
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // --- Ocean waves ---
      const horizon = h * 0.52;
      const waveColors = [
        { color: '#0d1f2e', amp: 20, freq: 0.008, speed: 0.00035, yOff: 0 },
        { color: '#0a1825', amp: 28, freq: 0.012, speed: 0.0005, yOff: 15 },
        { color: '#06121a', amp: 35, freq: 0.006, speed: 0.0004, yOff: 35 },
        { color: '#040d14', amp: 22, freq: 0.015, speed: 0.0006, yOff: 50 },
      ];

      for (const wave of waveColors) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 3) {
          const y = horizon + wave.yOff + waveY(x, t, wave.amp, wave.freq, wave.speed);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = wave.color;
        ctx.fill();
      }

      // Wave crest highlights
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = horizon + 20 + waveY(x, t, 28, 0.012, 0.0005) + 15;
        const crestY = horizon + 20 + waveY(x, t, 28, 0.012, 0.0005) + 15 - Math.abs(waveY(x, t, 28, 0.012, 0.0005)) * 0.3;
        ctx.moveTo(x, crestY);
        ctx.lineTo(x + 3, crestY);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // --- Fog/smoke ---
      for (const smoke of smokes) {
        const sx = smoke.x + Math.sin(t * 0.3 + smoke.driftX * 10) * 30 + smoke.driftX * t * 5;
        const sy = smoke.y + Math.sin(t * 0.2 + smoke.radius) * 10 - smoke.speed * t * 2;
        const radial = ctx.createRadialGradient(sx, sy, 0, sx, sy, smoke.radius);
        radial.addColorStop(0, `rgba(180,200,220,${smoke.opacity})`);
        radial.addColorStop(0.5, `rgba(160,180,200,${smoke.opacity * 0.5})`);
        radial.addColorStop(1, 'rgba(160,180,200,0)');
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(sx, sy % (h + 200), smoke.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Ship ---
      const shipX = w * 0.28 + Math.sin(t * 0.03) * 15;
      const waveAtShip = horizon + 20 + waveY(shipX, t, 28, 0.012, 0.0005) + 15;
      const shipY = waveAtShip + 5;
      const pitchAngle = Math.sin(t * 0.002 + shipX * 0.01) * 0.04;
      const shipScale = isMobile ? Math.min(w / 600, 1) : Math.min(w / 900, 1.2);
      drawShip(shipX, shipY, shipScale, pitchAngle);

      // Ship reflection
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.translate(shipX, shipY + 40);
      ctx.scale(1, -0.3);
      drawShip(0, 0, shipScale, pitchAngle);
      ctx.restore();

      // --- Rain ---
      ctx.strokeStyle = `rgba(180,200,230,0.3)`;
      ctx.lineWidth = 1;
      for (const drop of drops) {
        drop.y += drop.speed;
        drop.x += drop.wind;
        if (drop.y > h) {
          drop.y = -drop.length;
          drop.x = Math.random() * w;
        }
        if (drop.x > w) drop.x = -10;
        if (drop.x < -10) drop.x = w;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.wind * 2, drop.y - drop.length);
        ctx.strokeStyle = `rgba(180,200,230,${drop.opacity})`;
        ctx.stroke();
      }

      // Rain mist at horizon
      const mistGrad = ctx.createLinearGradient(0, horizon - 30, 0, horizon + 40);
      mistGrad.addColorStop(0, 'rgba(180,200,220,0)');
      mistGrad.addColorStop(0.5, 'rgba(180,200,220,0.05)');
      mistGrad.addColorStop(1, 'rgba(180,200,220,0)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, horizon - 30, w, 70);

      // --- Gold particles ---
      for (const p of particles) {
        p.y -= p.speed;
        p.x += Math.sin(t * 0.5 + p.phase) * 0.3 + p.drift;
        if (p.y < -20) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        glow.addColorStop(0, `rgba(212,175,55,${p.opacity})`);
        glow.addColorStop(0.3, `rgba(212,175,55,${p.opacity * 0.4})`);
        glow.addColorStop(1, 'rgba(212,175,55,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255,255,255,${p.opacity * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // cinematic transform

      // Cinematic letterbox bars
      const barHeight = h * 0.045;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, w, barHeight);
      ctx.fillRect(0, h - barHeight, w, barHeight);

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      {poster && <img ref={fallbackImgRef} src={poster} alt="" className="hero-canvas-fallback" />}
      <canvas ref={canvasRef} className="hero-canvas-bg" />
    </>
  );
}
