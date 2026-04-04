import { useEffect, useRef, useState, useMemo } from 'react';
import { Play, Lock } from 'lucide-react';
import OmSymbol from '../OmSymbol';
import { getChantTheme } from '../../lib/chantThemes';
import type { Chant } from '../../types';

interface HeroSpotlightProps {
  chants: Chant[];
  isAuthenticated: boolean;
  onTap: (chant: Chant) => void;
}

function HeroSpotlight({ chants, isAuthenticated, onTap }: HeroSpotlightProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const pool = useMemo(() => {
    const featured = chants.filter(c => c.featured);
    return featured.length > 0 ? featured : chants.slice(0, 3);
  }, [chants]);

  useEffect(() => {
    if (pool.length <= 1) return;
    timer.current = setInterval(() => setActiveIdx(i => (i + 1) % pool.length), 6000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [pool.length]);

  const hero = pool[activeIdx] ?? chants[0];
  if (!hero) return null;

  const theme = getChantTheme(hero);
  const locked = hero.requires_auth && !isAuthenticated;

  function selectDot(i: number) {
    if (timer.current) clearInterval(timer.current);
    setActiveIdx(i);
  }

  return (
    <div className="relative mb-2">
      <button
        onClick={() => onTap(hero)}
        className="relative w-full text-left active:scale-[0.997] transition-transform overflow-hidden"
        style={{ height: '340px' }}
      >
        <div className="absolute inset-0 transition-all duration-700" style={{ background: theme.bg }} />

        {hero.background_image_url ? (
          <img
            src={hero.background_image_url}
            alt={hero.name}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <OmSymbol size={200} className="text-white opacity-[0.04] animate-breathe" />
          </div>
        )}

        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, var(--s0) 0%, rgba(7,16,28,0.85) 20%, rgba(7,16,28,0.35) 55%, rgba(7,16,28,0.18) 100%)`,
          }}
        />

        {locked && (
          <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Lock className="w-3 h-3 text-white/60" />
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 px-6 pb-6">
          <div
            className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full mb-3"
            style={{
              color: theme.accent,
              background: `${theme.accent}15`,
              border: `1px solid ${theme.accent}25`,
            }}
          >
            Featured
          </div>
          <h2 className="font-display text-[28px] font-semibold text-white leading-[1.12] mb-1.5">
            {hero.name}
          </h2>
          <p className="text-white/40 text-[13px] mb-5 line-clamp-1 max-w-[280px]">
            {hero.subtitle}
          </p>
          <div
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-[13px] font-semibold tracking-wide transition-transform active:scale-95"
            style={{ background: theme.accent, color: 'var(--s0)' }}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Begin Practice
          </div>
        </div>
      </button>

      {pool.length > 1 && (
        <div className="flex justify-center gap-1.5 py-4">
          {pool.map((_, i) => (
            <button
              key={i}
              onClick={() => selectDot(i)}
              className={`rounded-full transition-all duration-400 ${
                i === activeIdx
                  ? 'w-6 h-[5px] bg-accent'
                  : 'w-[5px] h-[5px] bg-t4 hover:bg-t3'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HeroSpotlight;
