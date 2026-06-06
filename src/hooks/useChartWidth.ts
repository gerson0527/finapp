import { useWindowDimensions } from 'react-native';
import { spacing } from '@/src/constants/theme';

/** Ancho útil para gráficos dentro de ScrollView (xl) + BrutalBox (lg). */
export function useChartWidth(extraPadding = 0) {
  const { width } = useWindowDimensions();
  const horizontal = spacing.xl * 2 + spacing.lg * 2 + extraPadding;
  return Math.max(Math.floor(width - horizontal), 240);
}
