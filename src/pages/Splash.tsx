import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OmSymbol from '../components/OmSymbol';
import Background from '../components/Background';

function Splash() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => navigate('/home', { replace: true }), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-s0 flex flex-col items-center justify-center overflow-hidden">
      <Background intensity="vibrant" />
      <div className="absolute inset-0 sacred-gradient" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          className={`transition-all duration-1000 ease-out ${
            phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl animate-breathe" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.1)' }} />
            <div className="relative w-24 h-24 rounded-full border border-accent-med flex items-center justify-center animate-glow">
              <OmSymbol size={56} className="text-accent-light" />
            </div>
          </div>
        </div>

        <div
          className={`transition-all duration-1000 ease-out delay-200 ${
            phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="font-display text-4xl font-semibold tracking-wide text-accent-light">
            Naam Japa
          </h1>
        </div>

        <div
          className={`transition-all duration-1000 ease-out ${
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-t2 text-sm font-light tracking-widest uppercase">
            Sacred Chanting
          </p>
        </div>
      </div>

      <div
        className={`absolute bottom-16 transition-opacity duration-1000 ${
          phase >= 2 ? 'opacity-60' : 'opacity-0'
        }`}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-soft"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Splash;
