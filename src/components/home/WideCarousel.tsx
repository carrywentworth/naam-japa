import { Play } from 'lucide-react';
import OmSymbol from '../OmSymbol';
import SectionHeader from './SectionHeader';
import { getChantTheme } from '../../lib/chantThemes';
import type { Chant } from '../../types';

interface WideCarouselProps {
  title: string;
  icon?: React.ReactNode;
  chants: Chant[];
  onTap: (chant: Chant) => void;
}

function WideCarousel({ title, icon, chants, onTap }: WideCarouselProps) {
  if (chants.length === 0) return null;

  return (
    <div className="mb-10">
      <SectionHeader
        icon={icon}
        title={title}
        className="px-5 mb-4"
      />

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
        {chants.map(c => {
          const theme = getChantTheme(c);
          return (
            <button
              key={c.id}
              onClick={() => onTap(c)}
              className="flex-shrink-0 relative text-left active:scale-[0.98] transition-transform group"
              style={{ width: '260px' }}
            >
              <div className="relative w-full h-[148px] rounded-2xl overflow-hidden">
                <div className="absolute inset-0" style={{ background: theme.bg }} />
                {c.background_image_url ? (
                  <img
                    src={c.background_image_url}
                    alt={c.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <OmSymbol size={64} className="text-white opacity-[0.06]" />
                  </div>
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(115deg, rgba(7,16,28,0.88) 0%, rgba(7,16,28,0.4) 50%, rgba(7,16,28,0.15) 100%)',
                  }}
                />

                <div className="absolute inset-y-0 left-0 flex flex-col justify-end p-4 w-[70%]">
                  <h3 className="text-white text-[14px] font-semibold leading-tight mb-1">{c.name}</h3>
                  <p className="text-white/35 text-[10px] line-clamp-2 leading-relaxed mb-3">{c.subtitle}</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: theme.accent }}
                    >
                      <Play className="w-3 h-3 fill-current" style={{ color: 'var(--s0)' }} />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: theme.accent }}>
                      Play Now
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default WideCarousel;
