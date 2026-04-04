import { Heart, ChevronRight, Lock, Play } from 'lucide-react';
import ChantArtwork from './ChantArtwork';
import SectionHeader from './SectionHeader';
import type { Chant } from '../../types';

interface AllChantsListProps {
  chants: Chant[];
  isAuthenticated: boolean;
  isFavorite: (id: string) => boolean;
  onTap: (chant: Chant) => void;
  onFav: (e: React.MouseEvent, id: string) => void;
}

function AllChantsList({ chants, isAuthenticated, isFavorite, onTap, onFav }: AllChantsListProps) {
  if (chants.length === 0) return null;

  return (
    <div className="px-5 mb-10">
      <SectionHeader
        title="All Chants"
        trailing={
          <span className="text-[10px] font-medium text-t3 bg-s2-60 border border-white/[0.06] px-2.5 py-1 rounded-full">
            {chants.length}
          </span>
        }
        className="mb-4"
      />

      <div className="space-y-1.5">
        {chants.map(c => {
          const fav = isFavorite(c.id);
          const locked = c.requires_auth && !isAuthenticated;

          return (
            <button
              key={c.id}
              onClick={() => onTap(c)}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] active:scale-[0.98] transition-all text-left group"
            >
              <div className="relative flex-shrink-0">
                <ChantArtwork chant={c} className="w-11 h-11 rounded-xl" omSize={20} />
                <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <Play className="w-3 h-3 text-white fill-current" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-t0 text-[12px] font-semibold truncate">{c.name}</h3>
                <p className="text-t3 text-[10px] truncate mt-0.5">{c.subtitle}</p>
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={e => onFav(e, c.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-t4 hover:text-accent transition-colors active:scale-90"
                >
                  <Heart className={`w-3 h-3 ${fav ? 'fill-current text-accent' : ''}`} />
                </button>
                {locked ? (
                  <Lock className="w-3 h-3 text-t4" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-t4" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AllChantsList;
