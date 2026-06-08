import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrutalBox from '@/src/components/BrutalBox';
import SText from '@/src/components/SText';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { radii, spacing, brutalBorder } from '@/src/constants/theme';
import type { AnalyticsInsight } from '@/services/analyticsService';
import type { ThemeColors } from '@/src/constants/colors';

function toneBg(colors: ThemeColors): Record<AnalyticsInsight['tone'], string> {
  return {
    neutral: colors.surfaceAlt,
    warning: colors.expenseBg,
    positive: colors.incomeBg,
  };
}

interface InsightCardProps {
  insight: AnalyticsInsight;
}

export default function InsightCard({ insight }: InsightCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
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
    })
  );

  return (
    <BrutalBox bg={toneBg(colors)[insight.tone]} shadow={3} contentStyle={styles.card}>
      <View style={[styles.icon, brutalBorder(undefined, colors)]}>
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
