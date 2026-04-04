import { Heart, Play } from 'lucide-react';
import OmSymbol from '../OmSymbol';
import SectionHeader from './SectionHeader';
import { getChantTheme } from '../../lib/chantThemes';
import type { Chant } from '../../types';

interface FavoritesRowProps {
  chants: Chant[];
  onTap: (chant: Chant) => void;
}

function FavoritesRow({ chants, onTap }: FavoritesRowProps) {
  if (chants.length === 0) return null;

  return (
    <div className="mb-10">
      <SectionHeader
        icon={<Heart className="w-3.5 h-3.5 fill-current" />}
        title="Your Practice"
        className="px-5 mb-4"
      />

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
        {chants.map(c => {
          const theme = getChantTheme(c);
          return (
            <button
              key={c.id}
              onClick={() => onTap(c)}
              className="flex-shrink-0 w-[152px] text-left group"
            >
              <div
                className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mb-2.5"
                style={{ background: theme.bg }}
              >
                {c.background_image_url ? (
                  <img
                    src={c.background_image_url}
                    alt={c.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <OmSymbol size={48} className="text-white opacity-[0.1]" />
                  </div>
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(7,16,28,0.9) 0%, rgba(7,16,28,0.1) 55%, transparent 100%)',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: theme.accent }}
                  >
                    <Play className="w-4 h-4 fill-current" style={{ color: 'var(--s0)' }} />
                  </div>
                </div>
              </div>
              <h3 className="text-t0 text-[12px] font-semibold truncate leading-tight">{c.name}</h3>
              <p className="text-t3 text-[10px] truncate mt-0.5">{c.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FavoritesRow;
