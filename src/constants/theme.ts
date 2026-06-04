import { Platform, ViewStyle } from 'react-native';

export const colors = {
  bg: '#F5F0E8',
  bgAlt: '#EDE6DA',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF9E6',
  ink: '#000000',
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
} as const;

export const brutal = {
  border: 3,
  shadowOffset: 5,
  shadowOffsetSm: 3,
  shadowOffsetLg: 6,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Hard neo-brutalist shadow (no blur) */
export function hardShadow(offset = brutal.shadowOffset): ViewStyle {
  if (Platform.OS === 'web') {
    return { boxShadow: `${offset}px ${offset}px 0 0 ${colors.ink}` } as ViewStyle;
  }
  return {
    shadowColor: colors.ink,
    shadowOffset: { width: offset, height: offset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  };
}

export function brutalBorder(width = brutal.border): ViewStyle {
  return { borderWidth: width, borderColor: colors.ink };
}
