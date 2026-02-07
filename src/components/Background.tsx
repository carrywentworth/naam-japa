import { useEffect, useRef, useState } from 'react';

interface BackgroundProps {
  intensity?: 'subtle' | 'normal' | 'vibrant';
  imageUrl?: string | null;
  videoUrl?: string | null;
  gradient?: string;
  showMedia?: boolean;
}

const CHANT_GRADIENTS: Record<string, string> = {
  amber: 'radial-gradient(ellipse at 50% 30%, rgba(180, 100, 30, 0.12) 0%, transparent 70%)',
  rose: 'radial-gradient(ellipse at 50% 30%, rgba(160, 50, 80, 0.1) 0%, transparent 70%)',
  teal: 'radial-gradient(ellipse at 50% 30%, rgba(30, 120, 120, 0.1) 0%, transparent 70%)',
};

function Background({ intensity = 'normal', imageUrl, videoUrl, gradient, showMedia = true }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mediaError, setMediaError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      radius: number;
      dx: number;
      dy: number;
      opacity: number;
      opacityDirection: number;
    }> = [];

    const opacityMultiplier = intensity === 'subtle' ? 0.3 : intensity === 'vibrant' ? 0.8 : 0.5;
    const particleCount = intensity === 'subtle' ? 20 : intensity === 'vibrant' ? 50 : 30;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          radius: Math.random() * 2 + 0.5,
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.5,
          opacityDirection: Math.random() > 0.5 ? 1 : -1,
        });
      }
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const style = getComputedStyle(document.documentElement);
      const particleColor = style.getPropertyValue('--particle-color').trim() || '212, 165, 116';

      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        p.opacity += p.opacityDirection * 0.003;

        if (p.opacity >= 0.6) p.opacityDirection = -1;
        if (p.opacity <= 0.05) p.opacityDirection = 1;

        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${particleColor}, ${p.opacity * opacityMultiplier})`;
        ctx!.fill();
      }

      animationId = requestAnimationFrame(animate);
    }

    resize();
    initParticles();
    animate();

    const handleResize = () => {
      resize();
      initParticles();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [intensity]);

  const hasVideo = showMedia && videoUrl && !mediaError;
  const hasImage = showMedia && imageUrl && !mediaError && !hasVideo;
  const chantGradient = gradient ? CHANT_GRADIENTS[gradient] : undefined;

  return (
    <>
      {hasVideo && (
        <video
          src={videoUrl!}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setMediaError(true)}
          className="fixed inset-0 w-full h-full object-cover pointer-events-none opacity-30"
          style={{ zIndex: 0 }}
        />
      )}

      {hasImage && (
        <img
          src={imageUrl!}
          alt=""
          onError={() => setMediaError(true)}
          className="fixed inset-0 w-full h-full object-cover pointer-events-none opacity-25"
          style={{ zIndex: 0 }}
        />
      )}

      {chantGradient && (
        <div
          className="fixed inset-0 pointer-events-none transition-opacity duration-700"
          style={{ background: chantGradient, zIndex: 0 }}
        />
      )}

      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
    </>
  );
}

export default Background;
