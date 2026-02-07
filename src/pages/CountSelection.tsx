import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Infinity, Info, X } from 'lucide-react';
import Background from '../components/Background';
import type { Chant, SessionConfig } from '../types';
import { COUNT_PRESETS, ROUND_PRESETS, REPS_PER_ROUND } from '../types';

function CountSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const chant = (location.state as { chant: Chant })?.chant;

  const [mode, setMode] = useState<'counts' | 'rounds'>('counts');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  if (!chant) {
    navigate('/home', { replace: true });
    return null;
  }

  const isCustom = customValue.length > 0 && !selectedPreset && !isUnlimited;
  const hasSelection = selectedPreset !== null || isUnlimited || isCustom;
  const canStart = hasSelection && !(isCustom && parseInt(customValue, 10) <= 0);

  function getTargetCount(): number {
    if (isUnlimited) return 0;
    if (selectedPreset !== null) {
      return mode === 'rounds' ? selectedPreset * REPS_PER_ROUND : selectedPreset;
    }
    return parseInt(customValue, 10) || 0;
  }

  function handlePresetClick(value: number) {
    setSelectedPreset(value);
    setIsUnlimited(false);
    setCustomValue('');
  }

  function handleUnlimited() {
    setIsUnlimited(true);
    setSelectedPreset(null);
    setCustomValue('');
  }

  function handleCustomChange(val: string) {
    const cleaned = val.replace(/\D/g, '');
    setCustomValue(cleaned);
    setSelectedPreset(null);
    setIsUnlimited(false);
  }

  function handleStart() {
    if (!canStart) return;

    const config: SessionConfig = {
      chant,
      mode: isUnlimited ? 'unlimited' : mode === 'rounds' ? 'rounds' : 'count',
      targetCount: getTargetCount(),
    };

    navigate('/player', { state: { config } });
  }

  const presets = mode === 'rounds' ? ROUND_PRESETS : COUNT_PRESETS;

  return (
    <div className="min-h-screen bg-s0 relative">
      <Background intensity="subtle" gradient={chant.theme_gradient} />
      <div className="absolute inset-0 sacred-gradient pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col px-5 pt-safe">
        <header className="pt-8 pb-6 animate-fade-in">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 text-t2 hover:text-t0 transition-colors mb-6 -ml-1 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>

          <h2 className="font-display text-xl font-medium text-accent-light">
            {chant.name}
          </h2>
          <p className="text-t3 text-sm mt-1">{chant.subtitle}</p>
        </header>

        <div className="flex-1 pb-32 animate-fade-in-up">
          {chant.has_rounds && (
            <div className="flex gap-1 p-1 rounded-xl bg-s2-40 mb-6">
              {(['counts', 'rounds'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setSelectedPreset(null);
                    setCustomValue('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    mode === m
                      ? 'bg-accent\/15 text-accent border border-accent\/20'
                      : 'text-t3 hover:text-t1'
                  }`}
                >
                  {m === 'counts' ? 'Counts' : 'Rounds'}
                </button>
              ))}
            </div>
          )}

          {mode === 'rounds' && (
            <p className="text-t3 text-xs mb-4 bg-s2-40 rounded-lg px-3 py-2 border border-s2">
              1 round = {REPS_PER_ROUND} repetitions
            </p>
          )}

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-t1 uppercase tracking-wider">
              Select {mode === 'rounds' ? 'Rounds' : 'Count'}
            </h3>
            <button
              onClick={() => setShowInfo(true)}
              className="flex items-center gap-1 text-xs text-t3 hover:text-accent transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              Why these counts?
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {presets.map(value => (
              <button
                key={value}
                onClick={() => handlePresetClick(value)}
                className={`py-4 rounded-xl text-center font-medium transition-all duration-300 ${
                  selectedPreset === value
                    ? 'glass-card glow-ring text-accent-light scale-[1.03]'
                    : 'bg-s2-40 border border-s2 text-t1 hover:bg-s2-60 active:scale-95'
                }`}
              >
                <span className="text-lg">{value.toLocaleString()}</span>
                {mode === 'rounds' && (
                  <span className="block text-xs text-t3 mt-0.5">
                    {(value * REPS_PER_ROUND).toLocaleString()} reps
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleUnlimited}
            className={`w-full py-4 rounded-xl text-center font-medium flex items-center justify-center gap-2 transition-all duration-300 mb-6 ${
              isUnlimited
                ? 'glass-card glow-ring text-accent-light scale-[1.01]'
                : 'bg-s2-40 border border-s2 text-t1 hover:bg-s2-60 active:scale-95'
            }`}
          >
            <Infinity className="w-5 h-5" />
            Unlimited
            <span className="text-xs text-t3 ml-1">Runs until you stop</span>
          </button>

          <div>
            <label className="text-sm font-medium text-t2 mb-2 block">
              Custom {mode === 'rounds' ? 'rounds' : 'count'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={customValue}
              onChange={e => handleCustomChange(e.target.value)}
              placeholder={`Enter ${mode === 'rounds' ? 'rounds' : 'a number'}...`}
              className="w-full py-3.5 px-4 rounded-xl bg-s2-40 border border-s2 text-t0 placeholder-t4 focus:outline-none focus:border-accent-med focus:ring-1 focus:ring-accent-subtle transition-all"
            />
            {isCustom && mode === 'rounds' && parseInt(customValue, 10) > 0 && (
              <p className="text-xs text-t3 mt-1.5 ml-1">
                = {(parseInt(customValue, 10) * REPS_PER_ROUND).toLocaleString()} repetitions
              </p>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-5 pb-8 z-20">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, var(--s0) 40%, var(--s0) 20%, transparent)`,
            }}
          />
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`relative w-full py-4 rounded-2xl font-medium text-base transition-all duration-300 ${
              canStart
                ? 'bg-accent hover:bg-accent-light active:scale-[0.98] shadow-accent'
                : 'bg-s2-40 text-t4 cursor-not-allowed'
            }`}
            style={canStart ? { color: 'var(--s0)' } : undefined}
          >
            Begin Japa
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          />
          <div className="relative glass-card rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 pb-8 sm:mx-4 animate-fade-in-up" style={{ backgroundColor: 'var(--s1)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-medium text-accent-light">
                Why these counts?
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="w-8 h-8 rounded-full bg-s2-40 flex items-center justify-center text-t2 hover:text-t0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-t2 leading-relaxed">
              <p>
                <strong className="text-t0">108</strong> is the most sacred number in Hindu tradition. A standard mala has 108 beads plus a guru bead that is not counted.
              </p>
              <p>
                <strong className="text-t0">27 and 54</strong> are fractions of 108, commonly used with smaller malas.
              </p>
              <p>
                <strong className="text-t0">1008</strong> is mentioned in scriptures as an excellent count for dedicated practice.
              </p>
              <p>
                <strong className="text-t0">10, 11, 21</strong> are recommended by modern teachers as accessible daily practice counts.
              </p>
              <p>
                <strong className="text-t0">Rounds (1 = 108)</strong> are used in ISKCON tradition, where 16 rounds daily is the recommended minimum.
              </p>
              <p className="text-t3 text-xs pt-2 border-t border-s2">
                Traditions vary. Follow the guidance of your teacher or lineage.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CountSelection;
