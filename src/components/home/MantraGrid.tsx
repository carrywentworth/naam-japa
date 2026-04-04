import { Play } from 'lucide-react';
import OmSymbol from '../OmSymbol';
import SectionHeader from './SectionHeader';
import { getChantTheme } from '../../lib/chantThemes';
import type { Chant } from '../../types';

interface MantraGridProps {
  chants: Chant[];
  onTap: (chant: Chant) => void;
}

function MantraGrid({ chants, onTap }: MantraGridProps) {
  if (chants.length === 0) return null;

  return (
    <div className="px-5 mb-10">
      <SectionHeader
        icon={<OmSymbol size={14} className="text-accent" />}
        title="Find Your Mantra"
        className="mb-4"
      />

      <div className="grid grid-cols-2 gap-2.5">
        {chants.map(c => {
          const theme = getChantTheme(c);
          return (
            <button
              key={c.id}
              onClick={() => onTap(c)}
              className="relative h-[130px] rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-transform group"
            >
              <div className="absolute inset-0" style={{ background: theme.bg }} />
              {c.background_image_url ? (
                <img
                  src={c.background_image_url}
                  alt={c.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="absolute bottom-2 right-2 opacity-[0.06]">
                  <OmSymbol size={64} className="text-white" />
                </div>
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%)',
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: `${theme.accent}dd` }}
                >
                  <Play className="w-3.5 h-3.5 fill-current" style={{ color: 'var(--s0)' }} />
                </div>
              </div>

              <div className="absolute bottom-0 inset-x-0 p-3.5">
                <h3 className="text-white text-[13px] font-semibold leading-tight">{c.name}</h3>
                <p className="text-white/40 text-[10px] mt-0.5 truncate">{c.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MantraGrid;
