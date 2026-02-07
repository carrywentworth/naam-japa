import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, RotateCcw, X, Square, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import Background from '../components/Background';
import ProgressRing from '../components/ProgressRing';
import SpeedControl from '../components/SpeedControl';
import CompletionPopup from '../components/CompletionPopup';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { trackEvent, AnalyticsEvents, incrementSessionCount } from '../lib/analytics';
import type { SessionConfig, SessionResult } from '../types';

function getAudioUrl(chant: { id: string; audio_url: string | null; audio_file_path: string | null } | undefined): string | null {
  if (!chant) return null;
  if (chant.audio_file_path) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/stream-audio?id=${chant.id}`;
  }
  return chant.audio_url;
}

function Player() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = (location.state as { config: SessionConfig })?.config;

  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [completionResult, setCompletionResult] = useState<SessionResult | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isUnlimited = config?.mode === 'unlimited';
  const audioUrl = getAudioUrl(config?.chant);

  function getElapsedTotal() {
    return pausedElapsedRef.current +
      (startTimeRef.current ? Date.now() - startTimeRef.current : 0);
  }

  const handleComplete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const result: SessionResult = {
      chantName: config?.chant.name ?? '',
      completedCount: config?.targetCount ?? 0,
      targetCount: config?.targetCount ?? 0,
      mode: config?.mode ?? 'count',
      durationMs: getElapsedTotal(),
      wasCompleted: true,
    };
    incrementSessionCount();
    trackEvent(AnalyticsEvents.SESSION_COMPLETE, config?.chant.id ?? null, {
      completedCount: result.completedCount,
      targetCount: result.targetCount,
      durationMs: result.durationMs,
      mode: result.mode,
    });
    setCompletionResult(result);
  }, [config]);

  const {
    isPlaying,
    currentCount,
    speed,
    play,
    pause,
    restart,
    stop,
    setSpeed,
  } = useAudioPlayer(
    audioUrl,
    config?.chant.duration_ms ?? 3000,
    config?.targetCount ?? 108,
    isUnlimited,
    handleComplete
  );

  useEffect(() => {
    if (isPlaying) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      timerRef.current = setInterval(() => {
        setElapsedMs(getElapsedTotal());
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (startTimeRef.current) {
        pausedElapsedRef.current += Date.now() - startTimeRef.current;
        startTimeRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  if (!config) {
    navigate('/home', { replace: true });
    return null;
  }

  const progress = isUnlimited
    ? 0
    : config.targetCount > 0
    ? currentCount / config.targetCount
    : 0;

  const hasChantMedia = config.chant.background_image_url || config.chant.background_video_url;

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function handleRestart() {
    if (currentCount > 0) {
      setShowRestartConfirm(true);
    } else {
      restart();
    }
  }

  function confirmRestart() {
    setShowRestartConfirm(false);
    restart();
    pausedElapsedRef.current = 0;
    startTimeRef.current = null;
    setElapsedMs(0);
  }

  function handleExit() {
    stop();
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentCount > 0) {
      const result: SessionResult = {
        chantName: config.chant.name,
        completedCount: currentCount,
        targetCount: config.targetCount,
        mode: config.mode,
        durationMs: getElapsedTotal(),
        wasCompleted: false,
      };
      setCompletionResult(result);
    } else {
      navigate('/home');
    }
  }

  function handleStopUnlimited() {
    stop();
    if (timerRef.current) clearInterval(timerRef.current);

    const result: SessionResult = {
      chantName: config.chant.name,
      completedCount: currentCount,
      targetCount: 0,
      mode: 'unlimited',
      durationMs: getElapsedTotal(),
      wasCompleted: true,
    };
    setCompletionResult(result);
  }

  function handleRepeatFromPopup() {
    setCompletionResult(null);
    restart();
    pausedElapsedRef.current = 0;
    startTimeRef.current = null;
    setElapsedMs(0);
  }

  const ringSize = Math.min(280, window.innerWidth - 80);

  const beadCount = config.targetCount <= 108 ? config.targetCount : 27;
  const filledBeads = isUnlimited
    ? 0
    : config.targetCount <= 108
    ? currentCount
    : Math.floor((currentCount / config.targetCount) * 27);

  return (
    <div className="min-h-screen bg-s0 relative">
      <Background
        intensity="normal"
        gradient={config.chant.theme_gradient}
        imageUrl={config.chant.background_image_url}
        videoUrl={config.chant.background_video_url}
        showMedia={showBackground}
      />
      <div className="absolute inset-0 sacred-gradient pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col px-5 pt-safe">
        <header className={`pt-6 flex items-center justify-between animate-fade-in transition-opacity duration-300 ${focusMode ? 'opacity-0 pointer-events-none h-0 pt-0 overflow-hidden' : ''}`}>
          <button
            onClick={handleExit}
            className="w-10 h-10 rounded-full bg-s2-60 border border-s2 flex items-center justify-center text-t2 hover:text-t0 transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center flex-1 mx-4">
            <h2 className="font-display text-lg font-medium text-accent-light truncate">
              {config.chant.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {hasChantMedia && (
              <button
                onClick={() => setShowBackground(!showBackground)}
                className="w-10 h-10 rounded-full bg-s2-60 border border-s2 flex items-center justify-center text-t2 hover:text-t0 transition-colors active:scale-95"
                aria-label="Toggle background"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setFocusMode(true)}
              className="w-10 h-10 rounded-full bg-s2-60 border border-s2 flex items-center justify-center text-t2 hover:text-t0 transition-colors active:scale-95"
              aria-label="Focus mode"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </header>

        {focusMode && (
          <div className="pt-6 flex justify-end animate-fade-in">
            <button
              onClick={() => setFocusMode(false)}
              className="w-10 h-10 rounded-full bg-s2-40 border border-s2 flex items-center justify-center text-t3 hover:text-t0 transition-colors active:scale-95"
              aria-label="Exit focus mode"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center -mt-4">
          <div className="relative animate-fade-in">
            <ProgressRing
              progress={progress}
              size={ringSize}
              strokeWidth={3}
              showBeads={!isUnlimited && config.targetCount <= 1008}
              totalBeads={beadCount}
              filledBeads={filledBeads}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-5xl font-semibold text-accent-light tabular-nums">
                {currentCount.toLocaleString()}
              </span>
              {!isUnlimited && (
                <span className="text-t3 text-lg mt-1 tabular-nums">
                  / {config.targetCount.toLocaleString()}
                </span>
              )}
              {isUnlimited && (
                <span className="text-t3 text-sm mt-1 tracking-wider uppercase">
                  Unlimited
                </span>
              )}
            </div>
          </div>

          {!focusMode && (
            <div className="mt-5 text-t3 text-sm tabular-nums animate-fade-in">
              {formatTime(elapsedMs)}
            </div>
          )}
        </div>

        <div className={`pb-10 animate-fade-in-up transition-all duration-300 ${focusMode ? 'pb-16' : ''}`}>
          {!focusMode && (
            <div className="flex justify-center mb-5">
              <SpeedControl speed={speed} onSpeedChange={setSpeed} compact />
            </div>
          )}

          <div className="flex items-center justify-center gap-6 mb-4">
            {!focusMode && (
              <button
                onClick={handleRestart}
                className="w-14 h-14 rounded-full bg-s2-60 border border-s2 flex items-center justify-center text-t2 hover:text-t0 transition-all active:scale-90"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={isPlaying ? pause : play}
              className="w-20 h-20 rounded-full bg-accent flex items-center justify-center shadow-accent hover:bg-accent-light transition-all active:scale-90 animate-glow"
              style={{ color: 'var(--s0)' }}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>

            {!focusMode && (
              isUnlimited ? (
                <button
                  onClick={handleStopUnlimited}
                  disabled={currentCount === 0}
                  className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all active:scale-90 ${
                    currentCount > 0
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                      : 'bg-s2-60 border-s2 text-t4'
                  }`}
                >
                  <Square className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-14 h-14" />
              )
            )}
          </div>

          {!focusMode && config.mode === 'rounds' && (
            <p className="text-center text-t3 text-xs">
              Round {Math.floor(currentCount / 108) + (currentCount % 108 > 0 ? 1 : 0)} of{' '}
              {Math.ceil(config.targetCount / 108)}
            </p>
          )}

          {focusMode && (
            <button
              onClick={handleExit}
              className="mx-auto mt-4 px-4 py-2 rounded-lg text-t4 text-xs hover:text-t2 transition-colors"
            >
              Exit session
            </button>
          )}
        </div>
      </div>

      {showRestartConfirm && (
        <ConfirmDialog
          title="Restart session?"
          message="This will reset your count to zero."
          confirmLabel="Restart"
          onConfirm={confirmRestart}
          onCancel={() => setShowRestartConfirm(false)}
        />
      )}

      {completionResult && (
        <CompletionPopup
          result={completionResult}
          gradient={config.chant.theme_gradient}
          onRepeat={handleRepeatFromPopup}
          onHome={() => navigate('/home', { replace: true })}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onCancel} />
      <div className="relative rounded-2xl p-6 max-w-sm w-full animate-fade-in glass-card" style={{ backgroundColor: 'var(--s1)' }}>
        <h3 className="font-display text-lg font-medium text-t0 mb-2">{title}</h3>
        <p className="text-t3 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-s2-40 text-t1 font-medium text-sm hover:bg-s2-60 transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-accent font-medium text-sm hover:bg-accent-light transition-colors active:scale-95"
            style={{ color: 'var(--s0)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Player;
