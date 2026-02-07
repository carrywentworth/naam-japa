import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, Loader2, Search, Moon, Sun } from 'lucide-react';
import Background from '../components/Background';
import OmSymbol from '../components/OmSymbol';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../hooks/useFavorites';
import { supabase } from '../lib/supabase';
import { trackEvent, AnalyticsEvents } from '../lib/analytics';
import type { Chant } from '../types';

function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toggle: toggleFav, isFavorite } = useFavorites();

  const [chants, setChants] = useState<Chant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    trackEvent(AnalyticsEvents.PAGE_VIEW, null, { page: 'home' });
    async function fetchChants() {
      const { data } = await supabase
        .from('chants')
        .select('*')
        .eq('status', 'published')
        .order('sort_order', { ascending: true });

      if (data) setChants(data);
      setLoading(false);
    }
    fetchChants();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    const list = term
      ? chants.filter(
          c =>
            c.name.toLowerCase().includes(term) ||
            c.subtitle.toLowerCase().includes(term)
        )
      : chants;

    return [
      ...list.filter(c => isFavorite(c.id)),
      ...list.filter(c => !isFavorite(c.id)),
    ];
  }, [chants, search, isFavorite]);

  const selectedChant = chants.find(c => c.id === selectedId);

  function handleNext() {
    if (!selectedChant) return;
    navigate('/count', { state: { chant: selectedChant } });
  }

  return (
    <div className="min-h-screen bg-s0 relative">
      <Background intensity="subtle" />
      <div className="absolute inset-0 sacred-gradient pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col px-5 pt-safe">
        <header className="pt-10 pb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <OmSymbol size={26} className="text-accent" />
              <h1 className="font-display text-2xl font-semibold text-t0">
                Naam Japa
              </h1>
            </div>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-s2-40 border border-s2 flex items-center justify-center text-t2 hover:text-t0 transition-all active:scale-90"
              aria-label="Toggle theme"
            >
              {theme === 'night' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-t3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chants..."
              className="w-full py-3 pl-10 pr-4 rounded-xl bg-s2-40 border border-s2 text-t0 placeholder-t3 text-sm focus:outline-none focus:border-accent-med focus:ring-1 focus:ring-accent-subtle transition-all"
            />
          </div>
        </header>

        <div className="flex-1 pb-28">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-t3 text-sm">No chants found</p>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in-up">
              {filtered.map((chant, i) => {
                const isSelected = selectedId === chant.id;
                const fav = isFavorite(chant.id);

                return (
                  <div key={chant.id} className="relative" style={{ animationDelay: `${i * 80}ms` }}>
                    <button
                      onClick={() => setSelectedId(chant.id)}
                      className={`w-full text-left rounded-2xl p-5 pr-14 transition-all duration-300 ${
                        isSelected
                          ? 'glass-card glow-ring scale-[1.01]'
                          : 'bg-s2-40 border border-s2 hover:bg-s2-60 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                            isSelected
                              ? 'border-accent-med bg-accent'
                              : 'border-t3'
                          }`}
                          style={isSelected ? { borderColor: 'var(--accent)', backgroundColor: 'var(--accent)' } : undefined}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--s0)' }} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-display text-lg font-medium transition-colors duration-300 ${
                              isSelected ? 'text-accent-light' : 'text-t0'
                            }`}
                          >
                            {chant.name}
                          </h3>
                          <p className="text-t3 text-sm mt-0.5 truncate">
                            {chant.subtitle}
                          </p>
                          {chant.has_rounds && (
                            <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-accent\/10 text-accent border border-accent\/20 mt-2">
                              Rounds available
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFav(chant.id);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-t3 hover:text-accent transition-all active:scale-90"
                      aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart
                        className={`w-4.5 h-4.5 transition-all ${fav ? 'fill-current text-accent' : ''}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-5 pb-8 z-20">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, var(--s0) 40%, var(--s0) 20%, transparent)`,
            }}
          />
          <button
            onClick={handleNext}
            disabled={!selectedChant}
            className={`relative w-full py-4 rounded-2xl font-medium text-base flex items-center justify-center gap-2 transition-all duration-300 ${
              selectedChant
                ? 'bg-accent hover:bg-accent-light active:scale-[0.98] shadow-accent'
                : 'bg-s2-40 text-t4 cursor-not-allowed'
            }`}
            style={selectedChant ? { color: 'var(--s0)' } : undefined}
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
