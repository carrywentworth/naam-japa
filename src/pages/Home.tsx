import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, Loader2, Search, Moon, Sun, Lock, User, Play, X } from 'lucide-react';
import Background from '../components/Background';
import OmSymbol from '../components/OmSymbol';
import AuthModal from '../components/AuthModal';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { supabase } from '../lib/supabase';
import { trackEvent, AnalyticsEvents } from '../lib/analytics';
import type { Chant } from '../types';

const GRADIENT_FALLBACKS: Record<string, string> = {
  amber: 'linear-gradient(155deg, #1c0e04 0%, #3d1e08 45%, #0a0602 100%)',
  rose: 'linear-gradient(155deg, #140610 0%, #2e0d24 45%, #09030a 100%)',
  teal: 'linear-gradient(155deg, #031412 0%, #073028 45%, #020908 100%)',
};
const DEFAULT_GRADIENT = 'linear-gradient(155deg, #07101c 0%, #0f2240 45%, #040c18 100%)';

function cardGradient(chant: Chant) {
  return GRADIENT_FALLBACKS[chant.theme_gradient] ?? DEFAULT_GRADIENT;
}

interface ChantCardProps {
  chant: Chant;
  onTap: (chant: Chant) => void;
  isAuthenticated: boolean;
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent, id: string) => void;
  size?: 'sm' | 'md';
}

