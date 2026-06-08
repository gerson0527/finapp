import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/src/constants/colors';
import { useTheme } from '@/src/context/ThemeContext';

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T
): T {
  const { colors, isDark } = useTheme();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, isDark]);
}
