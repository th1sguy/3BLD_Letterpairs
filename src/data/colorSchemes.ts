import type { ColorScheme } from '../types';

export const CUBE_COLORS = {
  white: '#f2f2f2',
  yellow: '#ffd500',
  green: '#009e60',
  blue: '#0051ba',
  red: '#c41e3a',
  orange: '#ff5800',
} as const;

export interface ColorSchemePreset {
  id: string;
  name: string;
  scheme: ColorScheme;
}

// Opposite pairs (white/yellow, green/blue, red/orange) are fixed by physical cube
// construction; presets below are just different orientations/mirrors of those pairs.
export const COLOR_SCHEME_PRESETS: ColorSchemePreset[] = [
  {
    id: 'white-green',
    name: 'White top / Green front (most common)',
    scheme: {
      U: CUBE_COLORS.white,
      D: CUBE_COLORS.yellow,
      F: CUBE_COLORS.green,
      B: CUBE_COLORS.blue,
      R: CUBE_COLORS.red,
      L: CUBE_COLORS.orange,
    },
  },
  {
    id: 'white-red',
    name: 'White top / Red front',
    scheme: {
      U: CUBE_COLORS.white,
      D: CUBE_COLORS.yellow,
      F: CUBE_COLORS.red,
      B: CUBE_COLORS.orange,
      R: CUBE_COLORS.green,
      L: CUBE_COLORS.blue,
    },
  },
  {
    id: 'yellow-red',
    name: 'Yellow top / Red front',
    scheme: {
      U: CUBE_COLORS.yellow,
      D: CUBE_COLORS.white,
      F: CUBE_COLORS.red,
      B: CUBE_COLORS.orange,
      R: CUBE_COLORS.blue,
      L: CUBE_COLORS.green,
    },
  },
];

export const DEFAULT_COLOR_SCHEME = COLOR_SCHEME_PRESETS[0].scheme;
