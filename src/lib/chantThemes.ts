import type { Chant } from '../types';

export interface ChantTheme {
  bg: string;
  accent: string;
  textAccent: string;
}

const THEME_MAP: Record<string, ChantTheme> = {
  amber: {
    bg: 'linear-gradient(160deg, #1a0c02 0%, #4a2008 30%, #8a4215 60%, #3a1a06 100%)',
    accent: '#d4813a',
    textAccent: '#eaa362',
  },
  rose: {
    bg: 'linear-gradient(160deg, #10030a 0%, #401020 30%, #782040 60%, #2a0c16 100%)',
    accent: '#c44070',
    textAccent: '#e06090',
  },
  teal: {
    bg: 'linear-gradient(160deg, #020e12 0%, #08404a 30%, #0e6880 60%, #063040 100%)',
    accent: '#3ab0c8',
    textAccent: '#60d0e8',
  },
};

const DEFAULT_THEME: ChantTheme = {
  bg: 'linear-gradient(160deg, #080e18 0%, #102850 30%, #1a3c78 60%, #0c2040 100%)',
  accent: '#5a90c0',
  textAccent: '#80b0e0',
};

export function getChantTheme(chant: Chant): ChantTheme {
  return THEME_MAP[chant.theme_gradient] ?? DEFAULT_THEME;
}
