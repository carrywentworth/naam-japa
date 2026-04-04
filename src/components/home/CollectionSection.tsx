import { Heart, Play, Repeat } from 'lucide-react';
import OmSymbol from '../OmSymbol';
import ChantArtwork from './ChantArtwork';
import SectionHeader from './SectionHeader';
import { getChantTheme } from '../../lib/chantThemes';
import type { Chant, Collection } from '../../types';

interface CollectionSectionProps {
  collection: Collection;
  chants: Chant[];
  isFavorite: (id: string) => boolean;
  onTap: (chant: Chant) => void;
  onFav: (e: React.MouseEvent, id: string) => void;
}

function HorizontalScrollLayout({ chants, onTap }: { chants: Chant[]; onTap: (c: Chant) => void }) {
  return (
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
                style={{ background: 'linear-gradient(to top, rgba(7,16,28,0.9) 0%, rgba(7,16,28,0.1) 55%, transparent 100%)' }}
              />
              {c.has_rounds && (
                <div className="absolute bottom-3 left-3">
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ color: theme.accent, background: 'rgba(0,0,0,0.5)', border: `1px solid ${theme.accent}30` }}
                  >
                    Mala 108
                  </span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: theme.accent }}>
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
  );
}

function WideCardsLayout({ chants, onTap }: { chants: Chant[]; onTap: (c: Chant) => void }) {
  return (
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
                <img src={c.background_image_url} alt={c.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center"><OmSymbol size={64} className="text-white opacity-[0.06]" /></div>
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, rgba(7,16,28,0.88) 0%, rgba(7,16,28,0.4) 50%, rgba(7,16,28,0.15) 100%)' }} />
              <div className="absolute inset-y-0 left-0 flex flex-col justify-end p-4 w-[70%]">
                <h3 className="text-white text-[14px] font-semibold leading-tight mb-1">{c.name}</h3>
                <p className="text-white/35 text-[10px] line-clamp-2 leading-relaxed mb-3">{c.subtitle}</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: theme.accent }}>
                    <Play className="w-3 h-3 fill-current" style={{ color: 'var(--s0)' }} />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: theme.accent }}>Play Now</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function GridLayout({ chants, onTap }: { chants: Chant[]; onTap: (c: Chant) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-5">
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
              <img src={c.background_image_url} alt={c.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            ) : (
              <div className="absolute bottom-2 right-2 opacity-[0.06]"><OmSymbol size={64} className="text-white" /></div>
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%)' }} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ background: `${theme.accent}dd` }}>
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
  );
}

function NumberedListLayout({ chants, isFavorite, onTap, onFav }: {
  chants: Chant[];
  isFavorite: (id: string) => boolean;
  onTap: (c: Chant) => void;
  onFav: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <div className="px-5">
      <div className="rounded-2xl overflow-hidden border border-white/[0.04]">
        {chants.map((c, idx) => {
          const fav = isFavorite(c.id);
          const theme = getChantTheme(c);
          const isLast = idx === chants.length - 1;
          return (
            <button
              key={c.id}
              onClick={() => onTap(c)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 text-left active:scale-[0.99] transition-all group hover:bg-white/[0.03] ${!isLast ? 'border-b border-white/[0.04]' : ''}`}
            >
              <span className="text-[20px] font-bold w-6 text-center flex-shrink-0" style={{ color: `${theme.accent}60` }}>{idx + 1}</span>
              <div className="relative flex-shrink-0">
                <ChantArtwork chant={c} className="w-12 h-12 rounded-xl" omSize={24} />
                <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <Play className="w-3.5 h-3.5 text-white fill-current" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-t0 text-[13px] font-semibold truncate group-hover:text-accent-light transition-colors">{c.name}</h3>
                <p className="text-t3 text-[11px] truncate mt-0.5">{c.subtitle}</p>
                {c.has_rounds && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-px rounded-full mt-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/15">
                    <Repeat className="w-2.5 h-2.5" />108 per round
                  </span>
                )}
              </div>
              <button
                onClick={e => onFav(e, c.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-t4 hover:text-amber-400 transition-colors active:scale-90"
              >
                <Heart className={`w-3.5 h-3.5 ${fav ? 'fill-current text-amber-400' : ''}`} />
              </button>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CollectionSection({ collection, chants, isFavorite, onTap, onFav }: CollectionSectionProps) {
  if (chants.length === 0) return null;

  return (
    <div className="mb-10">
      <SectionHeader
        title={collection.name}
        className="px-5 mb-4"
      />

      {collection.layout === 'horizontal_scroll' && (
        <HorizontalScrollLayout chants={chants} onTap={onTap} />
      )}
      {collection.layout === 'wide_cards' && (
        <WideCardsLayout chants={chants} onTap={onTap} />
      )}
      {collection.layout === 'grid' && (
        <GridLayout chants={chants} onTap={onTap} />
      )}
      {collection.layout === 'numbered_list' && (
        <NumberedListLayout chants={chants} isFavorite={isFavorite} onTap={onTap} onFav={onFav} />
      )}
    </div>
  );
}

export default CollectionSection;
