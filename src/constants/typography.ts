import { Platform, TextStyle } from 'react-native';

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  default: undefined,
});

/** Mejora renderizado en web (evita texto pixelado) */
export const textSharp: TextStyle =
  Platform.OS === 'web'
    ? ({
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
      } as TextStyle)
    : {};

type Weight = '400' | '500' | '600' | '700';

function txt(size: number, weight: Weight, letterSpacing: number, lineHeight?: number): TextStyle {
  return {
    fontFamily,
    fontSize: size,
    fontWeight: weight,
    letterSpacing,
    lineHeight: lineHeight ?? Math.round(size * 1.35),
    ...textSharp,
  };
}

export const typography = {
  largeTitle: txt(34, '700', 0.2, 40),
  title1: txt(28, '700', 0.1, 34),
  title2: txt(22, '700', 0.1, 28),
  title3: txt(20, '600', 0.1, 26),
  headline: txt(17, '600', 0, 22),
  body: txt(16, '400', 0, 22),
  callout: txt(15, '400', 0, 20),
  subhead: txt(14, '400', 0, 19),
  footnote: txt(13, '400', 0, 18),
  caption1: txt(12, '500', 0, 16),
  caption2: txt(11, '500', 0, 14),
  tabLabel: txt(11, '600', 0.15, 14),
  micro: txt(10, '600', 0.1, 13),

  amountLarge: txt(28, '700', -0.3, 34),
  amountMedium: txt(20, '700', -0.3, 26),
  amountSmall: txt(15, '700', -0.2, 20),

  label: {
    fontFamily,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
    ...textSharp,
  },

  /** Títulos brutalistas — bold pero legible */
  brutalTitle: {
    fontFamily,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
    ...textSharp,
  },
};
