import React, { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, StyleSheet, ScrollView, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useBudgets } from '@/hooks/useBudgets';
import { useApp } from '@/src/context/AppContext';
import { createBudget } from '@/services/budgetService';
import { getCategories } from '@/services/categoryService';
import { formatMonthLabel } from '@/lib/month';
import BudgetCard from '@/src/components/BudgetCard';
import MonthSelector from '@/src/components/MonthSelector';
import SText from '@/src/components/SText';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import BrutalScreen from '@/src/components/BrutalScreen';
import HighlightText from '@/src/components/HighlightText';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AuthFeedback from '@/src/components/AuthFeedback';
import ProgressBar from '@/src/components/ProgressBar';
import { formatCOP } from '@/src/utils/currency';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

function SummaryStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'spent' | 'ok' | 'warn';
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const bg =
    tone === 'spent' ? colors.expenseBg
    : tone === 'ok' ? colors.incomeBg
    : tone === 'warn' ? colors.surfaceAlt
    : colors.surface;
  const fg =
    tone === 'spent' ? colors.expense
    : tone === 'ok' ? '#15803D'
    : colors.ink;

  return (
    <BrutalBox bg={bg} radius={radii.md} shadow={3} style={{ flex: 1 }} contentStyle={styles.summaryStat}>
      <View style={[styles.summaryIcon, brutalBorder(2), { backgroundColor: colors.surface }]}>
        <Ionicons name={icon} size={16} color={fg} />
      </View>
      <SText variant="caption2" color={colors.textMuted} style={styles.summaryLabel}>{label}</SText>
      <SText variant="callout" color={fg} style={{ fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
        {value}
      </SText>
    </BrutalBox>
  );
}

export default function BudgetsScreen() {
  const { selectedMonth, triggerRefresh, refreshKey } = useApp();
  const budgets = useBudgets(selectedMonth);

  useFocusEffect(
    useCallback(() => {
      budgets.refresh();
    }, [budgets.refresh, refreshKey])
  );

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const monthLabel = formatMonthLabel(selectedMonth);

  const summary = useMemo(() => {
    const totalLimit = budgets.data.reduce((s, b) => s + Number(b.limit_amount), 0);
    const totalSpent = budgets.data.reduce((s, b) => s + Number(b.spent), 0);
    const remaining = Math.max(totalLimit - totalSpent, 0);
    const exceeded = budgets.data.filter((b) => Number(b.percentage) >= 100).length;
    const health =
      budgets.data.length > 0
        ? Math.round(budgets.data.reduce((s, b) => s + Number(b.percentage), 0) / budgets.data.length)
        : 0;
    return { totalLimit, totalSpent, remaining, exceeded, health };
  }, [budgets.data]);

  const openModal = async () => {
    setSaveError(null);
    try {
      setCategories(await getCategories());
    } catch {
      // modal igual se abre; categorías pueden estar vacías
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const limit = parseFloat(newLimit);
    const title = newTitle.trim();
    if (!title || !newCategory || !limit || limit <= 0) {
      setSaveError('Nombre, categoría y límite mayor a 0 son obligatorios.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await createBudget({
        title,
        category_id: newCategory,
        limit_amount: limit,
        month: selectedMonth,
      });
      budgets.refresh();
      triggerRefresh();
      setShowModal(false);
      setNewTitle('');
      setNewCategory('');
      setNewLimit('');
      setSaveError(null);
    } catch (e: any) {
      setSaveError(e.message || 'No se pudo crear el presupuesto.');
    } finally {
      setSaving(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  return (
    <BrutalScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <HighlightText variant="title2">Presupuestos</HighlightText>
              <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 6 }}>
                Control de gastos · {monthLabel}
              </SText>
            </View>
            <MonthSelector />
          </View>
        </FadeInView>

        {budgets.loading ? (
          <>
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </>
        ) : budgets.data.length === 0 ? (
          <FadeInView index={1}>
            <BrutalBox bg={colors.yellow} radius={radii.xl} shadow={6} contentStyle={styles.emptyHero}>
              <View style={[styles.emptyHeroIcon, brutalBorder(3)]}>
                <Ionicons name="wallet" size={36} color={colors.ink} />
              </View>
              <SText variant="title3" style={styles.emptyHeroTitle}>
                Organiza tus gastos
              </SText>
              <SText variant="footnote" color={colors.textSecondary} style={styles.emptyHeroText}>
                Define un límite por categoría y lleva el control de cuánto gastas cada mes.
              </SText>
            </BrutalBox>

            <BrutalBox contentStyle={styles.tipsCard}>
              <SText variant="subhead" style={styles.tipsTitle}>¿Cómo funciona?</SText>
              {[
                { icon: 'pricetag' as const, text: 'Ponle nombre: Netflix, Spotify, Gym...' },
                { icon: 'grid' as const, text: 'Elige la categoría de gasto' },
                { icon: 'cash' as const, text: 'Puedes tener varios en la misma categoría' },
              ].map((tip, i) => (
                <View key={tip.icon} style={[styles.tipRow, i > 0 && styles.tipRowBorder]}>
                  <View style={[styles.tipIcon, brutalBorder(2), { backgroundColor: colors.yellow }]}>
                    <Ionicons name={tip.icon} size={18} color={colors.ink} />
                  </View>
                  <SText variant="body" style={{ flex: 1, fontWeight: '600' }}>{tip.text}</SText>
                </View>
              ))}
            </BrutalBox>

            <AnimatedPressable onPress={openModal} style={{ marginTop: spacing.md }}>
              <BrutalBox bg={colors.pink} radius={radii.pill} shadow={4} contentStyle={styles.emptyCta}>
                <Ionicons name="add-circle" size={22} color={colors.ink} />
                <SText variant="callout" style={{ fontWeight: '800' }}>Crear mi primer presupuesto</SText>
              </BrutalBox>
            </AnimatedPressable>
          </FadeInView>
        ) : (
          <>
            <FadeInView index={1}>
              <View style={styles.summaryRow}>
                <SummaryStat
                  label="PRESUPUESTADO"
                  value={formatCOP(summary.totalLimit)}
                  tone="neutral"
                  icon="pie-chart"
                />
                <SummaryStat
                  label="GASTADO"
                  value={formatCOP(summary.totalSpent)}
                  tone="spent"
                  icon="trending-down"
                />
                <SummaryStat
                  label="DISPONIBLE"
                  value={formatCOP(summary.remaining)}
                  tone="ok"
                  icon="checkmark-circle"
                />
              </View>
            </FadeInView>

            <FadeInView index={2}>
              <BrutalBox contentStyle={styles.healthCard}>
                <View style={styles.healthHeader}>
                  <View>
                    <SText variant="subhead" style={styles.sectionTitle}>Salud del mes</SText>
                    <SText variant="caption2" color={colors.textMuted}>
                      {summary.exceeded > 0
                        ? `${summary.exceeded} categoría${summary.exceeded > 1 ? 's' : ''} excedida${summary.exceeded > 1 ? 's' : ''}`
                        : 'Todo bajo control'}
                    </SText>
                  </View>
                  <View style={[styles.healthBadge, brutalBorder(2), {
                    backgroundColor: summary.health > 80 ? colors.expenseBg : colors.yellow,
                  }]}>
                    <SText variant="headline" style={{ fontWeight: '800' }}>{summary.health}%</SText>
                  </View>
                </View>
                <ProgressBar
                  percentage={Math.min(summary.health, 100)}
                  height={14}
                  color={summary.health > 80 ? colors.expense : summary.health > 60 ? colors.warning : colors.yellowDark}
                />
              </BrutalBox>
            </FadeInView>

            <FadeInView index={3}>
              <View style={styles.listHeader}>
                <HighlightText variant="title3">Tus presupuestos</HighlightText>
                <View style={[styles.countBadge, brutalBorder(2)]}>
                  <SText variant="caption2" style={{ fontWeight: '800' }}>{budgets.data.length}</SText>
                </View>
              </View>
            </FadeInView>

            {budgets.data.map((b, i) => (
              <BudgetCard key={b.id} budget={b} index={i + 4} />
            ))}

            <FadeInView index={budgets.data.length + 5}>
              <AnimatedPressable onPress={openModal}>
                <BrutalBox bg={colors.surfaceAlt} radius={radii.lg} shadow={3} contentStyle={styles.addMoreCard}>
                  <View style={[styles.addMoreIcon, brutalBorder(2), { backgroundColor: colors.yellow }]}>
                    <Ionicons name="add" size={22} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SText variant="body" style={{ fontWeight: '800' }}>Añadir presupuesto</SText>
                    <SText variant="caption2" color={colors.textMuted}>Netflix, Spotify, gym... para {monthLabel}</SText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </BrutalBox>
              </AnimatedPressable>
            </FadeInView>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInDown.springify().damping(20)} style={styles.modalWrap}>
            <BrutalBox contentStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, brutalBorder(2), { backgroundColor: colors.yellow }]}>
                  <Ionicons name="wallet" size={22} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <SText variant="title3" style={{ fontWeight: '800', textTransform: 'uppercase' }}>
                    Nuevo presupuesto
                  </SText>
                  <SText variant="caption2" color={colors.textMuted}>{monthLabel}</SText>
                </View>
              </View>

              {saveError ? (
                <AuthFeedback type="error" title="Error" message={saveError} />
              ) : null}

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Nombre</SText>
              <TextInput
                style={[styles.textInput, brutalBorder(2)]}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Ej. Netflix, Spotify, Gym..."
                placeholderTextColor={colors.textMuted}
                maxLength={60}
              />

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Categoría</SText>
              {expenseCategories.length === 0 ? (
                <SText variant="footnote" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
                  No hay categorías de gasto. Créalas en Más → Categorías.
                </SText>
              ) : (
                <View style={styles.categoryGrid}>
                  {expenseCategories.map((c) => {
                    const selected = newCategory === c.id;
                    return (
                      <AnimatedPressable
                        key={c.id}
                        style={[
                          styles.categoryChip,
                          brutalBorder(2),
                          { backgroundColor: selected ? colors.pink : colors.surface },
                        ]}
                        onPress={() => setNewCategory(c.id)}
                      >
                        <View style={[styles.chipIcon, brutalBorder(2), { backgroundColor: c.color || colors.yellow }]}>
                          <Ionicons name={c.icon as any} size={16} color={colors.ink} />
                        </View>
                        <SText variant="caption2" style={{ fontWeight: '700' }} numberOfLines={1}>
                          {c.name}
                        </SText>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              )}

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Límite mensual</SText>
              <View style={[styles.inputWrap, brutalBorder(2)]}>
                <SText variant="body" style={{ fontWeight: '700' }}>$</SText>
                <TextInput
                  style={styles.input}
                  value={newLimit}
                  onChangeText={(t) => setNewLimit(t.replace(/[^0-9]/g, ''))}
                  placeholder="Ej. 500000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
                <SText variant="caption2" color={colors.textMuted}>COP</SText>
              </View>

              <BrutalButton
                label={saving ? 'Guardando...' : 'Crear presupuesto'}
                onPress={handleSave}
                disabled={!newTitle.trim() || !newCategory || !newLimit || saving}
              />
              <AnimatedPressable onPress={() => setShowModal(false)} style={styles.modalCancel}>
                <SText variant="footnote" style={{ fontWeight: '700' }}>Cancelar</SText>
              </AnimatedPressable>
            </BrutalBox>
          </Animated.View>
        </View>
      </Modal>
    </BrutalScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, zIndex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  summaryStat: { padding: spacing.md, minWidth: 0 },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: { textTransform: 'uppercase', letterSpacing: 0.3 },
  healthCard: { padding: spacing.lg, marginBottom: spacing.lg },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  healthBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
  },
  sectionTitle: { fontWeight: '800', textTransform: 'uppercase' },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  countBadge: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  addMoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  addMoreIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyHero: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyHeroIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyHeroTitle: { fontWeight: '800', textAlign: 'center', marginBottom: spacing.sm },
  emptyHeroText: { textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  tipsCard: { padding: spacing.lg, marginBottom: spacing.lg },
  tipsTitle: { fontWeight: '800', textTransform: 'uppercase', marginBottom: spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  tipRowBorder: { borderTopWidth: 2, borderTopColor: colors.bgAlt },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalWrap: { padding: spacing.xl },
  modalContent: { padding: spacing.xl },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: { marginBottom: spacing.sm, marginTop: spacing.sm, textTransform: 'uppercase', fontWeight: '600' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryChip: {
    width: '30%',
    minWidth: 96,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    gap: 6,
  },
  chipIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 12,
  },
  modalCancel: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm },
});
