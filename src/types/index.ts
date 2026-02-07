export interface Chant {
  id: string;
  name: string;
  subtitle: string;
  audio_url: string | null;
  audio_file_path: string | null;
  duration_ms: number;
  has_rounds: boolean;
  background_image_url: string | null;
  background_video_url: string | null;
  theme_gradient: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AppConfig {
  default_theme: 'night' | 'dawn';
  enable_focus_mode: boolean;
  enable_share_badge: boolean;
  enable_speed_controls: boolean;
  donation_link: string;
  donation_prompt_frequency: number;
}

export interface SessionConfig {
  chant: Chant;
  mode: 'count' | 'rounds' | 'unlimited';
  targetCount: number;
}

export interface SessionResult {
  chantName: string;
  completedCount: number;
  targetCount: number;
  mode: 'count' | 'rounds' | 'unlimited';
  durationMs: number;
  wasCompleted: boolean;
}

export const COUNT_PRESETS = [10, 11, 21, 27, 54, 108, 1008] as const;
export const ROUND_PRESETS = [1, 4, 8, 16] as const;
export const REPS_PER_ROUND = 108;

export const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2, 3, 4] as const;
export type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];
