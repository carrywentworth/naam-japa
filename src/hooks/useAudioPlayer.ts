import { useRef, useState, useCallback, useEffect } from 'react';
import type { PlaybackSpeed } from '../types';

interface AudioPlayerState {
  isPlaying: boolean;
  currentCount: number;
  isComplete: boolean;
  speed: PlaybackSpeed;
}

const SPEED_STORAGE_KEY = 'naam-japa-speed';

function loadSavedSpeed(): PlaybackSpeed {
  try {
    const saved = parseFloat(localStorage.getItem(SPEED_STORAGE_KEY) ?? '1');
    if ([0.75, 1, 1.25, 1.5, 2, 3, 4].includes(saved)) return saved as PlaybackSpeed;
  } catch {}
  return 1;
}

function createBellBuffer(audioCtx: AudioContext): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const duration = 2.5;
  const length = sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  const fundamentalFreq = 528;
  const harmonics = [
    { freq: fundamentalFreq, amp: 0.4 },
    { freq: fundamentalFreq * 2, amp: 0.15 },
    { freq: fundamentalFreq * 3, amp: 0.08 },
    { freq: fundamentalFreq * 5.2, amp: 0.05 },
  ];

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 1.8) * (1 - Math.exp(-t * 80));
    let sample = 0;
    for (const h of harmonics) {
      sample += Math.sin(2 * Math.PI * h.freq * t) * h.amp;
    }
    data[i] = sample * envelope;
  }

  return buffer;
}

export function useAudioPlayer(
  audioUrl: string | null,
  durationMs: number,
  targetCount: number,
  isUnlimited: boolean,
  onComplete: () => void
) {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentCount: 0,
    isComplete: false,
    speed: loadSavedSpeed(),
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const bellBufferRef = useRef<AudioBuffer | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const remainingTimeRef = useRef(0);
  const lastTickTimeRef = useRef(0);
  const speedRef = useRef(state.speed);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playBell = useCallback(() => {
    const ctx = getAudioContext();
    if (!bellBufferRef.current) {
      bellBufferRef.current = createBellBuffer(ctx);
    }
    const source = ctx.createBufferSource();
    source.buffer = bellBufferRef.current;
    source.playbackRate.value = speedRef.current;
    source.connect(ctx.destination);
    source.start();
  }, [getAudioContext]);

  const playAudioElement = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.playbackRate = speedRef.current;
      audioElementRef.current.play();
    }
  }, []);

  const getScaledDuration = useCallback(() => {
    return durationMs / speedRef.current;
  }, [durationMs]);

  const scheduleNext = useCallback(() => {
    if (!isPlayingRef.current || isPausedRef.current) return;

    countRef.current += 1;
    setState(s => ({ ...s, currentCount: countRef.current }));

    if (!isUnlimited && countRef.current >= targetCount) {
      isPlayingRef.current = false;
      setState(s => ({ ...s, isPlaying: false, isComplete: true }));
      onComplete();
      return;
    }

    if (audioUrl) {
      playAudioElement();
    } else {
      playBell();
    }

    const delay = getScaledDuration();
    lastTickTimeRef.current = Date.now();
    remainingTimeRef.current = delay;
    timerRef.current = setTimeout(scheduleNext, delay);
  }, [audioUrl, targetCount, isUnlimited, onComplete, playBell, playAudioElement, getScaledDuration]);

  const play = useCallback(() => {
    if (state.isComplete) return;

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    isPlayingRef.current = true;
    isPausedRef.current = false;
    setState(s => ({ ...s, isPlaying: true }));

    if (countRef.current === 0) {
      if (audioUrl) {
        playAudioElement();
      } else {
        playBell();
      }
      countRef.current = 1;
      setState(s => ({ ...s, currentCount: 1 }));

      if (!isUnlimited && targetCount === 1) {
        timerRef.current = setTimeout(() => {
          isPlayingRef.current = false;
          setState(s => ({ ...s, isPlaying: false, isComplete: true }));
          onComplete();
        }, getScaledDuration());
        return;
      }

      const delay = getScaledDuration();
      lastTickTimeRef.current = Date.now();
      remainingTimeRef.current = delay;
      timerRef.current = setTimeout(scheduleNext, delay);
    } else {
      const delay = remainingTimeRef.current > 0 ? remainingTimeRef.current : getScaledDuration();
      lastTickTimeRef.current = Date.now();
      timerRef.current = setTimeout(scheduleNext, delay);
    }
  }, [state.isComplete, getAudioContext, audioUrl, targetCount, isUnlimited, onComplete, playBell, playAudioElement, scheduleNext, getScaledDuration]);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    isPlayingRef.current = false;
    setState(s => ({ ...s, isPlaying: false }));

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const elapsed = Date.now() - lastTickTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  }, []);

  const restart = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isPlayingRef.current = false;
    isPausedRef.current = false;
    countRef.current = 0;
    remainingTimeRef.current = 0;
    setState(s => ({ ...s, isPlaying: false, currentCount: 0, isComplete: false }));
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isPlayingRef.current = false;
    isPausedRef.current = false;

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    setState(s => ({ ...s, isPlaying: false }));
  }, []);

  const setSpeed = useCallback((newSpeed: PlaybackSpeed) => {
    speedRef.current = newSpeed;
    setState(s => ({ ...s, speed: newSpeed }));

    try {
      localStorage.setItem(SPEED_STORAGE_KEY, String(newSpeed));
    } catch {}

    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = newSpeed;
    }

    if (isPlayingRef.current && timerRef.current) {
      clearTimeout(timerRef.current);
      const elapsed = Date.now() - lastTickTimeRef.current;
      const oldRemaining = remainingTimeRef.current - elapsed;
      const newRemaining = Math.max(50, oldRemaining * (speedRef.current > 1 ? 1 / speedRef.current : 1));
      remainingTimeRef.current = newRemaining;
      lastTickTimeRef.current = Date.now();
      timerRef.current = setTimeout(scheduleNext, newRemaining);
    }
  }, [scheduleNext]);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.preload = 'auto';
      audioElementRef.current = audio;
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, [audioUrl]);

  return {
    ...state,
    play,
    pause,
    restart,
    stop,
    setSpeed,
  };
}