function ChantCard({ chant, onTap, isAuthenticated, isFav, onToggleFav, size = 'md' }: ChantCardProps) {
  const isLocked = chant.requires_auth && !isAuthenticated;
  const width = size === 'sm' ? 'w-[136px]' : 'w-[154px]';
  const height = size === 'sm' ? 'h-[176px]' : 'h-[200px]';

  return (
    <div
      className={`relative flex-shrink-0 ${width} cursor-pointer group`}
      onClick={() => onTap(chant)}
    >
      <div
        className={`relative w-full ${height} rounded-2xl overflow-hidden mb-2.5`}
        style={{ background: cardGradient(chant) }}
      >
        {chant.background_image_url && (
          <img
            src={chant.background_image_url}
            alt={chant.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {!chant.background_image_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-15">
            <OmSymbol size={52} className="text-white" />
          </div>
        )}

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(7,16,28,0.92) 0%, rgba(7,16,28,0.3) 50%, transparent 100%)',
          }}
        />

        {isLocked && (
          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Lock className="w-3 h-3 text-white" />
          </div>
        )}

        <button
          onClick={e => onToggleFav(e, chant.id)}
          className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity active:scale-90"
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-3 h-3 transition-all ${isFav ? 'fill-current text-accent' : 'text-white'}`} />
        </button>

        {chant.has_rounds && (
          <div className="absolute bottom-2.5 left-2.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-white/70">
            Rounds
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 p-2.5">
          <div className="w-7 h-7 rounded-full bg-accent/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
            <Play className="w-3 h-3 fill-current text-s0" style={{ color: 'var(--s0)' }} />
          </div>
        </div>
      </div>

      <h3 className="text-t0 text-xs font-medium leading-snug truncate">{chant.name}</h3>
      <p className="text-t3 text-[11px] truncate mt-0.5">{chant.subtitle}</p>
    </div>
  );
}

interface SectionRowProps {
  title: string;
  rightEl?: React.ReactNode;
  children: React.ReactNode;
}

function SectionRow({ title, rightEl, children }: SectionRowProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between px-5 mb-3.5">
        <h2 className="text-[15px] font-semibold text-t0 tracking-tight">{title}</h2>
        {rightEl}
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
        {children}
      </div>
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
  const heroPool = useMemo(() => published.filter(c => c.featured).length > 0 ? published.filter(c => c.featured) : published.slice(0, 3), [published]);

  useEffect(() => {
    if (heroPool.length <= 1) return;
    heroTimerRef.current = setInterval(() => setHeroIndex(i => (i + 1) % heroPool.length), 5000);
    return () => { if (heroTimerRef.current) clearInterval(heroTimerRef.current); };
  }, [heroPool.length]);

  const heroChant = heroPool[heroIndex] ?? published[0] ?? chants[0];

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return chants;
    return chants.filter(c => c.name.toLowerCase().includes(term) || c.subtitle.toLowerCase().includes(term));
  }, [chants, search]);

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

  function handleHeroTap() {
    if (heroChant) handleChantTap(heroChant);
  }

  return (
    <div className="min-h-screen bg-s0 relative">
      <Background intensity="subtle" />
      <div className="absolute inset-0 sacred-gradient pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen overflow-y-auto">

        <header
          className="sticky top-0 z-30 px-5 pt-10 pb-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(to bottom, var(--s0) 55%, transparent)' }}
        >
          <div className="flex items-center gap-2.5">
            <OmSymbol size={22} className="text-accent" />
            <h1 className="font-display text-xl font-semibold text-t0">Naam Japa</h1>
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
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : (
          <div className="flex-1 pb-12 animate-fade-in">

            {!search && heroChant && (
              <div className="px-5 mb-5">
                <button
                  onClick={handleHeroTap}
                  className="relative w-full rounded-3xl overflow-hidden active:scale-[0.99] transition-transform duration-200 block"
                  style={{ height: '250px' }}
                >
                  <div className="absolute inset-0" style={{ background: cardGradient(heroChant) }} />

                  {heroChant.background_image_url && (
                    <img
                      src={heroChant.background_image_url}
                      alt={heroChant.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {!heroChant.background_image_url && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <OmSymbol size={110} className="text-white" />
                    </div>
                  )}

                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(7,16,28,0.97) 0%, rgba(7,16,28,0.55) 40%, rgba(7,16,28,0.05) 100%)',
                    }}
                  />

                  {heroChant.featured && (
                    <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-accent" style={{ color: 'var(--s0)' }}>
                      Featured
                    </div>
                  )}

                  {heroChant.requires_auth && !isAuthenticated && (
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <h2 className="font-display text-2xl font-semibold text-white leading-tight mb-1">
                      {heroChant.name}
                    </h2>
                    <p className="text-white/60 text-sm mb-4 truncate">{heroChant.subtitle}</p>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-accent"
                        style={{ color: 'var(--s0)' }}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Begin Practice
                      </div>
                      {heroChant.has_rounds && (
                        <span className="text-xs text-white/60 bg-black/30 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-white/10">
                          Rounds
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {heroPool.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-3">
                    {heroPool.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (heroTimerRef.current) clearInterval(heroTimerRef.current);
                          setHeroIndex(i);
                        }}
                        className={`transition-all duration-300 rounded-full ${i === heroIndex ? 'w-5 h-1.5 bg-accent' : 'w-1.5 h-1.5 bg-t4 hover:bg-t3'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="px-5 mb-6">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-t3" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search chants..."
                  className="w-full py-3 pl-10 pr-10 rounded-xl bg-s2-60 border border-s2 text-t0 placeholder-t3 text-sm focus:outline-none focus:border-accent-med focus:ring-1 focus:ring-accent-subtle transition-all"
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

            {search ? (
              <div className="px-5 pb-8 animate-fade-in">
                <p className="text-t3 text-xs mb-4 uppercase tracking-wider font-medium">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </p>
                {filtered.length === 0 ? (
                  <p className="text-t3 text-sm text-center py-8">No chants found</p>
                ) : (
                  <div className="space-y-2.5">
                    {filtered.map(chant => {
                      const isLocked = chant.requires_auth && !isAuthenticated;
                      const fav = isFavorite(chant.id);
                      return (
                        <button
                          key={chant.id}
                          onClick={() => handleChantTap(chant)}
                          className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-s2-60 border border-s2 hover:bg-s2-70 active:scale-[0.98] transition-all text-left"
                        >
                          <div
                            className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden"
                            style={{ background: cardGradient(chant) }}
                          >
                            {chant.background_image_url ? (
                              <img src={chant.background_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-30">
                                <OmSymbol size={24} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-t0 text-sm truncate">{chant.name}</h3>
                            <p className="text-t3 text-xs truncate mt-0.5">{chant.subtitle}</p>
                            {chant.has_rounds && (
                              <span className="inline-block text-[10px] mt-1.5 px-2 py-0.5 rounded-full bg-accent\/10 text-accent border border-accent\/20">
                                Rounds available
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
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
              <div className="animate-fade-in-up">

                {favorites.length > 0 && (
                  <SectionRow
                    title="Your Practice"
                    rightEl={<Heart className="w-3.5 h-3.5 text-accent fill-current" />}
                  >
                    {favorites.map(c => (
                      <ChantCard
                        key={c.id}
                        chant={c}
                        onTap={handleChantTap}
                        isAuthenticated={isAuthenticated}
                        isFav={isFavorite(c.id)}
                        onToggleFav={handleToggleFav}
                        size="sm"
                      />
                    ))}
                  </SectionRow>
                )}

                <SectionRow
                  title="All Chants"
                  rightEl={
                    <span className="text-[11px] text-t3 bg-s2-60 border border-s2 px-2.5 py-1 rounded-full">
                      {chants.length}
                    </span>
                  }
                >
                  {chants.map(c => (
                    <ChantCard
                      key={c.id}
                      chant={c}
                      onTap={handleChantTap}
                      isAuthenticated={isAuthenticated}
                      isFav={isFavorite(c.id)}
                      onToggleFav={handleToggleFav}
                    />
                  ))}
                </SectionRow>

                {chants.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 px-5">
                    <OmSymbol size={40} className="text-t4 mb-4" />
                    <p className="text-t3 text-sm">No chants available yet</p>
                  </div>
                )}
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
