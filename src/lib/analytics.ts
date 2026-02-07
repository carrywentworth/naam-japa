import { supabase } from './supabase';

function getDeviceId(): string {
  const KEY = 'naam-japa-device-id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

let currentSessionId = crypto.randomUUID();

export function resetSessionId() {
  currentSessionId = crypto.randomUUID();
}

export function getSessionCount(): number {
  return parseInt(localStorage.getItem('naam-japa-session-count') ?? '0', 10);
}

export function incrementSessionCount(): number {
  const count = getSessionCount() + 1;
  localStorage.setItem('naam-japa-session-count', String(count));
  return count;
}

export const AnalyticsEvents = {
  APP_OPEN: 'app_open',
  PAGE_VIEW: 'page_view',
  CHANT_SELECTED: 'chant_selected',
  SESSION_START: 'session_start',
  SESSION_PAUSE: 'session_pause',
  SESSION_RESUME: 'session_resume',
  SESSION_COMPLETE: 'session_complete',
  SESSION_EXIT: 'session_exit',
  SPEED_CHANGE: 'speed_change',
  FOCUS_MODE_TOGGLE: 'focus_mode_toggle',
  SHARE_ATTEMPT: 'share_attempt',
  SHARE_SUCCESS: 'share_success',
  THEME_CHANGE: 'theme_change',
  FAVORITE_TOGGLED: 'favorite_toggled',
  SEARCH_USED: 'search_used',
  COUNT_SELECTED: 'count_selected',
  BACKGROUND_TOGGLE: 'background_toggle',
  PLAYBACK_ERROR: 'playback_error',
} as const;

export function trackEvent(
  eventType: string,
  chantId: string | null,
  payload: Record<string, unknown> = {}
) {
  const deviceId = getDeviceId();

  supabase
    .from('analytics_events')
    .insert({
      event_type: eventType,
      device_id: deviceId,
      session_id: currentSessionId,
      chant_id: chantId || null,
      payload,
    })
    .then(() => {});
}
