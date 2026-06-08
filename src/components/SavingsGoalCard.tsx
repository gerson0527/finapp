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
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { radii, spacing, brutalBorder } from '@/src/constants/theme';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onContribute?: () => void;
  index?: number;
}

export default function SavingsGoalCard({ goal, onContribute, index = 0 }: SavingsGoalCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      card: { padding: spacing.lg },
      header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        marginBottom: spacing.lg,
      },
      iconBadge: {
        width: 48,
        height: 48,
        borderRadius: radii.sm,
        justifyContent: 'center',
        alignItems: 'center',
      },
      headerText: { flex: 1, minWidth: 0 },
      subtitlePill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radii.pill,
        marginTop: 6,
        maxWidth: '100%',
      },
      pctBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radii.sm,
      },
      body: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
      },
      statsCol: { flex: 1, gap: spacing.sm },
      statTile: { padding: spacing.md },
      statLabel: { textTransform: 'uppercase', letterSpacing: 0.3 },
      metaRow: { marginBottom: spacing.sm },
      contributeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: 14,
      },
    })
  );

  const percentage =
    goal.target_amount > 0
      ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100)
      : 0;

  const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);
  const completed = percentage >= 100;
  const accent = goal.color || colors.yellowDark;

  return (
    <FadeInView index={index}>
      <BrutalBox
        bg={completed ? colors.incomeBg : colors.surface}
        radius={radii.lg}
        shadow={4}
        style={{ marginBottom: spacing.md }}
        contentStyle={styles.card}
      >
        <View style={styles.header}>
          <View style={[styles.iconBadge, brutalBorder(2, colors), { backgroundColor: accent }]}>
            <Ionicons name={(goal.icon as any) || 'flag'} size={22} color={colors.ink} />
          </View>
          <View style={styles.headerText}>
            <SText variant="body" style={{ fontWeight: '800' }} numberOfLines={1}>
              {goal.title}
            </SText>
            {goal.subtitle ? (
              <View style={[styles.subtitlePill, brutalBorder(2, colors), { backgroundColor: colors.surfaceAlt }]}>
                <SText variant="caption2" style={{ fontWeight: '700' }} numberOfLines={1}>
                  {goal.subtitle}
                </SText>
              </View>
            ) : null}
          </View>
          <View style={[styles.pctBadge, brutalBorder(2, colors), { backgroundColor: accent }]}>
            <SText variant="headline" style={{ fontWeight: '800' }}>{Math.round(percentage)}%</SText>
          </View>
        </View>

        <View style={styles.body}>
          <DonutChart
            percentage={percentage}
            size={108}
            strokeWidth={11}
            color={accent}
            bgColor={colors.bgAlt}
          />
          <View style={styles.statsCol}>
            <BrutalBox bg={colors.surfaceAlt} radius={radii.sm} shadow={2} contentStyle={styles.statTile}>
              <SText variant="caption2" color={colors.textMuted} style={styles.statLabel}>AHORRADO</SText>
              <SText variant="callout" style={{ fontWeight: '800', marginTop: 4 }}>
                {formatCOP(goal.saved_amount)}
              </SText>
            </BrutalBox>
            <BrutalBox bg={colors.surface} radius={radii.sm} shadow={2} contentStyle={styles.statTile}>
              <SText variant="caption2" color={colors.textMuted} style={styles.statLabel}>
                {completed ? 'COMPLETADA' : 'FALTA'}
              </SText>
              <SText
                variant="callout"
                color={completed ? '#15803D' : colors.ink}
                style={{ fontWeight: '800', marginTop: 4 }}
              >
                {completed ? '¡Meta lograda!' : formatCOP(remaining)}
              </SText>
            </BrutalBox>
          </View>
        </View>

        <View style={styles.metaRow}>
          <SText variant="caption2" color={colors.textMuted}>
            Meta: <SText variant="caption2" style={{ fontWeight: '800' }}>{formatCOP(goal.target_amount)}</SText>
          </SText>
        </View>

        <ProgressBar percentage={percentage} color={accent} height={12} />

        {!completed && onContribute ? (
          <AnimatedPressable onPress={onContribute} style={{ marginTop: spacing.md }}>
            <BrutalBox bg={colors.yellow} radius={radii.pill} shadow={3} contentStyle={styles.contributeBtn}>
              <Ionicons name="add-circle" size={20} color={colors.ink} />
              <SText variant="callout" style={{ fontWeight: '800' }}>Aportar</SText>
            </BrutalBox>
          </AnimatedPressable>
        ) : null}
      </BrutalBox>
    </FadeInView>
  );
}
