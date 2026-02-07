import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, RotateCcw, Settings2, Share2, Sparkles, Check, Download } from 'lucide-react';
import Background from '../components/Background';
import OmSymbol from '../components/OmSymbol';
import { shareResult } from '../lib/shareUtils';
import type { SessionConfig, SessionResult } from '../types';

function Completion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { result, config } = (location.state as {
    result: SessionResult;
    config: SessionConfig;
  }) ?? {};

  const [shareStatus, setShareStatus] = useState<string | null>(null);

  if (!result || !config) {
    navigate('/home', { replace: true });
    return null;
  }

  function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes < 60) return `${minutes}m ${seconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  function handleRepeat() {
    navigate('/player', { state: { config }, replace: true });
  }

  function handleChangeCount() {
    navigate('/count', { state: { chant: config.chant } });
  }

  async function handleShare() {
    setShareStatus('loading');
    const status = await shareResult(result, config.chant.theme_gradient);
    setShareStatus(status);
    if (status !== 'loading') {
      setTimeout(() => setShareStatus(null), 2500);
    }
  }

  const title = result.wasCompleted ? 'Session Complete' : 'Session Ended';
  const subtitle = result.wasCompleted
    ? 'May your practice bring peace and clarity'
    : 'Every repetition counts on the path';

  return (
    <div className="min-h-screen bg-s0 relative">
      <Background intensity="vibrant" gradient={config.chant.theme_gradient} />
      <div className="absolute inset-0 sacred-gradient pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-5 pt-safe">
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm w-full">
          <div className="animate-fade-in mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-breathe" style={{ backgroundColor: 'var(--accent)' }} />
              <div className="relative w-28 h-28 rounded-full border border-accent-med flex items-center justify-center animate-glow">
                <Sparkles className="w-12 h-12 text-accent-light" />
              </div>
            </div>
          </div>

          <div className="text-center animate-fade-in-up mb-10">
            <h1 className="font-display text-3xl font-semibold text-accent-light mb-2">
              {title}
            </h1>
            <p className="text-t2 text-sm font-light">
              {subtitle}
            </p>
          </div>

          <div className="w-full glass-card rounded-2xl p-6 space-y-4 animate-fade-in-up mb-10">
            <div className="flex items-center gap-3 pb-4 border-b border-s2">
              <OmSymbol size={24} className="text-accent flex-shrink-0" />
              <span className="font-display text-lg text-accent-light">{result.chantName}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-t3 text-xs uppercase tracking-wider mb-1">
                  Repetitions
                </p>
                <p className="font-display text-2xl font-semibold text-t0">
                  {result.completedCount.toLocaleString()}
                  {!result.wasCompleted && result.targetCount > 0 && (
                    <span className="text-t3 text-base font-normal">
                      /{result.targetCount.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-t3 text-xs uppercase tracking-wider mb-1">
                  Duration
                </p>
                <p className="font-display text-2xl font-semibold text-t0">
                  {formatDuration(result.durationMs)}
                </p>
              </div>
            </div>

            {result.mode === 'rounds' && (
              <div className="pt-2 border-t border-s2">
                <p className="text-t3 text-xs uppercase tracking-wider mb-1">
                  Rounds
                </p>
                <p className="font-display text-xl font-semibold text-t0">
                  {Math.ceil(result.completedCount / 108)}
                </p>
              </div>
            )}
          </div>

          <div className="w-full space-y-3 animate-fade-in-up">
            <button
              onClick={handleRepeat}
              className="w-full py-4 rounded-2xl bg-accent font-medium text-base flex items-center justify-center gap-2 hover:bg-accent-light transition-all active:scale-[0.98] shadow-accent"
              style={{ color: 'var(--s0)' }}
            >
              <RotateCcw className="w-5 h-5" />
              Repeat Session
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleShare}
                disabled={shareStatus === 'loading'}
                className="py-3.5 rounded-2xl bg-s2-40 border border-s2 text-t1 font-medium text-sm flex items-center justify-center gap-2 hover:bg-s2-60 transition-all active:scale-[0.98]"
              >
                {shareStatus === 'shared' || shareStatus === 'copied' ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    {shareStatus === 'copied' ? 'Copied' : 'Shared'}
                  </>
                ) : shareStatus === 'downloaded' ? (
                  <>
                    <Download className="w-4 h-4 text-green-400" />
                    Saved
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share
                  </>
                )}
              </button>

              <button
                onClick={handleChangeCount}
                className="py-3.5 rounded-2xl bg-s2-40 border border-s2 text-t1 font-medium text-sm flex items-center justify-center gap-2 hover:bg-s2-60 transition-all active:scale-[0.98]"
              >
                <Settings2 className="w-4 h-4" />
                Change Count
              </button>
            </div>

            <button
              onClick={() => navigate('/home')}
              className="w-full py-3.5 rounded-2xl text-t3 font-medium text-sm flex items-center justify-center gap-2 hover:text-t1 transition-all active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>

        <div className="pb-8 pt-6">
          <p className="text-t4 text-xs text-center">
            Om Shanti
          </p>
        </div>
      </div>
    </div>
  );
}

export default Completion;
