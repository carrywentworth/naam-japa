import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, Search, Moon, Sun, Lock, User, Play, X, ChevronRight } from 'lucide-react';
import Background from '../components/Background';
import OmSymbol from '../components/OmSymbol';
import AuthModal from '../components/AuthModal';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { supabase } from '../lib/supabase';
import { trackEvent, AnalyticsEvents } from '../lib/analytics';
import type { Chant } from '../types';

const THEME_GRADIENTS: Record<string, { bg: string; accent: string }> = {
  amber: {
    bg: 'linear-gradient(160deg, #150a02 0%, #3d1a05 30%, #7a3a10 60%, #3d1a05 85%, #150a02 100%)',
    accent: '#d4813a',
  },
  rose: {
    bg: 'linear-gradient(160deg, #0e0208 0%, #380a1e 30%, #6e1438 60%, #380a1e 85%, #0e0208 100%)',
    accent: '#c44070',
  },
  teal: {
    bg: 'linear-gradient(160deg, #020c10 0%, #053545 30%, #0a5878 60%, #053545 85%, #020c10 100%)',
    accent: '#3a90b8',
  },
};

const DEFAULT_THEME = {
  bg: 'linear-gradient(160deg, #060f1a 0%, #0c2040 30%, #143070 60%, #0c2040 85%, #060f1a 100%)',
  accent: '#4a7aaa',
};

function getTheme(chant: Chant) {
  return THEME_GRADIENTS[chant.theme_gradient] ?? DEFAULT_THEME;
}

interface HeroProps {
  chant: Chant;
  onTap: () => void;
  isAuthenticated: boolean;
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent) => void;
}

