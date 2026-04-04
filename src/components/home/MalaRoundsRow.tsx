import { Play, Repeat } from 'lucide-react';
import OmSymbol from '../OmSymbol';
import SectionHeader from './SectionHeader';
import { getChantTheme } from '../../lib/chantThemes';
import type { Chant } from '../../types';

interface MalaRoundsRowProps {
  chants: Chant[];
  onTap: (chant: Chant) => void;
}

function MalaRoundsRow({ chants, onTap }: MalaRoundsRowProps) {
  if (chants.length === 0) return null;

  return (
    <div className="mb-10">
      <SectionHeader
        icon={<Repeat className="w-3.5 h-3.5" />}
        title="Mala Rounds"
        trailing={
          <span className="text-[10px] font-medium text-t3 bg-s2-60 border border-white/[0.06] px-2.5 py-1 rounded-full">
            108 per round
          </span>
        }
        className="px-5 mb-4"
      />

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
        {chants.map(c => {
          const theme = getChantTheme(c);
          return (
            <button
              key={c.id}
              onClick={() => onTap(c)}
              className="flex-shrink-0 w-[140px] text-left group"
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
                <div className="absolute bottom-3 left-3">
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      color: theme.accent,
                      background: 'rgba(0,0,0,0.5)',
                      border: `1px solid ${theme.accent}30`,
                    }}
                  >
                    Mala 108
                  </span>
                </div>
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

export default MalaRoundsRow;
