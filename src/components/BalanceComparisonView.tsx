import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BalanceComparison } from '@/services/monthlyBalanceService';
import { formatMonthLabel } from '@/lib/month';
import { formatCOP } from '@/src/utils/currency';
import SText from '@/src/components/SText';
import BrutalBox from '@/src/components/BrutalBox';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

const RESULT_CONFIG = {
  gain: {
    icon: 'trending-up' as const,
    emoji: '🎉',
    title: '¡Ganancia!',
    subtitle: 'Tu balance mejoró respecto al mes comparado',
    bg: colors.incomeBg,
    accent: '#15803D',
  },
  loss: {
    icon: 'trending-down' as const,
    emoji: '😔',
    title: 'Pérdida',
    subtitle: 'Tu balance bajó respecto al mes comparado',
    bg: colors.expenseBg,
    accent: colors.expense,
  },
  neutral: {
    icon: 'remove' as const,
    emoji: '😐',
    title: 'Sin cambio',
    subtitle: 'Tu balance se mantiene igual',
    bg: colors.bgAlt,
    accent: colors.textMuted,
  },
};

interface BalanceComparisonViewProps {
  comparison: BalanceComparison;
  compact?: boolean;
}

export default function BalanceComparisonView({
  comparison,
  compact = false,
}: BalanceComparisonViewProps) {
  const cfg = RESULT_CONFIG[comparison.result];
  const iconScale = useSharedValue(0.6);
  const iconRotate = useSharedValue(0);
  const cardScale = useSharedValue(0.95);

  useEffect(() => {
    cardScale.value = withSpring(1, { damping: 12 });

    if (comparison.result === 'gain') {
      iconScale.value = withSequence(
        withSpring(1.35, { damping: 6 }),
        withSpring(1, { damping: 10 })
      );
      iconRotate.value = withSequence(
        withTiming(-8, { duration: 120 }),
        withTiming(8, { duration: 120 }),
        withTiming(0, { duration: 120 })
      );
    } else if (comparison.result === 'loss') {
      iconScale.value = withSpring(1, { damping: 14 });
      iconRotate.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 80 }),
          withTiming(4, { duration: 80 }),
          withTiming(0, { duration: 80 })
        ),
        3,
        false
      );
    } else {
      iconScale.value = withSpring(1, { damping: 14 });
    }
  }, [comparison.result]);

  const iconAnim = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const diffPrefix = comparison.difference > 0 ? '+' : '';

  return (
    <Animated.View style={cardAnim}>
      <BrutalBox bg={cfg.bg} contentStyle={[styles.card, compact && styles.cardCompact]}>
        <Animated.View style={[styles.iconCircle, brutalBorder(2), iconAnim]}>
          <SText style={styles.emoji}>{cfg.emoji}</SText>
        </Animated.View>

        <SText variant="headline" style={[styles.title, { color: cfg.accent }]}>
          {cfg.title}
        </SText>
        <SText variant="footnote" color={colors.textSecondary} style={styles.subtitle}>
          {cfg.subtitle}
        </SText>

        <View style={[styles.diffBox, brutalBorder(2)]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.accent} style={{ flexShrink: 0 }} />
          <SText
            variant="title3"
            style={{ fontWeight: '800', color: cfg.accent, flexShrink: 1 }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {diffPrefix}{formatCOP(Math.abs(comparison.difference))}
          </SText>
          {comparison.percentChange !== null && (
            <SText variant="caption1" style={{ fontWeight: '700', color: cfg.accent }}>
              {diffPrefix}{comparison.percentChange.toFixed(1)}%
            </SText>
          )}
        </View>

        <View style={styles.monthsRow}>
          <View style={styles.monthCol}>
            <SText variant="caption2" color={colors.textMuted}>MES ACTUAL</SText>
            <SText variant="caption1" style={{ fontWeight: '700' }}>
              {formatMonthLabel(comparison.referenceMonth, 'MMM yyyy')}
            </SText>
            <SText variant="body" style={{ fontWeight: '800', marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
              {formatCOP(comparison.referenceBalance)}
            </SText>
          </View>
          <SText variant="headline" color={colors.textMuted} style={{ flexShrink: 0 }}>vs</SText>
          <View style={styles.monthCol}>
            <SText variant="caption2" color={colors.textMuted}>COMPARADO</SText>
            <SText variant="caption1" style={{ fontWeight: '700' }}>
              {formatMonthLabel(comparison.compareMonth, 'MMM yyyy')}
            </SText>
            <SText variant="body" style={{ fontWeight: '800', marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
              {formatCOP(comparison.compareBalance)}
            </SText>
          </View>
        </View>
      </BrutalBox>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.xl, alignItems: 'center' },
  cardCompact: { padding: spacing.lg },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emoji: { fontSize: 32 },
  title: { fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  subtitle: { textAlign: 'center', marginBottom: spacing.lg },
  diffBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    maxWidth: '100%',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  monthsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.sm,
    minWidth: 0,
  },
  monthCol: { flex: 1, alignItems: 'center', minWidth: 0 },
});
