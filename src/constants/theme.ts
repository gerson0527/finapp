import { Platform, ViewStyle, TextStyle } from 'react-native';
import { lightColors, type ThemeColors } from '@/src/constants/colors';

/** @deprecated Usa useTheme().colors en componentes */
export const colors = lightColors;

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

export type BrutalBorderStyle = Pick<ViewStyle, 'borderWidth' | 'borderColor'>;

/** Quita el outline azul de inputs en web sin romper tipos de TextInput */
export const webTextInputReset: TextStyle =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : {};

export function hardShadow(offset = brutal.shadowOffset, palette: ThemeColors = lightColors): ViewStyle {
  if (Platform.OS === 'web') {
    return { boxShadow: `${offset}px ${offset}px 0 0 ${palette.shadow}` } as ViewStyle;
  }
  return {
    shadowColor: palette.shadow,
    shadowOffset: { width: offset, height: offset },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  };
}

export function brutalBorder(width: number = brutal.border, palette: ThemeColors = lightColors): BrutalBorderStyle {
  return { borderWidth: width, borderColor: palette.ink };
}
