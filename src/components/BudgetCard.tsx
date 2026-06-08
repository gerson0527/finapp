import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BudgetWithSpent } from '@/services/budgetService';
import { formatCOP } from '@/src/utils/currency';
import SText from '@/src/components/SText';
import ProgressBar from './ProgressBar';
import BrutalBox from './BrutalBox';
import FadeInView from './FadeInView';
import AnimatedPressable from './AnimatedPressable';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { radii, spacing, brutalBorder } from '@/src/constants/theme';

interface BudgetCardProps {
  budget: BudgetWithSpent;
  index?: number;
  onPay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function BudgetCard({ budget, index = 0, onPay, onEdit, onDelete }: BudgetCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      card: { padding: spacing.lg },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
      },
      categoryRow: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
      iconWrap: {
        width: 44,
        height: 44,
        borderRadius: radii.sm,
        justifyContent: 'center',
        alignItems: 'center',
      },
      categoryInfo: { marginLeft: spacing.md, flex: 1, minWidth: 0 },
      nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
      pctBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radii.sm,
        marginLeft: 8,
        flexShrink: 0,
      },
      footer: { marginTop: spacing.sm },
      manageRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
      },
      manageBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: radii.pill,
        backgroundColor: colors.surfaceAlt,
      },
      deleteBtn: { backgroundColor: colors.expenseBg },
      payWrap: { marginTop: spacing.sm },
      payBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: radii.pill,
      },
    })
  );

  const pct = Number(budget.percentage);
  const isExceeded = pct >= 100;
  const isWarning = pct >= 80 && pct < 100;

  let barColor = colors.yellowDark;
  if (isWarning) barColor = colors.warning;
  if (isExceeded) barColor = colors.expense;

  const spent = Number(budget.spent);
  const limit = Number(budget.limit_amount);
  const remaining = Math.max(limit - spent, 0);
  const exceededAmount = isExceeded ? spent - limit : 0;
  const iconBg = budget.category_color || colors.yellow;

  return (
    <FadeInView index={index}>
      <BrutalBox
        bg={isExceeded ? colors.expenseBg : colors.surface}
        radius={radii.lg}
        shadow={4}
        style={{ marginBottom: spacing.md }}
        contentStyle={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.categoryRow}>
            <View style={[styles.iconWrap, brutalBorder(2, colors), { backgroundColor: iconBg }]}>
              <Ionicons
                name={(budget.category_icon as any) || 'ellipse'}
                size={20}
                color={colors.ink}
              />
            </View>
            <View style={styles.categoryInfo}>
              <View style={styles.nameRow}>
                <SText variant="body" style={{ fontWeight: '800', flex: 1 }} numberOfLines={1}>{budget.title}</SText>
                {isExceeded && <Ionicons name="warning" size={16} color={colors.expense} />}
              </View>
              <SText variant="caption2" color={colors.textMuted} style={{ marginTop: 2 }} numberOfLines={1}>
                {budget.category_name}
                {' · '}
                {isExceeded
                  ? `${formatCOP(exceededAmount)} por encima`
                  : `${formatCOP(remaining)} disponibles`}
              </SText>
            </View>
          </View>
          <View style={[styles.pctBadge, brutalBorder(2, colors), { backgroundColor: barColor }]}>
            <SText variant="headline" style={{ fontWeight: '800' }}>{Math.round(pct)}%</SText>
          </View>
        </View>

        <ProgressBar percentage={pct} color={barColor} height={12} />

        <View style={styles.footer}>
          <SText variant="caption2" color={colors.textMuted}>
            <SText variant="caption2" color={isExceeded ? colors.expense : colors.ink} style={{ fontWeight: '800' }}>
              {formatCOP(spent)}
            </SText>
            {' de '}
            {formatCOP(limit)}
          </SText>
        </View>

        {(onEdit || onDelete) ? (
          <View style={styles.manageRow}>
            {onEdit ? (
              <AnimatedPressable onPress={onEdit} style={[styles.manageBtn, brutalBorder(undefined, colors)]}>
                <Ionicons name="create-outline" size={16} color={colors.ink} />
                <SText variant="caption2" style={{ fontWeight: '800' }}>Editar</SText>
              </AnimatedPressable>
            ) : null}
            {onDelete ? (
              <AnimatedPressable onPress={onDelete} style={[styles.manageBtn, styles.deleteBtn, brutalBorder(undefined, colors)]}>
                <Ionicons name="trash-outline" size={16} color={colors.expense} />
                <SText variant="caption2" color={colors.expense} style={{ fontWeight: '800' }}>Eliminar</SText>
              </AnimatedPressable>
            ) : null}
          </View>
        ) : null}

        {onPay ? (
          <AnimatedPressable onPress={onPay} style={styles.payWrap}>
            <View style={[styles.payBtn, brutalBorder(2, colors), { backgroundColor: colors.yellow }]}>
              <Ionicons name="card-outline" size={16} color={colors.ink} />
              <SText variant="caption1" style={{ fontWeight: '800' }}>Registrar gasto</SText>
            </View>
          </AnimatedPressable>
        ) : null}
      </BrutalBox>
    </FadeInView>
  );
}
