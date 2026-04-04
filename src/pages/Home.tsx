import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Search, Moon, Sun, User, X, ChevronRight, Clock,
} from 'lucide-react';
import Background from '../components/Background';
import OmSymbol from '../components/OmSymbol';
import AuthModal from '../components/AuthModal';
import ChantArtwork from '../components/home/ChantArtwork';
import HeroSpotlight from '../components/home/HeroSpotlight';
import PopularList from '../components/home/PopularList';
import FavoritesRow from '../components/home/FavoritesRow';
import MantraGrid from '../components/home/MantraGrid';
import WideCarousel from '../components/home/WideCarousel';
import MalaRoundsRow from '../components/home/MalaRoundsRow';
import AllChantsList from '../components/home/AllChantsList';
import CollectionSection from '../components/home/CollectionSection';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { supabase } from '../lib/supabase';
import { trackEvent, AnalyticsEvents } from '../lib/analytics';
import type { Chant, Collection } from '../types';

interface CollectionWithChants {
  collection: Collection;
  chants: Chant[];
}

function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toggle: toggleFav, isFavorite } = useFavorites();
  const { isAuthenticated, canPlayAsGuest, consumeGuestSession } = useAuth();

  const [chants, setChants] = useState<Chant[]>([]);
  const [dbCollections, setDbCollections] = useState<CollectionWithChants[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingChant, setPendingChant] = useState<Chant | null>(null);

  useEffect(() => {
    trackEvent(AnalyticsEvents.PAGE_VIEW, null, { page: 'home' });
    (async () => {
      const [chantsRes, collectionsRes, junctionRes] = await Promise.all([
        supabase.from('chants').select('*').order('sort_order', { ascending: true }),
        supabase.from('collections').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('collection_chants').select('*').order('sort_order', { ascending: true }),
      ]);
      const allChants = (chantsRes.data ?? []) as Chant[];
      setChants(allChants);

      const chantMap = new Map(allChants.map(c => [c.id, c]));
      const cols: CollectionWithChants[] = (collectionsRes.data ?? []).map((col: Collection) => {
        const junctions = (junctionRes.data ?? []).filter(
          (j: { collection_id: string }) => j.collection_id === col.id,
        );
        const colChants = junctions
          .map((j: { chant_id: string }) => chantMap.get(j.chant_id))
          .filter((c): c is Chant => c !== undefined);
        return { collection: col, chants: colChants };
      });
      setDbCollections(cols);
      setLoading(false);
    })();
  }, []);

  const favorites = useMemo(() => chants.filter(c => isFavorite(c.id)), [chants, isFavorite]);
  const withRounds = useMemo(() => chants.filter(c => c.has_rounds), [chants]);
  const filtered = useMemo(() => {
    const t = search.toLowerCase().trim();
    if (!t) return [];
    return chants.filter(
      c => c.name.toLowerCase().includes(t) || c.subtitle.toLowerCase().includes(t),
    );
  }, [chants, search]);

  function tap(chant: Chant) {
    if (!isAuthenticated) {
      setPendingChant(chant);
      setShowAuthModal(true);
      return;
    }
    navigate('/count', { state: { chant } });
  }

  function onFav(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    toggleFav(id);
  }

  function authOk() {
    setShowAuthModal(false);
    if (pendingChant) navigate('/count', { state: { chant: pendingChant } });
    setPendingChant(null);
  }

  function guestOk() {
    setShowAuthModal(false);
    consumeGuestSession();
    if (pendingChant) navigate('/count', { state: { chant: pendingChant, isGuest: true } });
    setPendingChant(null);
  }

  return (
    <div className="min-h-screen bg-s0 relative">
      <Background intensity="subtle" />
      <div className="absolute inset-0 sacred-gradient pointer-events-none" />

      <div className="relative z-10 min-h-screen">
        <header
          className="sticky top-0 z-30 px-5 pt-10 pb-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(to bottom, var(--s0) 60%, transparent)' }}
        >
          <div className="flex items-center gap-2.5">
            <OmSymbol size={18} className="text-accent" />
            <h1 className="font-display text-lg font-semibold text-t0 tracking-tight">Naam Japa</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-t2 hover:text-t0 transition-all active:scale-90"
            >
              {theme === 'night' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-full bg-accent\/10 border border-accent\/15 flex items-center justify-center text-accent transition-all active:scale-90"
              >
                <User className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="h-8 px-3 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center gap-1.5 text-t2 hover:text-t0 text-[12px] font-medium transition-all active:scale-95"
              >
                <User className="w-3 h-3" />
                Sign In
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="px-5 mb-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-t4 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search mantras..."
                  className="w-full py-2.5 pl-10 pr-10 rounded-xl bg-white/[0.05] border border-white/[0.06] text-t0 placeholder-t4 text-[13px] focus:outline-none focus:border-accent-med transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-t3 hover:text-t0 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {search ? (
              <div className="px-5 pb-10">
                <p className="text-t4 text-[10px] mb-4 uppercase tracking-[0.15em] font-semibold">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </p>
                {filtered.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-t3 text-sm">Nothing found</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filtered.map(c => (
                      <button
                        key={c.id}
                        onClick={() => tap(c)}
                        className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.07] active:scale-[0.98] transition-all text-left"
                      >
                        <ChantArtwork chant={c} className="w-11 h-11 rounded-xl flex-shrink-0" omSize={20} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-t0 text-[13px] truncate">{c.name}</h3>
                          <p className="text-t3 text-[11px] truncate mt-0.5">{c.subtitle}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-t4 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="pb-20">
                <HeroSpotlight
                  chants={chants}
                  isAuthenticated={isAuthenticated}
                  onTap={tap}
                />

                <PopularList
                  chants={chants}
                  isFavorite={isFavorite}
                  onTap={tap}
                  onFav={onFav}
                />

                {favorites.length > 0 && (
                  <FavoritesRow chants={favorites} onTap={tap} />
                )}

                <MantraGrid chants={chants} onTap={tap} />

                <WideCarousel
                  title="Quick Start"
                  icon={<Clock className="w-3.5 h-3.5" />}
                  chants={chants}
                  onTap={tap}
                />

                {withRounds.length > 0 && (
                  <MalaRoundsRow chants={withRounds} onTap={tap} />
                )}

                {dbCollections.map(({ collection, chants: colChants }) => (
                  <CollectionSection
                    key={collection.id}
                    collection={collection}
                    chants={colChants}
                    isFavorite={isFavorite}
                    onTap={tap}
                    onFav={onFav}
                  />
                ))}

                <AllChantsList
                  chants={chants}
                  isAuthenticated={isAuthenticated}
                  isFavorite={isFavorite}
                  onTap={tap}
                  onFav={onFav}
                />

                <div className="px-5 pb-8 text-center">
                  <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent mx-auto mb-4" />
                  <OmSymbol size={20} className="text-t4 mx-auto mb-2 opacity-50" />
                  <p className="text-t4 text-[10px] tracking-wide">More chants coming soon</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => { setShowAuthModal(false); setPendingChant(null); }}
          onSuccess={authOk}
          showGuestOption={canPlayAsGuest && !pendingChant?.requires_auth}
          onGuest={guestOk}
        />
      )}
    </div>
  );
}

export default Home;
