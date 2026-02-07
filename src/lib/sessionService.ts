import { supabase } from './supabase';
import type { SessionResult } from '../types';

export async function saveUserSession(
  userId: string,
  chantId: string,
  result: SessionResult
) {
  await supabase.from('user_sessions').insert({
    user_id: userId,
    chant_id: chantId,
    chant_name: result.chantName,
    mode: result.mode,
    target_count: result.targetCount,
    completed_count: result.completedCount,
    duration_ms: result.durationMs,
    was_completed: result.wasCompleted,
  });

  const today = new Date().toISOString().split('T')[0];
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('total_sessions, total_chants, total_duration_ms, current_streak, longest_streak, last_session_date')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return;

  let streak = profile.current_streak;
  let longest = profile.longest_streak;
  const lastDate = profile.last_session_date;

  if (lastDate) {
    const last = new Date(lastDate);
    const now = new Date(today);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
  } else {
    streak = 1;
  }

  if (streak > longest) longest = streak;

  await supabase.from('user_profiles').update({
    total_sessions: profile.total_sessions + 1,
    total_chants: profile.total_chants + result.completedCount,
    total_duration_ms: profile.total_duration_ms + result.durationMs,
    current_streak: streak,
    longest_streak: longest,
    last_session_date: today,
  }).eq('id', userId);
}

export async function fetchRecentSessions(userId: string, limit = 10) {
  const { data } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