function Hero({ chant, onTap, isAuthenticated, isFav, onToggleFav }: HeroProps) {
  const isLocked = chant.requires_auth && !isAuthenticated;
  const theme = getTheme(chant);

  return (
    <button
      onClick={onTap}
      className="relative w-full overflow-hidden text-left active:scale-[0.99] transition-transform duration-150"
      style={{ height: '340px' }}
    >
      <div className="absolute inset-0" style={{ background: theme.bg }} />

      {chant.background_image_url && (
        <img
          src={chant.background_image_url}
          alt={chant.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {!chant.background_image_url && (
        <div className="absolute inset-0 flex items-center justify-center">
          <OmSymbol size={160} className="text-white opacity-[0.06]" />
        </div>
      )}

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, #07101c 0%, rgba(7,16,28,0.88) 22%, rgba(7,16,28,0.4) 55%, rgba(7,16,28,0.1) 100%)',
        }}
      />

      <div className="absolute top-0 inset-x-0 h-20" style={{ background: 'linear-gradient(to bottom, rgba(7,16,28,0.6) 0%, transparent 100%)' }} />

      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {chant.featured && (
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
              style={{ backgroundColor: theme.accent, color: '#07101c' }}
            >
              Featured
            </span>
          )}
          {chant.category && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium text-white/70 bg-black/35 backdrop-blur-sm border border-white/10">
              {chant.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLocked && (
            <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-white/80" />
            </div>
          )}
          <button
            onClick={onToggleFav}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all active:scale-90"
          >
            <Heart className={`w-3.5 h-3.5 transition-all ${isFav ? 'fill-current text-accent' : 'text-white/70'}`} />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 px-5 pb-6">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-2"
          style={{ color: theme.accent }}
        >
          Sacred Chanting
        </p>
        <h2 className="font-display text-[28px] font-semibold text-white leading-tight mb-1.5 tracking-tight">
          {chant.name}
        </h2>
        <p className="text-white/50 text-sm mb-5 truncate font-light">{chant.subtitle}</p>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: 'rgba(212,165,116,1)', color: '#07101c' }}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Begin Practice
          </div>
          {chant.has_rounds && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-white/70">
              108 rounds
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

interface ChantCardProps {
  chant: Chant;
  onTap: (chant: Chant) => void;
  isAuthenticated: boolean;
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent, id: string) => void;
}

function ChantCard({ chant, onTap, isAuthenticated, isFav, onToggleFav }: ChantCardProps) {
  const isLocked = chant.requires_auth && !isAuthenticated;
  const theme = getTheme(chant);

  return (
    <div
      className="relative flex-shrink-0 w-[152px] cursor-pointer group"
      onClick={() => onTap(chant)}
    >
      <div
        className="relative w-full h-[210px] rounded-2xl overflow-hidden mb-3"
        style={{ background: theme.bg }}
      >
        {chant.background_image_url && (
          <img
            src={chant.background_image_url}
            alt={chant.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {!chant.background_image_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <OmSymbol size={64} className="text-white opacity-[0.12]" />
          </div>
        )}

        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(7,16,28,0.9) 0%, rgba(7,16,28,0.2) 55%, transparent 100%)' }}
        />

        {isLocked && (
          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Lock className="w-3 h-3 text-white/80" />
          </div>
        )}

        {isFav && !isLocked && (
          <button
            onClick={e => onToggleFav(e, chant.id)}
            className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90"
          >
            <Heart className="w-3 h-3 fill-current text-accent" />
          </button>
        )}

        {!isFav && !isLocked && (
          <button
            onClick={e => onToggleFav(e, chant.id)}
            className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
          >
            <Heart className="w-3 h-3 text-white/70" />
          </button>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2.5">
          {chant.has_rounds && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/60 bg-black/40 border border-white/10 px-1.5 py-0.5 rounded">
              Rounds
            </span>
          )}
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 rounded-full bg-accent/90 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 fill-current" style={{ color: 'var(--s0)' }} />
          </div>
        </div>
      </div>

      <h3 className="text-t0 text-[13px] font-semibold leading-tight truncate tracking-tight">{chant.name}</h3>
      <p className="text-t3 text-[11px] truncate mt-0.5 leading-relaxed">{chant.subtitle}</p>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between px-5 mb-4">
      <h2 className="text-[17px] font-bold text-t0 tracking-tight">{title}</h2>
      {count !== undefined && (
        <span className="text-[11px] font-medium text-t3 bg-s2-60 border border-s2 px-2.5 py-1 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toggle: toggleFav, isFavorite } = useFavorites();
  const { isAuthenticated, canPlayAsGuest, consumeGuestSession } = useAuth();

  const [chants, setChants] = useState<Chant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingChant, setPendingChant] = useState<Chant | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const heroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    trackEvent(AnalyticsEvents.PAGE_VIEW, null, { page: 'home' });
    async function fetchChants() {
      const { data } = await supabase
        .from('chants')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data) setChants(data);
      setLoading(false);
    }
    fetchChants();
  }, []);

  const published = useMemo(() => chants.filter(c => c.status === 'published'), [chants]);

  const categories = useMemo(() => {
    const cats = [...new Set(published.map(c => c.category).filter(Boolean))];
    return cats.length > 1 ? ['All', ...cats] : [];
  }, [published]);

  const heroPool = useMemo(() => {
    const featured = published.filter(c => c.featured);
    return featured.length > 0 ? featured : published.slice(0, Math.min(3, published.length));
  }, [published]);

  useEffect(() => {
    if (heroPool.length <= 1) return;
    heroTimerRef.current = setInterval(() => setHeroIndex(i => (i + 1) % heroPool.length), 6000);
    return () => { if (heroTimerRef.current) clearInterval(heroTimerRef.current); };
  }, [heroPool.length]);

  const heroChant = heroPool[heroIndex] ?? published[0] ?? chants[0];

  const filteredByCategory = useMemo(() => {
    if (activeCategory === 'All') return chants;
    return chants.filter(c => c.category === activeCategory);
  }, [chants, activeCategory]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return filteredByCategory;
    return filteredByCategory.filter(
      c => c.name.toLowerCase().includes(term) || c.subtitle.toLowerCase().includes(term)
    );
  }, [filteredByCategory, search]);

  const favorites = useMemo(() => chants.filter(c => isFavorite(c.id)), [chants, isFavorite]);

  function handleChantTap(chant: Chant) {
    if (!isAuthenticated) {
      setPendingChant(chant);
      setShowAuthModal(true);
      return;
    }
    navigate('/count', { state: { chant } });
  }

  function handleToggleFav(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    toggleFav(id);
  }

  function handleAuthSuccess() {
    setShowAuthModal(false);
    if (pendingChant) navigate('/count', { state: { chant: pendingChant } });
    setPendingChant(null);
  }

  function handleGuestPlay() {
    setShowAuthModal(false);
    consumeGuestSession();
    if (pendingChant) navigate('/count', { state: { chant: pendingChant, isGuest: true } });
    setPendingChant(null);
  }

  return (
    <div className="min-h-screen bg-s0 relative">
      <Background intensity="subtle" />
      <div className="absolute inset-0 sacred-gradient pointer-events-none" />

      <div className="relative z-10 min-h-screen overflow-y-auto">

        <header
          className="sticky top-0 z-30 px-5 pt-10 pb-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(to bottom, var(--s0) 50%, transparent)' }}
        >
          <div className="flex items-center gap-2.5">
            <OmSymbol size={20} className="text-accent" />
            <h1 className="font-display text-xl font-semibold text-t0 tracking-tight">Naam Japa</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-s2-60 border border-s2 flex items-center justify-center text-t2 hover:text-t0 transition-all active:scale-90"
              aria-label="Toggle theme"
            >
              {theme === 'night' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-full bg-accent\/15 border border-accent\/20 flex items-center justify-center text-accent hover:text-accent-light transition-all active:scale-90"
                aria-label="Profile"
              >
                <User className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="h-9 px-3.5 rounded-full bg-s2-60 border border-s2 flex items-center gap-1.5 text-t2 hover:text-t0 text-sm transition-all active:scale-95"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-40">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : (
          <div className="animate-fade-in">

            {!search && heroChant && (
              <div className="mb-4">
                <Hero
                  chant={heroChant}
                  onTap={() => handleChantTap(heroChant)}
                  isAuthenticated={isAuthenticated}
                  isFav={isFavorite(heroChant.id)}
                  onToggleFav={e => { e.stopPropagation(); toggleFav(heroChant.id); }}
                />

                {heroPool.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-3">
                    {heroPool.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (heroTimerRef.current) clearInterval(heroTimerRef.current);
                          setHeroIndex(i);
                        }}
                        className={`transition-all duration-300 rounded-full ${
                          i === heroIndex ? 'w-5 h-1.5 bg-accent' : 'w-1.5 h-1.5 bg-t4 hover:bg-t3'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="px-5 mb-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-t3 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search chants..."
                  className="w-full py-3 pl-10 pr-10 rounded-2xl bg-s2-60 border border-s2 text-t0 placeholder-t3 text-sm focus:outline-none focus:border-accent-med transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-s2-70 flex items-center justify-center text-t3 hover:text-t0 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {categories.length > 0 && !search && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-5 mb-6 pb-0.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                      activeCategory === cat
                        ? 'bg-accent text-s0'
                        : 'bg-s2-60 border border-s2 text-t2 hover:text-t0'
                    }`}
                    style={activeCategory === cat ? { color: 'var(--s0)' } : undefined}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {search ? (
              <div className="px-5 pb-10 animate-fade-in">
                <p className="text-t3 text-xs mb-4 uppercase tracking-wider font-semibold">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </p>
                {filtered.length === 0 ? (
                  <p className="text-t3 text-sm text-center py-12">No chants found for "{search}"</p>
                ) : (
                  <div className="space-y-2">
                    {filtered.map(chant => {
                      const isLocked = chant.requires_auth && !isAuthenticated;
                      const fav = isFavorite(chant.id);
                      const ct = getTheme(chant);
                      return (
                        <button
                          key={chant.id}
                          onClick={() => handleChantTap(chant)}
                          className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-s2-60 border border-s2 hover:bg-s2-70 active:scale-[0.98] transition-all text-left"
                        >
                          <div
                            className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden"
                            style={{ background: ct.bg }}
                          >
                            {chant.background_image_url ? (
                              <img src={chant.background_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <OmSymbol size={22} className="text-white opacity-25" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-t0 text-sm truncate tracking-tight">{chant.name}</h3>
                            <p className="text-t3 text-xs truncate mt-0.5">{chant.subtitle}</p>
                            {chant.has_rounds && (
                              <span className="inline-block text-[10px] mt-1.5 px-2 py-0.5 rounded-full bg-accent\/10 text-accent border border-accent\/20 font-medium">
                                Rounds
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={e => handleToggleFav(e, chant.id)}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-t3 hover:text-accent transition-colors"
                            >
                              <Heart className={`w-3.5 h-3.5 ${fav ? 'fill-current text-accent' : ''}`} />
                            </button>
                            {isLocked ? (
                              <Lock className="w-4 h-4 text-t4" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-t4" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="pb-16 animate-fade-in-up">

                {favorites.length > 0 && (
                  <div className="mb-8">
                    <SectionHeader title="Your Practice" />
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
                      {favorites.map(c => (
                        <ChantCard
                          key={c.id}
                          chant={c}
                          onTap={handleChantTap}
                          isAuthenticated={isAuthenticated}
                          isFav={isFavorite(c.id)}
                          onToggleFav={handleToggleFav}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <SectionHeader title="All Chants" count={filteredByCategory.length} />
                  {filteredByCategory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-5">
                      <OmSymbol size={36} className="text-t4 mb-3" />
                      <p className="text-t3 text-sm">No chants in this category</p>
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
                      {filteredByCategory.map(c => (
                        <ChantCard
                          key={c.id}
                          chant={c}
                          onTap={handleChantTap}
                          isAuthenticated={isAuthenticated}
                          isFav={isFavorite(c.id)}
                          onToggleFav={handleToggleFav}
                        />
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => { setShowAuthModal(false); setPendingChant(null); }}
          onSuccess={handleAuthSuccess}
          showGuestOption={canPlayAsGuest && !pendingChant?.requires_auth}
          onGuest={handleGuestPlay}
        />
      )}
    </div>
  );
}

export default Home;
