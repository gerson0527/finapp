import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavingsGoal } from '@/services/savingsService';
import { formatCOP } from '@/src/utils/currency';
import SText from '@/src/components/SText';
import DonutChart from './DonutChart';
import BrutalBox from './BrutalBox';
import AnimatedPressable from './AnimatedPressable';
import FadeInView from './FadeInView';
import ProgressBar from './ProgressBar';
import { colors, radii, spacing } from '@/src/constants/theme';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onContribute?: () => void;
  index?: number;
}

export default function SavingsGoalCard({ goal, onContribute, index = 0 }: SavingsGoalCardProps) {
  const percentage = goal.target_amount > 0
    ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100)
    : 0;

  const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);

  return (
    <FadeInView index={index}>
      <BrutalBox style={{ marginBottom: spacing.lg }} contentStyle={styles.card}>
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: goal.color }]}>
            <Ionicons name={(goal.icon as any) || 'flag'} size={22} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <SText variant="title3" style={{ fontWeight: '700' }}>{goal.title}</SText>
            {goal.subtitle ? (
              <View style={[styles.subtitlePill, { backgroundColor: `${goal.color}33` }]}>
                <SText variant="caption2" style={{ fontWeight: '600' }}>{goal.subtitle}</SText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.chartRow}>
          <DonutChart
            percentage={percentage}
            size={120}
            strokeWidth={12}
            color={goal.color}
            bgColor={colors.bgAlt}
          />
          <View style={styles.statsCol}>
            <View style={styles.statBlock}>
              <SText variant="caption2" color={colors.textMuted}>Ahorrado</SText>
              <SText variant="headline" color={colors.ink} style={{ fontWeight: '700', marginTop: 4 }}>
                {formatCOP(goal.saved_amount)}
              </SText>
            </View>
            <View style={styles.statBlock}>
              <SText variant="caption2" color={colors.textMuted}>Meta</SText>
              <SText variant="headline" style={{ fontWeight: '700', marginTop: 4 }}>
                {formatCOP(goal.target_amount)}
              </SText>
            </View>
            <View style={styles.statBlock}>
              <SText variant="caption2" color={colors.textMuted}>Falta</SText>
              <SText variant="subhead" color={colors.textSecondary} style={{ fontWeight: '600', marginTop: 4 }}>
                {formatCOP(remaining)}
              </SText>
            </View>
          </View>
        </View>

        <ProgressBar percentage={percentage} color={goal.color} height={10} />

        <View style={{ marginTop: spacing.lg }}>
          <AnimatedPressable onPress={onContribute}>
            <BrutalBox
              bg={goal.color}
              shadow={3}
              radius={radii.pill}
              contentStyle={styles.contributeBtn}
            >
              <SText variant="callout" style={{ fontWeight: '700', textTransform: 'uppercase' }}>
                Aportar a meta
              </SText>
            </BrutalBox>
          </AnimatedPressable>
        </View>
      </BrutalBox>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  subtitlePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginTop: 6,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  statsCol: { flex: 1, gap: spacing.md },
  statBlock: {},
  contributeBtn: { paddingVertical: 14, alignItems: 'center' },
});
