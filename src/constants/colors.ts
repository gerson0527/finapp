/** Paletas neo-brutalistas claro / oscuro */
export const lightColors = {
  bg: '#F5F0E8',
  bgAlt: '#EDE6DA',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF9E6',
  ink: '#000000',
  shadow: '#000000',
  yellow: '#FFE566',
  yellowDark: '#FFD93D',
  pink: '#FF6B8A',
  pinkLight: '#FFB3C6',
  income: '#4ADE80',
  incomeBg: '#DCFCE7',
  expense: '#FF4757',
  expenseBg: '#FFE0E3',
  warning: '#FFB800',
  text: '#000000',
  textSecondary: '#333333',
  textMuted: '#666666',
  error: '#FF4757',
  errorBg: '#FFE0E3',
  decorative: 'rgba(255,255,255,0.6)',
  statusBar: 'dark' as 'light' | 'dark',
} as const;

export const darkColors = {
  bg: '#0D0D14',
  bgAlt: '#12121F',
  surface: '#1A1A2E',
  surfaceAlt: '#222240',
  ink: '#E2E8F0',
  shadow: '#000000',
  yellow: '#7C3AED',
  yellowDark: '#6D28D9',
  pink: '#A78BFA',
  pinkLight: '#2E1F4A',
  income: '#34D399',
  incomeBg: '#132822',
  expense: '#FB7185',
  expenseBg: '#281820',
  warning: '#A78BFA',
  text: '#E2E8F0',
  textSecondary: '#6B7280',
  textMuted: '#6B7280',
  error: '#FB7185',
  errorBg: '#281820',
  decorative: 'rgba(124, 58, 237, 0.08)',
  statusBar: 'light' as 'light' | 'dark',
} as const;

export type ThemeColors = {
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  shadow: string;
  yellow: string;
  yellowDark: string;
  pink: string;
  pinkLight: string;
  income: string;
  incomeBg: string;
  expense: string;
  expenseBg: string;
  warning: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  error: string;
  errorBg: string;
  decorative: string;
  statusBar: 'light' | 'dark';
};

export type ThemeMode = 'light' | 'dark' | 'system';
