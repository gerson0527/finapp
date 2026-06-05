import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { BudgetWithSpent } from '@/services/budgetService';
import { formatMonthLabel } from '@/lib/month';
import SText from '@/src/components/SText';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';
import { copDigitsToNumber, formatCOPDigits, parseCOPDigits } from '@/src/utils/currency';

interface BudgetMonthReviewModalProps {
  visible: boolean;
  month: string;
  budgets: BudgetWithSpent[];
  rolledFromMonth: string | null;
  saving?: boolean;
  onConfirm: (limits: Record<string, number>) => void;
  onDismiss: () => void;
}

export default function BudgetMonthReviewModal({
  visible,
  month,
  budgets,
  rolledFromMonth,
  saving = false,
  onConfirm,
  onDismiss,
}: BudgetMonthReviewModalProps) {
  const [limits, setLimits] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    const initial: Record<string, string> = {};
    budgets.forEach((b) => {
      initial[b.id] = String(Math.round(Number(b.limit_amount)));
    });
    setLimits(initial);
  }, [visible, budgets]);

  const monthLabel = formatMonthLabel(month);

  function handleConfirm() {
    const parsed: Record<string, number> = {};
    for (const b of budgets) {
      const raw = limits[b.id] ?? '';
      const num = copDigitsToNumber(raw);
      if (!num || num <= 0) return;
      parsed[b.id] = num;
    }
    onConfirm(parsed);
  }

  const allValid = budgets.every((b) => {
    const num = copDigitsToNumber(limits[b.id] ?? '');
    return num > 0;
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View entering={SlideInDown.springify().damping(20)} style={styles.wrap}>
          <BrutalBox shadow={5} contentStyle={styles.content}>
            <View style={styles.header}>
              <View style={[styles.icon, brutalBorder(2), { backgroundColor: colors.yellow }]}>
                <Ionicons name="calendar" size={22} color={colors.ink} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <SText variant="title3" style={{ fontWeight: '800', textTransform: 'uppercase' }}>
                  Nuevo mes
                </SText>
                <SText variant="caption2" color={colors.textMuted}>{monthLabel}</SText>
              </View>
            </View>

            <BrutalBox bg={colors.surfaceAlt} radius={radii.md} shadow={2} contentStyle={styles.infoBox}>
              <SText variant="footnote" color={colors.textSecondary} style={{ lineHeight: 20 }}>
                {rolledFromMonth
                  ? `Tus presupuestos se copiaron de ${formatMonthLabel(rolledFromMonth)}. El gasto vuelve a cero.`
                  : 'El gasto de este mes empieza en cero. Revisa si tus límites siguen igual o subieron.'}
              </SText>
              <SText variant="caption2" color={colors.textMuted} style={{ marginTop: 8 }}>
                Los ahorros no se reinician — solo los presupuestos mensuales.
              </SText>
            </BrutalBox>

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {budgets.map((b, i) => (
                <View
                  key={b.id}
                  style={[styles.row, i > 0 && styles.rowBorder]}
                >
                  <View style={[styles.rowIcon, brutalBorder(2), { backgroundColor: b.category_color || colors.yellow }]}>
                    <Ionicons name={(b.category_icon as any) || 'ellipse'} size={16} color={colors.ink} />
                  </View>
                  <View style={styles.rowInfo}>
                    <SText variant="body" style={{ fontWeight: '800' }}>{b.title}</SText>
                    <SText variant="caption2" color={colors.textMuted}>{b.category_name}</SText>
                  </View>
                  <View style={[styles.limitWrap, brutalBorder(2)]}>
                    <SText variant="caption2" style={{ fontWeight: '700' }}>$</SText>
                    <TextInput
                      style={styles.limitInput}
                      value={formatCOPDigits(limits[b.id] ?? '')}
                      onChangeText={(t) =>
                        setLimits((prev) => ({ ...prev, [b.id]: parseCOPDigits(t) }))
                      }
                      keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                    />
                    <SText variant="caption2" color={colors.textMuted} style={{ fontWeight: '700' }}>
                      COP
                    </SText>
                  </View>
                </View>
              ))}
            </ScrollView>

            <BrutalButton
              label={saving ? 'Guardando...' : 'Confirmar presupuestos'}
              variant="pink"
              onPress={handleConfirm}
              disabled={!allValid || saving}
            />
            <AnimatedPressable onPress={onDismiss} style={styles.cancel} disabled={saving}>
              <SText variant="footnote" style={{ fontWeight: '700' }}>Recordar después</SText>
            </AnimatedPressable>
          </BrutalBox>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  wrap: { maxHeight: '88%' },
  content: { padding: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: { padding: spacing.md, marginBottom: spacing.lg },
  list: { maxHeight: 280, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  rowBorder: { borderTopWidth: 2, borderTopColor: colors.bgAlt },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInfo: { flex: 1, minWidth: 0 },
  limitWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    gap: 2,
    minWidth: 100,
  },
  limitInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    paddingVertical: 8,
    textAlign: 'right',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as const } : {}),
  },
  cancel: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm },
});
