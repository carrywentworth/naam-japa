import { useState } from 'react';
import { Home, RotateCcw, Share2, Sparkles, Check, Download } from 'lucide-react';
import { shareResult } from '../lib/shareUtils';
import OmSymbol from './OmSymbol';
import type { SessionResult } from '../types';

function CompletionPopup({
  result,
  gradient,
  onRepeat,
  onHome,
}: {
  result: SessionResult;
  gradient?: string;
  onRepeat: () => void;
  onHome: () => void;
}) {
  const [shareStatus, setShareStatus] = useState<string | null>(null);

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

  async function handleShare() {
    setShareStatus('loading');
    const status = await shareResult(result, gradient);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-overlay backdrop-blur-md" />

      <div className="relative w-full max-w-md sm:mx-4 animate-fade-in-up">
        <div className="glass-card rounded-t-3xl sm:rounded-2xl overflow-hidden">
          <div className="relative px-6 pt-8 pb-4">
            <div className="absolute inset-0 sacred-gradient opacity-60 pointer-events-none" />

            <div className="relative flex flex-col items-center">
              <div className="relative mb-5">
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-30 animate-breathe"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
                <div className="relative w-20 h-20 rounded-full border border-accent-med flex items-center justify-center animate-glow">
                  <Sparkles className="w-9 h-9 text-accent" />
                </div>
              </div>

              <h2 className="font-display text-2xl font-semibold text-t0 mb-1">
                {title}
              </h2>
              <p className="text-t3 text-sm font-light text-center">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="px-6 pb-4">
            <div className="rounded-xl bg-s2-40 border border-s2 p-4 space-y-3">
              <div className="flex items-center gap-2.5 pb-3 border-b border-s2">
                <OmSymbol size={20} className="text-accent flex-shrink-0" />
                <span className="font-display text-base text-t0">{result.chantName}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-t3 text-[11px] uppercase tracking-wider mb-0.5">
                    Repetitions
                  </p>
                  <p className="font-display text-xl font-semibold text-t0">
                    {result.completedCount.toLocaleString()}
                    {!result.wasCompleted && result.targetCount > 0 && (
                      <span className="text-t3 text-sm font-normal">
                        /{result.targetCount.toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-t3 text-[11px] uppercase tracking-wider mb-0.5">
                    Duration
                  </p>
                  <p className="font-display text-xl font-semibold text-t0">
                    {formatDuration(result.durationMs)}
                  </p>
                </div>
              </div>

              {result.mode === 'rounds' && (
                <div className="pt-2 border-t border-s2">
                  <p className="text-t3 text-[11px] uppercase tracking-wider mb-0.5">
                    Rounds
                  </p>
                  <p className="font-display text-lg font-semibold text-t0">
                    {Math.ceil(result.completedCount / 108)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 pb-8 space-y-2.5">
            <button
              onClick={onRepeat}
              className="w-full py-3.5 rounded-xl bg-accent text-s0 font-medium text-sm flex items-center justify-center gap-2 hover:bg-accent-light transition-all active:scale-[0.98] shadow-accent"
              style={{ color: 'var(--s0)' }}
            >
              <RotateCcw className="w-4 h-4" />
              Repeat Session
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleShare}
                disabled={shareStatus === 'loading'}
                className="py-3 rounded-xl bg-s2-40 border border-s2 text-t1 font-medium text-sm flex items-center justify-center gap-2 hover:bg-s2-60 transition-all active:scale-[0.98]"
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
                onClick={onHome}
                className="py-3 rounded-xl bg-s2-40 border border-s2 text-t1 font-medium text-sm flex items-center justify-center gap-2 hover:bg-s2-60 transition-all active:scale-[0.98]"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompletionPopup;
