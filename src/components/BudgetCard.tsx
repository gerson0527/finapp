import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BudgetWithSpent } from '@/services/budgetService';
import { formatCOP } from '@/src/utils/currency';
import SText from '@/src/components/SText';
import ProgressBar from './ProgressBar';
import GlassCard from './GlassCard';
import FadeInView from './FadeInView';
import { colors, radii, spacing } from '@/src/constants/theme';

interface BudgetCardProps {
  budget: BudgetWithSpent;
  index?: number;
}

export default function BudgetCard({ budget, index = 0 }: BudgetCardProps) {
  const pct = Number(budget.percentage);
  const isExceeded = pct >= 100;
  const isWarning = pct >= 80 && pct < 100;

  let barColor = colors.yellowDark;
  if (isWarning) barColor = colors.warning;
  if (isExceeded) barColor = colors.expense;

  const exceededAmount = isExceeded ? Number(budget.spent) - Number(budget.limit_amount) : 0;

  return (
    <FadeInView index={index}>
      <GlassCard
        style={{ marginBottom: spacing.md }}
        contentStyle={[styles.card, isExceeded && { backgroundColor: colors.expenseBg }]}
      >
        <View style={styles.header}>
          <View style={styles.categoryRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.yellow }]}>
              <Ionicons
                name={(budget.category_icon as any) || 'ellipse'}
                size={20}
                color={colors.ink}
              />
            </View>
            <View style={styles.categoryInfo}>
              <View style={styles.nameRow}>
                <SText variant="body" style={{ fontWeight: '700' }}>{budget.category_name}</SText>
                {isExceeded && <Ionicons name="warning" size={16} color={colors.expense} />}
              </View>
              <SText variant="caption1" color={colors.textMuted} style={{ marginTop: 4 }}>
                <SText variant="caption1" color={isExceeded ? colors.expense : colors.ink} style={{ fontWeight: '800' }}>
                  {formatCOP(Number(budget.spent))}
                </SText>
                {' / '}
                {formatCOP(Number(budget.limit_amount))}
              </SText>
            </View>
          </View>
          <View style={[styles.pctBadge, { backgroundColor: barColor }]}>
            <SText variant="headline" color={colors.ink}>{Math.round(pct)}%</SText>
          </View>
        </View>
        <ProgressBar percentage={pct} color={barColor} height={12} />
        {isExceeded && (
          <View style={styles.exceededRow}>
            <SText variant="caption2" color={colors.expense} style={{ fontWeight: '700' }}>
              ⚠ {formatCOP(exceededAmount)} excedido
            </SText>
          </View>
        )}
      </GlassCard>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  categoryRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  categoryInfo: { marginLeft: spacing.md, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pctBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    marginLeft: 8,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  exceededRow: { marginTop: spacing.sm },
});
