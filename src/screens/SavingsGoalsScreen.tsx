import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { getMainAccount } from '@/services/accountService';
import { addContribution, createSavingsGoal } from '@/services/savingsService';
import SavingsGoalCard from '@/src/components/SavingsGoalCard';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import SText from '@/src/components/SText';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import HighlightText from '@/src/components/HighlightText';
import FadeInView from '@/src/components/FadeInView';
import AuthFeedback from '@/src/components/AuthFeedback';
import ProgressBar from '@/src/components/ProgressBar';
import { useApp } from '@/src/context/AppContext';
import { copDigitsToNumber, formatCOP, formatCOPDigits, parseCOPDigits } from '@/src/utils/currency';
import BalanceExceededAlert from '@/src/components/BalanceExceededAlert';
import { radii, spacing, brutalBorder, webTextInputReset } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import type { ThemeColors } from '@/src/constants/colors';

const presetIcons = ['airplane', 'shield-checkmark', 'laptop', 'home', 'car', 'heart', 'school', 'gift'];

function getPresetColors(colors: ThemeColors) {
  return ['#4A9EFF', colors.yellowDark, colors.pink, colors.warning, '#A855F7', '#FF69B4', '#00D4AA', '#FF8C00'];
}

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
  tone: 'neutral' | 'ok' | 'warn';
  icon: keyof typeof Ionicons.glyphMap;
  colors: ThemeColors;
  styles: Record<string, object>;
}) {
  const bg =
    tone === 'ok' ? colors.incomeBg
    : tone === 'warn' ? colors.surfaceAlt
    : colors.surface;
  const fg = tone === 'ok' ? '#15803D' : colors.ink;

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

interface SavingsGoalsScreenProps {
  showAddButton?: boolean;
}

export default function SavingsGoalsScreen({ showAddButton: _showAddButton }: SavingsGoalsScreenProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) =>
      StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1, zIndex: 1 },
    scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    topBar: { marginBottom: spacing.lg },
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
    progressCard: { padding: spacing.lg, marginBottom: spacing.lg },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    progressBadge: {
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
    input: {
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
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    amountField: {
      flex: 1,
      color: colors.ink,
      fontSize: 18,
      fontWeight: '700',
      paddingVertical: 12,
    },
    iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.sm },
    iconItem: {
      width: 46,
      height: 46,
      borderRadius: radii.sm,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorItem: { width: 36, height: 36, borderRadius: 18 },
    modalCancel: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm },
    balanceHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    balanceNote: { marginBottom: spacing.md, lineHeight: 18 },
    contributeInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    contributeInput: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.ink,
      minWidth: 100,
      textAlign: 'center',
      ...webTextInputReset,
    },
  })
    );
  const presetColors = getPresetColors(colors);
  const { triggerRefresh } = useApp();
  const goals = useSavingsGoals();

  const [showCreate, setShowCreate] = useState(false);
  const [showContribute, setShowContribute] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('shield-checkmark');
  const [selectedColor, setSelectedColor] = useState(colors.yellowDark);
  const [contributeAmount, setContributeAmount] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [contributeError, setContributeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showExceededAlert, setShowExceededAlert] = useState(false);

  const summary = useMemo(() => {
    const totalSaved = goals.data.reduce((s, g) => s + Number(g.saved_amount), 0);
    const totalTarget = goals.data.reduce((s, g) => s + Number(g.target_amount), 0);
    const remaining = Math.max(totalTarget - totalSaved, 0);
    const overallPct =
      totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    const completed = goals.data.filter(
      (g) => g.target_amount > 0 && g.saved_amount >= g.target_amount
    ).length;
    return { totalSaved, totalTarget, remaining, overallPct, completed };
  }, [goals.data]);

  const contributeGoal = goals.data.find((g) => g.id === showContribute);

  useEffect(() => {
    if (!showContribute) {
      setAccountBalance(null);
      return;
    }
    setBalanceLoading(true);
    getMainAccount()
      .then((acct) => setAccountBalance(acct ? Number(acct.balance) : 0))
      .catch(() => setAccountBalance(0))
      .finally(() => setBalanceLoading(false));
  }, [showContribute]);

  const contributeAmountNum = copDigitsToNumber(contributeAmount);
  const exceedsBalance =
    accountBalance !== null && contributeAmountNum > accountBalance;

  function openCreate() {
    setCreateError(null);
    setShowCreate(true);
  }

  async function handleCreate() {
    if (!title.trim() || !targetAmount) {
      setCreateError('Nombre y monto objetivo son obligatorios.');
      return;
    }
    setSaving(true);
    setCreateError(null);
    try {
      await createSavingsGoal({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
        target_amount: copDigitsToNumber(targetAmount),
      });
      goals.refresh();
      triggerRefresh();
      setShowCreate(false);
      setTitle('');
      setSubtitle('');
      setTargetAmount('');
      setSelectedIcon('shield-checkmark');
      setSelectedColor(colors.yellowDark);
    } catch (e: any) {
      setCreateError(e.message || 'No se pudo crear la meta.');
    } finally {
      setSaving(false);
    }
  }

  async function handleContribute(goalId: string) {
    const amount = copDigitsToNumber(contributeAmount);
    if (!amount || amount <= 0) {
      setContributeError('Ingresa un monto mayor a 0.');
      return;
    }
    if (accountBalance !== null && amount > accountBalance) {
      setShowExceededAlert(true);
      return;
    }
    setSaving(true);
    setContributeError(null);
    try {
      await addContribution(goalId, amount);
      goals.refresh();
      triggerRefresh();
      setShowContribute(null);
      setContributeAmount('');
    } catch (e: any) {
      if (/saldo insuficiente|supera tu balance/i.test(e.message || '')) {
        setShowExceededAlert(true);
      } else {
        setContributeError(e.message || 'No se pudo aportar.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <HighlightText variant="title2">Tus metas</HighlightText>
              <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 6 }}>
                Ahorra para lo que más te importa
              </SText>
            </View>
          </View>
        </FadeInView>

        {goals.loading ? (
          <>
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </>
        ) : goals.data.length === 0 ? (
          <FadeInView index={1}>
            <BrutalBox bg={colors.yellow} radius={radii.xl} shadow={6} contentStyle={styles.emptyHero}>
              <View style={[styles.emptyHeroIcon, brutalBorder(3, colors)]}>
                <Ionicons name="flag" size={36} color={colors.ink} />
              </View>
              <SText variant="title3" style={styles.emptyHeroTitle}>
                Empieza a ahorrar
              </SText>
              <SText variant="footnote" color={colors.textSecondary} style={styles.emptyHeroText}>
                Define metas claras — emergencia, viaje, equipo — y ve tu progreso mes a mes.
              </SText>
            </BrutalBox>

            <BrutalBox contentStyle={styles.tipsCard}>
              <SText variant="subhead" style={styles.tipsTitle}>Ideas para empezar</SText>
              {[
                { icon: 'shield-checkmark' as const, text: 'Fondo de emergencia (3–6 meses de gastos)' },
                { icon: 'airplane' as const, text: 'Viaje o experiencia que quieras' },
                { icon: 'laptop' as const, text: 'Compra grande: laptop, moto, etc.' },
              ].map((tip, i) => (
                <View key={tip.icon} style={[styles.tipRow, i > 0 && styles.tipRowBorder]}>
                  <View style={[styles.tipIcon, brutalBorder(2, colors), { backgroundColor: colors.yellow }]}>
                    <Ionicons name={tip.icon} size={18} color={colors.ink} />
                  </View>
                  <SText variant="body" style={{ flex: 1, fontWeight: '600' }}>{tip.text}</SText>
                </View>
              ))}
            </BrutalBox>

            <AnimatedPressable onPress={openCreate} style={{ marginTop: spacing.md }}>
              <BrutalBox bg={colors.pink} radius={radii.pill} shadow={4} contentStyle={styles.emptyCta}>
                <Ionicons name="add-circle" size={22} color={colors.ink} />
                <SText variant="callout" style={{ fontWeight: '800' }}>Crear mi primera meta</SText>
              </BrutalBox>
            </AnimatedPressable>
          </FadeInView>
        ) : (
          <>
            <FadeInView index={1}>
              <View style={styles.summaryRow}>
                <SummaryStat
                  label="AHORRADO"
                  value={formatCOP(summary.totalSaved)}
                  tone="ok"
                  icon="wallet"
                  colors={colors}
                  styles={styles}
                />
                <SummaryStat
                  label="META TOTAL"
                  value={formatCOP(summary.totalTarget)}
                  tone="neutral"
                  icon="flag"
                  colors={colors}
                  styles={styles}
                />
                <SummaryStat
                  label="FALTA"
                  value={formatCOP(summary.remaining)}
                  tone="warn"
                  icon="hourglass"
                  colors={colors}
                  styles={styles}
                />
              </View>
            </FadeInView>

            <FadeInView index={2}>
              <BrutalBox contentStyle={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <View>
                    <SText variant="subhead" style={styles.sectionTitle}>Progreso global</SText>
                    <SText variant="caption2" color={colors.textMuted}>
                      {summary.completed > 0
                        ? `${summary.completed} meta${summary.completed > 1 ? 's' : ''} completada${summary.completed > 1 ? 's' : ''}`
                        : 'Sigue aportando poco a poco'}
                    </SText>
                  </View>
                  <View style={[styles.progressBadge, brutalBorder(2, colors), { backgroundColor: colors.yellow }]}>
                    <SText variant="headline" style={{ fontWeight: '800' }}>{summary.overallPct}%</SText>
                  </View>
                </View>
                <ProgressBar
                  percentage={Math.min(summary.overallPct, 100)}
                  height={14}
                  color={summary.overallPct >= 100 ? colors.income : colors.yellowDark}
                />
              </BrutalBox>
            </FadeInView>

            <FadeInView index={3}>
              <View style={styles.listHeader}>
                <HighlightText variant="title3">Mis metas</HighlightText>
                <View style={[styles.countBadge, brutalBorder(2, colors)]}>
                  <SText variant="caption2" style={{ fontWeight: '800' }}>{goals.data.length}</SText>
                </View>
              </View>
            </FadeInView>

            {goals.data.map((g, i) => (
              <SavingsGoalCard
                key={g.id}
                goal={g}
                index={i + 4}
                onContribute={() => {
                  setContributeError(null);
                  setShowContribute(g.id);
                }}
              />
            ))}

            <FadeInView index={goals.data.length + 5}>
              <AnimatedPressable onPress={openCreate}>
                <BrutalBox bg={colors.surfaceAlt} radius={radii.lg} shadow={3} contentStyle={styles.addMoreCard}>
                  <View style={[styles.addMoreIcon, brutalBorder(2, colors), { backgroundColor: colors.yellow }]}>
                    <Ionicons name="add" size={22} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SText variant="body" style={{ fontWeight: '800' }}>Nueva meta de ahorro</SText>
                    <SText variant="caption2" color={colors.textMuted}>Viaje, emergencia, compra grande…</SText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </BrutalBox>
              </AnimatedPressable>
            </FadeInView>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInDown.springify().damping(20)} style={styles.modalWrap}>
            <BrutalBox contentStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, brutalBorder(2, colors), { backgroundColor: colors.yellow }]}>
                  <Ionicons name="flag" size={22} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <SText variant="title3" style={{ fontWeight: '800', textTransform: 'uppercase' }}>
                    Nueva meta
                  </SText>
                  <SText variant="caption2" color={colors.textMuted}>Define tu objetivo de ahorro</SText>
                </View>
              </View>

              {createError ? <AuthFeedback type="error" title="Error" message={createError} /> : null}

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Nombre</SText>
              <TextInput
                style={[styles.input, brutalBorder(2, colors)]}
                placeholder="Ej. Fondo de emergencia"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Etiqueta (opcional)</SText>
              <TextInput
                style={[styles.input, brutalBorder(2, colors)]}
                placeholder="Ej. Red de seguridad"
                placeholderTextColor={colors.textMuted}
                value={subtitle}
                onChangeText={setSubtitle}
              />

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Monto objetivo</SText>
              <View style={[styles.inputWrap, brutalBorder(2, colors)]}>
                <SText variant="body" style={{ fontWeight: '700' }}>$</SText>
                <TextInput
                  style={styles.amountField}
                  placeholder="Ej. 5.000.000"
                  placeholderTextColor={colors.textMuted}
                  value={formatCOPDigits(targetAmount)}
                  onChangeText={(t) => setTargetAmount(parseCOPDigits(t))}
                  keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                />
                <SText variant="caption2" color={colors.textMuted} style={{ fontWeight: '700' }}>COP</SText>
              </View>

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Icono</SText>
              <View style={styles.iconRow}>
                {presetIcons.map((ic) => (
                  <AnimatedPressable
                    key={ic}
                    style={[styles.iconItem, brutalBorder(2, colors), selectedIcon === ic && { backgroundColor: colors.yellow }]}
                    onPress={() => setSelectedIcon(ic)}
                  >
                    <Ionicons name={ic as any} size={22} color={colors.ink} />
                  </AnimatedPressable>
                ))}
              </View>

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Color</SText>
              <View style={styles.iconRow}>
                {presetColors.map((clr) => (
                  <AnimatedPressable
                    key={clr}
                    style={[
                      styles.colorItem,
                      { backgroundColor: clr },
                      brutalBorder(2, colors),
                      selectedColor === clr && { borderColor: colors.ink, borderWidth: 3 },
                    ]}
                    onPress={() => setSelectedColor(clr)}
                  />
                ))}
              </View>

              <BrutalButton
                label={saving ? 'Creando...' : 'Crear meta'}
                onPress={handleCreate}
                disabled={!title.trim() || !targetAmount || saving}
              />
              <AnimatedPressable onPress={() => setShowCreate(false)} style={styles.modalCancel}>
                <SText variant="footnote" style={{ fontWeight: '700' }}>Cancelar</SText>
              </AnimatedPressable>
            </BrutalBox>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={!!showContribute} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInDown.springify().damping(20)} style={styles.modalWrap}>
            <BrutalBox bg={colors.yellow} contentStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, brutalBorder(2, colors), { backgroundColor: colors.surface }]}>
                  <Ionicons name="cash" size={22} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <SText variant="title3" style={{ fontWeight: '800' }}>Aportar</SText>
                  <SText variant="caption2" color={colors.textSecondary} numberOfLines={1}>
                    {contributeGoal?.title ?? 'Meta de ahorro'}
                  </SText>
                </View>
              </View>

              {contributeError ? <AuthFeedback type="error" title="Error" message={contributeError} /> : null}

              <BrutalBox bg={colors.surface} radius={radii.md} shadow={2} contentStyle={styles.balanceHint}>
                <Ionicons name="wallet-outline" size={18} color={colors.ink} />
                <View style={{ flex: 1 }}>
                  <SText variant="caption2" color={colors.textMuted}>Balance neto disponible</SText>
                  <SText variant="callout" style={{ fontWeight: '800', marginTop: 2 }}>
                    {balanceLoading ? '...' : formatCOP(accountBalance ?? 0)}
                  </SText>
                </View>
              </BrutalBox>
              <SText variant="caption2" color={colors.textMuted} style={styles.balanceNote}>
                El aporte se descuenta de tu balance neto y queda registrado como gasto en Ahorro.
              </SText>

              <View style={[styles.contributeInputWrap, brutalBorder(3, colors)]}>
                <SText variant="title2" style={{ fontWeight: '800' }}>$</SText>
                <TextInput
                  style={styles.contributeInput}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={formatCOPDigits(contributeAmount)}
                  onChangeText={(t) => setContributeAmount(parseCOPDigits(t))}
                  keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                  autoFocus
                />
                <SText variant="caption1" color={colors.textSecondary} style={{ fontWeight: '700' }}>COP</SText>
              </View>

              {contributeAmount.length > 0 ? (
                <SText
                  variant="footnote"
                  color={exceedsBalance ? colors.expense : colors.textSecondary}
                  style={{ textAlign: 'center', marginBottom: spacing.md, fontWeight: exceedsBalance ? '700' : '400' }}
                >
                  {exceedsBalance
                    ? 'Supera tu balance disponible'
                    : 'Pesos colombianos (COP)'}
                </SText>
              ) : null}

              <BrutalButton
                label={saving ? 'Guardando...' : 'Confirmar aporte'}
                onPress={() => showContribute && handleContribute(showContribute)}
                disabled={!contributeAmount || saving || balanceLoading}
              />
              <AnimatedPressable
                onPress={() => {
                  setShowContribute(null);
                  setContributeAmount('');
                  setContributeError(null);
                }}
                style={styles.modalCancel}
              >
                <SText variant="footnote" style={{ fontWeight: '700' }}>Cancelar</SText>
              </AnimatedPressable>
            </BrutalBox>
          </Animated.View>
        </View>
      </Modal>

      <BalanceExceededAlert
        visible={showExceededAlert}
        balance={accountBalance ?? 0}
        amount={contributeAmountNum}
        onDismiss={() => setShowExceededAlert(false)}
      />
    </View>
  );
}

