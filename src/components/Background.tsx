import { useEffect, useRef, useState } from 'react';

interface BackgroundProps {
  intensity?: 'subtle' | 'normal' | 'vibrant';
  imageUrl?: string | null;
  videoUrl?: string | null;
  gradient?: string;
  showMedia?: boolean;
}

const CHANT_GRADIENTS: Record<string, string> = {
  amber: 'radial-gradient(ellipse at 60% 70%, rgba(200, 120, 30, 0.14) 0%, transparent 65%)',
  rose: 'radial-gradient(ellipse at 40% 70%, rgba(180, 55, 90, 0.12) 0%, transparent 65%)',
  teal: 'radial-gradient(ellipse at 50% 60%, rgba(20, 130, 120, 0.12) 0%, transparent 65%)',
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

    const opacityMultiplier = intensity === 'subtle' ? 0.25 : intensity === 'vibrant' ? 0.6 : 0.4;
    const particleCount = intensity === 'subtle' ? 30 : intensity === 'vibrant' ? 65 : 45;

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
          radius: Math.random() * 1.2 + 0.3,
          dx: (Math.random() - 0.5) * 0.2,
          dy: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.4 + 0.05,
          opacityDirection: Math.random() > 0.5 ? 1 : -1,
        });
      }
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const style = getComputedStyle(document.documentElement);
      const particleColor = style.getPropertyValue('--particle-color').trim() || '160, 200, 235';

      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        p.opacity += p.opacityDirection * 0.002;

        if (p.opacity >= 0.5) p.opacityDirection = -1;
        if (p.opacity <= 0.03) p.opacityDirection = 1;

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

      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 65% 75%, rgba(190, 110, 30, 0.09) 0%, transparent 55%)',
          zIndex: 0,
        }}
      />

      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 90%, rgba(10, 40, 80, 0.5) 0%, transparent 60%)',
          zIndex: 0,
        }}
      />

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
