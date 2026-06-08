import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { BudgetWithSpent } from '@/services/budgetService';
import { formatMonthLabel } from '@/lib/month';
import SText from '@/src/components/SText';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { radii, spacing, brutalBorder, webTextInputReset } from '@/src/constants/theme';
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
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [limits, setLimits] = useState<Record<string, string>>({});

  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
      },
      wrap: { maxHeight: '88%', width: '100%' },
      content: { padding: spacing.lg },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.lg,
      },
      headerText: { flex: 1, minWidth: 0 },
      icon: {
        width: 48,
        height: 48,
        borderRadius: radii.sm,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
      },
      infoBox: { padding: spacing.md, marginBottom: spacing.lg },
      list: { maxHeight: 280, marginBottom: spacing.lg },
      row: {
        gap: spacing.sm,
        paddingVertical: spacing.md,
      },
      rowBorder: { borderTopWidth: 2, borderTopColor: colors.bgAlt },
      rowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      },
      rowIcon: {
        width: 36,
        height: 36,
        borderRadius: radii.sm,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
      },
      rowInfo: { flex: 1, minWidth: 0 },
      limitWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radii.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        gap: 6,
        alignSelf: 'stretch',
      },
      limitInput: {
        flex: 1,
        color: colors.ink,
        fontSize: 16,
        fontWeight: '800',
        paddingVertical: 10,
        textAlign: 'right',
        minWidth: 0,
        ...webTextInputReset,
      },
      copLabel: { fontWeight: '700', flexShrink: 0 },
      cancel: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm },
    })
  );

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
      <View style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Animated.View entering={SlideInDown.springify().damping(20)} style={styles.wrap}>
          <BrutalBox shadow={5} contentStyle={styles.content}>
            <View style={styles.header}>
              <View style={[styles.icon, brutalBorder(undefined, colors), { backgroundColor: colors.yellow }]}>
                <Ionicons name="calendar" size={22} color={colors.ink} />
              </View>
              <View style={styles.headerText}>
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
                <View key={b.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <View style={styles.rowHeader}>
                    <View
                      style={[styles.rowIcon, brutalBorder(undefined, colors), { backgroundColor: b.category_color || colors.yellow }]}
                    >
                      <Ionicons name={(b.category_icon as any) || 'ellipse'} size={16} color={colors.ink} />
                    </View>
                    <View style={styles.rowInfo}>
                      <SText variant="body" style={{ fontWeight: '800' }} numberOfLines={1}>
                        {b.title}
                      </SText>
                      <SText variant="caption2" color={colors.textMuted} numberOfLines={1}>
                        {b.category_name}
                      </SText>
                    </View>
                  </View>

                  <View style={[styles.limitWrap, brutalBorder(undefined, colors)]}>
                    <SText variant="caption2" style={{ fontWeight: '700' }}>$</SText>
                    <TextInput
                      style={styles.limitInput}
                      value={formatCOPDigits(limits[b.id] ?? '')}
                      onChangeText={(t) =>
                        setLimits((prev) => ({ ...prev, [b.id]: parseCOPDigits(t) }))
                      }
                      keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                    />
                    <SText variant="caption2" color={colors.textMuted} style={styles.copLabel}>
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
