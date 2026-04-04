import { Heart, Play, Repeat } from 'lucide-react';
import ChantArtwork from './ChantArtwork';
import SectionHeader from './SectionHeader';
import { getChantTheme } from '../../lib/chantThemes';
import type { Chant } from '../../types';

interface PopularListProps {
  chants: Chant[];
  isFavorite: (id: string) => boolean;
  onTap: (chant: Chant) => void;
  onFav: (e: React.MouseEvent, id: string) => void;
}

function PopularList({ chants, isFavorite, onTap, onFav }: PopularListProps) {
  if (chants.length === 0) return null;

  return (
    <div className="px-5 mb-10">
      <SectionHeader
        title="Popular Chants"
        className="mb-5"
      />

      <div className="rounded-2xl overflow-hidden border border-white/[0.04]">
        {chants.map((c, idx) => {
          const fav = isFavorite(c.id);
          const theme = getChantTheme(c);
          const isLast = idx === chants.length - 1;

          return (
            <button
              key={c.id}
              onClick={() => onTap(c)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 text-left active:scale-[0.99] transition-all group hover:bg-white/[0.03] ${
                !isLast ? 'border-b border-white/[0.04]' : ''
              }`}
            >
              <span
                className="text-[20px] font-display font-bold w-6 text-center flex-shrink-0"
                style={{ color: `${theme.accent}60` }}
              >
                {idx + 1}
              </span>

              <div className="relative flex-shrink-0">
                <ChantArtwork chant={c} className="w-12 h-12 rounded-xl" omSize={24} />
                <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <Play className="w-3.5 h-3.5 text-white fill-current" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-t0 text-[13px] font-semibold truncate group-hover:text-accent-light transition-colors">
                  {c.name}
                </h3>
                <p className="text-t3 text-[11px] truncate mt-0.5">{c.subtitle}</p>
                {c.has_rounds && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-accent bg-accent\/10 border border-accent\/15 px-1.5 py-px rounded-full mt-1.5">
                    <Repeat className="w-2.5 h-2.5" />108 per round
                  </span>
                )}
              </div>

              <button
                onClick={e => onFav(e, c.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-t4 hover:text-accent transition-colors active:scale-90"
              >
                <Heart className={`w-3.5 h-3.5 ${fav ? 'fill-current text-accent' : ''}`} />
              </button>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PopularList;
