import { useState } from 'react';
import { Gauge } from 'lucide-react';
import { SPEED_OPTIONS, type PlaybackSpeed } from '../types';

function SpeedControl({
  speed,
  onSpeedChange,
  compact = false,
}: {
  speed: PlaybackSpeed;
  onSpeedChange: (s: PlaybackSpeed) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-s2-40 border border-s2 text-t1 text-xs font-medium hover:bg-s2-60 transition-all active:scale-95"
        >
          <Gauge className="w-3.5 h-3.5" />
          {speed === 1 ? '1x' : `${speed}x`}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-fade-in">
              <div className="glass-card rounded-xl p-1.5 flex gap-1">
                {SPEED_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      onSpeedChange(s);
                      setOpen(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      speed === s
                        ? 'bg-accent text-s0'
                        : 'text-t2 hover:text-t0 hover:bg-s2-60'
                    }`}
                    style={speed === s ? { color: 'var(--s0)' } : undefined}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {SPEED_OPTIONS.map(s => (
        <button
          key={s}
          onClick={() => onSpeedChange(s)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            speed === s
              ? 'bg-accent text-s0 shadow-accent'
              : 'bg-s2-40 border border-s2 text-t2 hover:text-t0 hover:bg-s2-60'
          }`}
          style={speed === s ? { color: 'var(--s0)' } : undefined}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}

export default SpeedControl;
