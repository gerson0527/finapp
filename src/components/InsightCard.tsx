import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrutalBox from '@/src/components/BrutalBox';
import SText from '@/src/components/SText';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';
import type { AnalyticsInsight } from '@/services/analyticsService';

const TONE_BG: Record<AnalyticsInsight['tone'], string> = {
  neutral: colors.surfaceAlt,
  warning: colors.expenseBg,
  positive: colors.incomeBg,
};

interface InsightCardProps {
  insight: AnalyticsInsight;
}

export default function InsightCard({ insight }: InsightCardProps) {
  return (
    <BrutalBox bg={TONE_BG[insight.tone]} shadow={3} contentStyle={styles.card}>
      <View style={[styles.icon, brutalBorder()]}>
        <Ionicons name={insight.icon} size={18} color={colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <SText variant="footnote" style={{ fontWeight: '900' }}>{insight.title}</SText>
        <SText variant="caption2" color={colors.textSecondary} style={{ marginTop: 4, lineHeight: 18 }}>
          {insight.body}
        </SText>
      </View>
    </BrutalBox>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
