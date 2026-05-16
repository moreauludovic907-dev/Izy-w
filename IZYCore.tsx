import { useEffect, useRef } from 'react';

type Props = {
  size?: number;
  active?: boolean;       // listening / pulsing
  volume?: number;        // 0..1 (réaction voix)
  onClick?: () => void;
  label?: string;
};

/**
 * Le noyau IA central — pas un bouton micro, un cerveau lumineux.
 * Canvas 2D haute perf (pas de WebGL lourd, marche sur tous tels).
 * - Halo extérieur qui respire
 * - Particules en orbite
 * - Onde de pulse au tap
 * - Réagit au volume audio quand active
 */
export function IZYCore({ size = 240, active = false, volume = 0, onClick, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const volRef = useRef(0);

  useEffect(() => {
    volRef.current = volume;
  }, [volume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // Init particules
    if (particlesRef.current.length === 0) {
      const N = 24;
      for (let i = 0; i < N; i++) {
        particlesRef.current.push({
          angle: (i / N) * Math.PI * 2,
          radius: 60 + Math.random() * 30,
          speed: 0.002 + Math.random() * 0.004,
          size: 0.6 + Math.random() * 1.4,
          opacity: 0.3 + Math.random() * 0.5,
          orbit: Math.random() > 0.5 ? 1 : -1,
        });
      }
    }

    const cx = size / 2;
    const cy = size / 2;

    const render = () => {
      tRef.current += 0.012;
      const t = tRef.current;
      const vol = volRef.current;
      const breathe = 1 + Math.sin(t * 1.2) * 0.04;
      const energy = active ? 0.5 + vol * 0.8 : 0.3;

      ctx.clearRect(0, 0, size, size);

      // --- Halo externe (gradient radial) ---
      const haloR = size * 0.48 * breathe * (1 + vol * 0.15);
      const halo = ctx.createRadialGradient(cx, cy, size * 0.15, cx, cy, haloR);
      halo.addColorStop(0, `rgba(139, 92, 246, ${0.25 + energy * 0.3})`);
      halo.addColorStop(0.5, `rgba(139, 92, 246, ${0.08 + energy * 0.1})`);
      halo.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
      ctx.fill();

      // --- Anneaux concentriques ---
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.7;
        const r = size * 0.30 + i * 8 + Math.sin(t + offset) * 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(167, 139, 250, ${0.06 + (active ? 0.04 : 0) + i * 0.02})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // --- Ondes voix (quand on parle) ---
      if (active && vol > 0.01) {
        const waves = 3;
        for (let w = 0; w < waves; w++) {
          const wt = (t + w * 0.6) % 2;
          const wr = size * 0.18 + wt * (size * 0.22);
          const alpha = (1 - wt / 2) * vol * 0.7;
          ctx.beginPath();
          ctx.arc(cx, cy, wr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(196, 181, 253, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // --- Particules en orbite ---
      for (const p of particlesRef.current) {
        p.angle += p.speed * p.orbit * (1 + vol * 2);
        const radius = p.radius + Math.sin(t * 2 + p.angle) * 4;
        const px = cx + Math.cos(p.angle) * radius * breathe;
        const py = cy + Math.sin(p.angle) * radius * breathe;
        const pSize = p.size * (1 + (active ? vol : 0) * 1.5);
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 181, 253, ${p.opacity * (active ? 1 : 0.6)})`;
        ctx.fill();
      }

      // --- Noyau central (orbe) ---
      const coreR = size * 0.18 * breathe * (1 + vol * 0.2);
      const coreGrad = ctx.createRadialGradient(cx - coreR * 0.3, cy - coreR * 0.3, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9})`);
      coreGrad.addColorStop(0.3, `rgba(196, 181, 253, ${0.95})`);
      coreGrad.addColorStop(0.7, `rgba(139, 92, 246, ${0.95})`);
      coreGrad.addColorStop(1, `rgba(109, 40, 217, 0.85)`);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      // --- Reflet hot spot ---
      const hsR = coreR * 0.35;
      const hs = ctx.createRadialGradient(cx - coreR * 0.35, cy - coreR * 0.4, 0, cx - coreR * 0.35, cy - coreR * 0.4, hsR);
      hs.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      hs.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = hs;
      ctx.beginPath();
      ctx.arc(cx - coreR * 0.35, cy - coreR * 0.4, hsR, 0, Math.PI * 2);
      ctx.fill();

      // --- Lignes "neural" qui traversent ---
      const lines = active ? 4 : 2;
      for (let i = 0; i < lines; i++) {
        const a1 = t * 0.5 + (i / lines) * Math.PI * 2;
        const a2 = a1 + Math.PI + Math.sin(t + i) * 0.5;
        const r1 = size * 0.12;
        const r2 = size * 0.32;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1);
        ctx.lineTo(cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2);
        ctx.strokeStyle = `rgba(196, 181, 253, ${0.15 + (active ? 0.15 : 0)})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [size, active]);

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center justify-center select-none focus:outline-none active:scale-95 transition-transform"
      style={{ width: size, height: size }}
      aria-label={label || 'IZY'}
    >
      <canvas ref={canvasRef} className="block" />
      {label && (
        <span className="absolute -bottom-8 text-xs font-mono tracking-[0.3em] uppercase text-white/60">
          {label}
        </span>
      )}
    </button>
  );
}

type Particle = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  opacity: number;
  orbit: 1 | -1;
};
