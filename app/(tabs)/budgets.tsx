import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { format } from 'date-fns';
import { useBudgets } from '@/hooks/useBudgets';
import { useApp } from '@/src/context/AppContext';
import { createBudget, deleteBudget, updateBudget, BudgetWithSpent, updateBudgetLimits } from '@/services/budgetService';
import { getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { markBudgetMonthReviewed } from '@/lib/budgetReviewStorage';
import BudgetMonthReviewModal from '@/src/components/BudgetMonthReviewModal';
import { getCategories } from '@/services/categoryService';
import { createTransaction } from '@/services/transactionService';
import { checkBudgetAlertsAfterExpense } from '@/services/notificationService';
import { getMainAccount } from '@/services/accountService';
import { formatMonthLabel, getDefaultDateForMonth, getCurrentMonth } from '@/lib/month';
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
import { copDigitsToNumber, formatCOP, formatCOPDigits, parseCOPDigits } from '@/src/utils/currency';
import BalanceExceededAlert from '@/src/components/BalanceExceededAlert';
import { radii, spacing, brutalBorder, webTextInputReset } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import type { ThemeColors } from '@/src/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function SummaryStat({
  label,
  value,
  tone,
  icon,
  colors,
  styles,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'spent' | 'ok' | 'warn';
  icon: keyof typeof Ionicons.glyphMap;
  colors: ThemeColors;
  styles: Record<string, object>;
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
      <View style={[styles.summaryIcon, brutalBorder(2, colors), { backgroundColor: colors.surface }]}>
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
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) =>
      StyleSheet.create({
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
    modalKeyboard: { width: '100%' },
    modalWrap: { padding: spacing.xl, paddingBottom: spacing.lg },
    modalContent: { padding: spacing.xl },
    payModalContent: { paddingTop: spacing.lg, overflow: 'visible' as const },
    payModalAccent: {
      position: 'absolute',
      top: 0,
      left: spacing.xl,
      right: spacing.xl,
      height: 6,
      backgroundColor: colors.yellow,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: radii.sm,
      borderTopRightRadius: radii.sm,
    },
    payModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
      paddingTop: spacing.xs,
    },
    payCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: radii.sm,
      backgroundColor: colors.bgAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    payModalScroll: { paddingBottom: spacing.sm },
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
      width: '31%',
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
    payStatsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    payStatBox: { flex: 1, minWidth: 0 },
    payStatInner: { padding: spacing.md },
    payStatIcon: {
      width: 28,
      height: 28,
      borderRadius: radii.sm,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    payStatLabel: {
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: 2,
    },
    payFieldLabel: {
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    payAmountCard: {
      padding: spacing.lg,
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    payAmountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      width: '100%',
      marginBottom: spacing.xs,
    },
    payInput: {
      flex: 1,
      maxWidth: 200,
      color: colors.ink,
      fontSize: 32,
      fontWeight: '800',
      paddingVertical: 8,
      textAlign: 'center',
      ...webTextInputReset,
    },
    quickFillChip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: spacing.lg,
    },
    payNoteInput: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      color: colors.ink,
      fontSize: 15,
      marginBottom: spacing.md,
    },
  })
    );
  const insets = useSafeAreaInsets();
  const { selectedMonth, triggerRefresh, refreshKey } = useApp();
  const budgets = useBudgets(selectedMonth);

  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [payBudget, setPayBudget] = useState<BudgetWithSpent | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [showExceededAlert, setShowExceededAlert] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BudgetWithSpent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const monthLabel = formatMonthLabel(selectedMonth);
  const currentMonth = getCurrentMonth();
  const isCurrentMonth = selectedMonth === currentMonth;

  useEffect(() => {
    if (
      isCurrentMonth &&
      budgets.needsMonthReview &&
      !budgets.loading &&
      budgets.data.length > 0
    ) {
      setShowReviewModal(true);
    }
  }, [isCurrentMonth, budgets.needsMonthReview, budgets.loading, budgets.data.length]);

  useEffect(() => {
    if (!payBudget) return;
    setBalanceLoading(true);
    getMainAccount()
      .then((a) => setAccountBalance(a ? Number(a.balance) : 0))
      .catch(() => setAccountBalance(0))
      .finally(() => setBalanceLoading(false));
  }, [payBudget]);

  const payRemaining = payBudget
    ? Math.max(Number(payBudget.limit_amount) - Number(payBudget.spent), 0)
    : 0;
  const payNumAmount = copDigitsToNumber(payAmount);
  const exceedsBalance = accountBalance !== null && payNumAmount > accountBalance;

  function getDefaultPayAmount(budget: BudgetWithSpent): string {
    const remaining = Math.max(Number(budget.limit_amount) - Number(budget.spent), 0);
    return remaining > 0 ? parseCOPDigits(String(Math.round(remaining))) : '';
  }

  function openPay(budget: BudgetWithSpent) {
    setPayError(null);
    setPayAmount(getDefaultPayAmount(budget));
    setPayNote('');
    setPayBudget(budget);
  }

  function closePay() {
    setPayBudget(null);
    setPayAmount('');
    setPayNote('');
    setPayError(null);
  }

  async function handleReviewConfirm(limits: Record<string, number>) {
    setReviewSaving(true);
    try {
      const updates = Object.entries(limits).map(([id, limit_amount]) => ({
        id,
        limit_amount,
      }));
      await updateBudgetLimits(updates);

      const userId = await getCurrentUserIdOrNull();
      if (userId) await markBudgetMonthReviewed(userId, currentMonth);

      budgets.clearMonthReview();
      setShowReviewModal(false);
      budgets.refresh();
      triggerRefresh();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudieron actualizar los presupuestos.');
    } finally {
      setReviewSaving(false);
    }
  }

  function handleReviewDismiss() {
    setShowReviewModal(false);
  }

  async function handlePay() {
    if (!payBudget) return;
    const amount = copDigitsToNumber(payAmount);
    if (!amount || amount <= 0) {
      setPayError('Ingresa un monto válido.');
      return;
    }
    if (exceedsBalance) {
      setShowExceededAlert(true);
      return;
    }

    setPaying(true);
    setPayError(null);
    try {
      const account = await getMainAccount();
      if (!account) throw new Error('No hay cuenta disponible.');

      const txDate = getDefaultDateForMonth(selectedMonth);
      await createTransaction({
        type: 'expense',
        amount,
        description: payBudget.title,
        category_id: payBudget.category_id,
        account_id: account.id,
        date: format(txDate, 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm:ss'),
        note: payNote.trim() || undefined,
        budget_id: payBudget.id,
      });

      await checkBudgetAlertsAfterExpense(selectedMonth, {
        budgetId: payBudget.id,
        categoryId: payBudget.category_id,
      }).catch(() => {});

      budgets.refresh();
      triggerRefresh();
      closePay();
    } catch (e: any) {
      if (/supera tu balance/i.test(e.message || '')) {
        setShowExceededAlert(true);
      } else {
        setPayError(e.message || 'No se pudo registrar el gasto.');
      }
    } finally {
      setPaying(false);
    }
  }

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

  const openModal = async (budget?: BudgetWithSpent) => {
    setSaveError(null);
    try {
      setCategories(await getCategories());
    } catch {
      // modal igual se abre; categorías pueden estar vacías
    }

    if (budget) {
      setEditingBudget(budget);
      setNewTitle(budget.title);
      setNewCategory(budget.category_id);
      setNewLimit(String(Math.round(Number(budget.limit_amount))));
    } else {
      setEditingBudget(null);
      setNewTitle('');
      setNewCategory('');
      setNewLimit('');
    }

    setShowModal(true);
  };

  const closeBudgetModal = () => {
    setShowModal(false);
    setEditingBudget(null);
    setNewTitle('');
    setNewCategory('');
    setNewLimit('');
    setSaveError(null);
  };

  function openDeleteConfirm(budget: BudgetWithSpent) {
    setDeleteError(null);
    setDeleteTarget(budget);
  }

  function closeDeleteConfirm() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBudget(deleteTarget.id);
      budgets.refresh();
      triggerRefresh();
      setDeleteTarget(null);
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'No se pudo eliminar.');
    } finally {
      setDeleting(false);
    }
  }

  const handleSave = async () => {
    const limit = copDigitsToNumber(newLimit);
    const title = newTitle.trim();
    if (!title || !newCategory || !limit || limit <= 0) {
      setSaveError('Nombre, categoría y límite mayor a 0 son obligatorios.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          title,
          category_id: newCategory,
          limit_amount: limit,
        });
      } else {
        await createBudget({
          title,
          category_id: newCategory,
          month: selectedMonth,
          limit_amount: limit,
        });
      }
      budgets.refresh();
      triggerRefresh();
      closeBudgetModal();
    } catch (e: any) {
      setSaveError(e.message || 'No se pudo guardar el presupuesto.');
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
              <View style={[styles.emptyHeroIcon, brutalBorder(3, colors)]}>
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
                { icon: 'refresh' as const, text: 'Cada mes se reinician en cero (los ahorros no)' },
              ].map((tip, i) => (
                <View key={tip.icon} style={[styles.tipRow, i > 0 && styles.tipRowBorder]}>
                  <View style={[styles.tipIcon, brutalBorder(2, colors), { backgroundColor: colors.yellow }]}>
                    <Ionicons name={tip.icon} size={18} color={colors.ink} />
                  </View>
                  <SText variant="body" style={{ flex: 1, fontWeight: '600' }}>{tip.text}</SText>
                </View>
              ))}
            </BrutalBox>

            <AnimatedPressable onPress={() => openModal()} style={{ marginTop: spacing.md }}>
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
                  colors={colors}
                  styles={styles}
                />
                <SummaryStat
                  label="GASTADO"
                  value={formatCOP(summary.totalSpent)}
                  tone="spent"
                  icon="trending-down"
                  colors={colors}
                  styles={styles}
                />
                <SummaryStat
                  label="DISPONIBLE"
                  value={formatCOP(summary.remaining)}
                  tone="ok"
                  icon="checkmark-circle"
                  colors={colors}
                  styles={styles}
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
                  <View style={[styles.healthBadge, brutalBorder(2, colors), {
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
                <View style={[styles.countBadge, brutalBorder(2, colors)]}>
                  <SText variant="caption2" style={{ fontWeight: '800' }}>{budgets.data.length}</SText>
                </View>
              </View>
            </FadeInView>

            {budgets.data.map((b, i) => (
              <BudgetCard
                key={b.id}
                budget={b}
                index={i + 4}
                onPay={() => openPay(b)}
                onEdit={() => openModal(b)}
                onDelete={() => openDeleteConfirm(b)}
              />
            ))}

            <FadeInView index={budgets.data.length + 5}>
              <AnimatedPressable onPress={() => openModal()}>
                <BrutalBox bg={colors.surfaceAlt} radius={radii.lg} shadow={3} contentStyle={styles.addMoreCard}>
                  <View style={[styles.addMoreIcon, brutalBorder(2, colors), { backgroundColor: colors.yellow }]}>
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
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            style={[styles.modalWrap, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          >
            <BrutalBox contentStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, brutalBorder(2, colors), { backgroundColor: colors.yellow }]}>
                  <Ionicons name="wallet" size={22} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <SText variant="title3" style={{ fontWeight: '800', textTransform: 'uppercase' }}>
                    {editingBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
                  </SText>
                  <SText variant="caption2" color={colors.textMuted}>{monthLabel}</SText>
                </View>
              </View>

              {saveError ? (
                <AuthFeedback type="error" title="Error" message={saveError} />
              ) : null}

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Nombre</SText>
              <TextInput
                style={[styles.textInput, brutalBorder(2, colors)]}
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
                          brutalBorder(2, colors),
                          { backgroundColor: selected ? colors.pink : colors.surface },
                        ]}
                        onPress={() => setNewCategory(c.id)}
                      >
                        <View style={[styles.chipIcon, brutalBorder(2, colors), { backgroundColor: c.color || colors.yellow }]}>
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
              <View style={[styles.inputWrap, brutalBorder(2, colors)]}>
                <SText variant="body" style={{ fontWeight: '700' }}>$</SText>
                <TextInput
                  style={styles.input}
                  value={formatCOPDigits(newLimit)}
                  onChangeText={(t) => setNewLimit(parseCOPDigits(t))}
                  placeholder="Ej. 500.000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
                <SText variant="caption2" color={colors.textMuted}>COP</SText>
              </View>

              <BrutalButton
                label={
                  saving
                    ? 'Guardando...'
                    : editingBudget
                      ? 'Guardar cambios'
                      : 'Crear presupuesto'
                }
                onPress={handleSave}
                disabled={!newTitle.trim() || !newCategory || !newLimit || saving}
              />
              <AnimatedPressable onPress={closeBudgetModal} style={styles.modalCancel}>
                <SText variant="footnote" style={{ fontWeight: '700' }}>Cancelar</SText>
              </AnimatedPressable>
            </BrutalBox>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={!!payBudget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <Animated.View
            entering={SlideInDown.springify().damping(20)}
            style={[styles.modalWrap, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          >
              <BrutalBox shadow={5} contentStyle={[styles.modalContent, styles.payModalContent]}>
                <View style={[styles.payModalAccent, brutalBorder(2, colors)]} />
                <View style={styles.payModalHeader}>
                  <View style={[styles.modalIcon, brutalBorder(2, colors), { backgroundColor: colors.yellow }]}>
                    <Ionicons name="card-outline" size={22} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <SText variant="title3" style={{ fontWeight: '800', textTransform: 'uppercase' }}>
                      Registrar gasto
                    </SText>
                    <SText variant="caption2" color={colors.textMuted} numberOfLines={1}>
                      {payBudget?.title} · {payBudget?.category_name}
                    </SText>
                  </View>
                  <AnimatedPressable onPress={closePay} style={[styles.payCloseBtn, brutalBorder(2, colors)]}>
                    <Ionicons name="close" size={18} color={colors.ink} />
                  </AnimatedPressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.payModalScroll}
                >
                  {payError ? <AuthFeedback type="error" title="Error" message={payError} /> : null}

                  <View style={styles.payStatsRow}>
                    <BrutalBox
                      bg={colors.bgAlt}
                      radius={radii.md}
                      shadow={3}
                      style={styles.payStatBox}
                      contentStyle={styles.payStatInner}
                    >
                      <View style={[styles.payStatIcon, brutalBorder(2, colors), { backgroundColor: colors.surface }]}>
                        <Ionicons name="wallet-outline" size={14} color={colors.ink} />
                      </View>
                      <SText variant="caption2" color={colors.textMuted} style={styles.payStatLabel}>
                        Balance
                      </SText>
                      <SText variant="callout" style={{ fontWeight: '800' }} numberOfLines={1}>
                        {balanceLoading ? '...' : formatCOP(accountBalance ?? 0)}
                      </SText>
                    </BrutalBox>
                    <BrutalBox
                      bg={colors.incomeBg}
                      radius={radii.md}
                      shadow={3}
                      style={styles.payStatBox}
                      contentStyle={styles.payStatInner}
                    >
                      <View style={[styles.payStatIcon, brutalBorder(2, colors), { backgroundColor: colors.surface }]}>
                        <Ionicons name="pie-chart-outline" size={14} color="#15803D" />
                      </View>
                      <SText variant="caption2" color={colors.textMuted} style={styles.payStatLabel}>
                        En presupuesto
                      </SText>
                      <SText variant="callout" color="#15803D" style={{ fontWeight: '800' }} numberOfLines={1}>
                        {formatCOP(payRemaining)}
                      </SText>
                    </BrutalBox>
                  </View>

                  <SText variant="caption1" color={colors.textMuted} style={styles.payFieldLabel}>
                    Monto del gasto
                  </SText>
                  <BrutalBox bg={colors.yellow} radius={radii.md} shadow={3} contentStyle={styles.payAmountCard}>
                    <View style={styles.payAmountRow}>
                      <SText variant="title2" style={{ fontWeight: '800' }}>$</SText>
                      <TextInput
                        style={styles.payInput}
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        value={formatCOPDigits(payAmount)}
                        onChangeText={(t) => setPayAmount(parseCOPDigits(t))}
                        keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                        autoFocus
                      />
                      <SText variant="caption1" color={colors.textSecondary} style={{ fontWeight: '700' }}>
                        COP
                      </SText>
                    </View>
                    {payAmount.length > 0 ? (
                      <SText
                        variant="footnote"
                        color={exceedsBalance ? colors.expense : colors.textSecondary}
                        style={{ textAlign: 'center', fontWeight: exceedsBalance ? '700' : '500' }}
                      >
                        {exceedsBalance
                          ? 'Supera tu balance disponible'
                          : 'Pesos colombianos (COP)'}
                      </SText>
                    ) : null}
                  </BrutalBox>

                  {payRemaining > 0 && payAmount !== parseCOPDigits(String(Math.round(payRemaining))) ? (
                    <AnimatedPressable
                      onPress={() => setPayAmount(parseCOPDigits(String(Math.round(payRemaining))))}
                      style={{ marginBottom: spacing.lg }}
                    >
                      <BrutalBox bg={colors.surfaceAlt} radius={radii.pill} shadow={3} contentStyle={styles.quickFillChip}>
                        <Ionicons name="flash" size={14} color={colors.ink} />
                        <SText variant="caption2" style={{ fontWeight: '800' }}>
                          Usar {formatCOP(payRemaining)} del presupuesto
                        </SText>
                      </BrutalBox>
                    </AnimatedPressable>
                  ) : null}

                  <SText variant="caption1" color={colors.textMuted} style={styles.payFieldLabel}>
                    Nota opcional
                  </SText>
                  <TextInput
                    style={[styles.payNoteInput, brutalBorder(2, colors)]}
                    value={payNote}
                    onChangeText={setPayNote}
                    placeholder="Detalle del pago..."
                    placeholderTextColor={colors.textMuted}
                  />

                  <BrutalButton
                    label={paying ? 'Guardando...' : 'Confirmar gasto'}
                    variant="pink"
                    onPress={handlePay}
                    disabled={!payAmount || paying || balanceLoading}
                    style={{ marginTop: spacing.md }}
                  />
                  <AnimatedPressable onPress={closePay} style={styles.modalCancel}>
                    <SText variant="footnote" style={{ fontWeight: '700' }}>Cancelar</SText>
                  </AnimatedPressable>
                </ScrollView>
              </BrutalBox>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <BudgetMonthReviewModal
        visible={showReviewModal}
        month={currentMonth}
        budgets={budgets.data}
        rolledFromMonth={budgets.rolledFromMonth}
        saving={reviewSaving}
        onConfirm={handleReviewConfirm}
        onDismiss={handleReviewDismiss}
      />

      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={closeDeleteConfirm}>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            style={[styles.modalWrap, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          >
            <BrutalBox bg={colors.expenseBg} shadow={5} contentStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, brutalBorder(undefined, colors), { backgroundColor: colors.surface }]}>
                  <Ionicons name="trash-outline" size={22} color={colors.expense} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <SText variant="title3" style={{ fontWeight: '800', textTransform: 'uppercase' }}>
                    Eliminar presupuesto
                  </SText>
                  <SText variant="caption2" color={colors.textMuted} numberOfLines={1}>
                    {deleteTarget?.title}
                  </SText>
                </View>
              </View>

              {deleteError ? (
                <AuthFeedback type="error" title="Error" message={deleteError} />
              ) : null}

              <SText variant="body" color={colors.textSecondary} style={{ lineHeight: 22, marginBottom: spacing.lg }}>
                ¿Eliminar "{deleteTarget?.title}"? Los gastos ya registrados no se borran.
              </SText>

              <BrutalButton
                label={deleting ? 'Eliminando...' : 'Sí, eliminar'}
                variant="pink"
                onPress={handleDeleteConfirm}
                disabled={deleting}
              />
              <AnimatedPressable onPress={closeDeleteConfirm} style={styles.modalCancel} disabled={deleting}>
                <SText variant="footnote" style={{ fontWeight: '700' }}>Cancelar</SText>
              </AnimatedPressable>
            </BrutalBox>
          </Animated.View>
        </View>
      </Modal>

      <BalanceExceededAlert
        visible={showExceededAlert}
        balance={accountBalance ?? 0}
        amount={payNumAmount}
        onDismiss={() => setShowExceededAlert(false)}
      />
    </BrutalScreen>
  );
}

