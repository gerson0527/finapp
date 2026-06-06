import { useBudgets } from '@/hooks/useBudgets';
import { useMonthlyStats } from '@/hooks/useMonthlyStats';
import { useTransactions } from '@/hooks/useTransactions';
import { getMainAccount } from '@/services/accountService';
import { formatMonthLabel } from '@/lib/month';
import { isBalanceCritical, isBalanceEmpty } from '@/lib/balanceAlerts';
import BrutalScreen from '@/src/components/BrutalScreen';
import BrutalBox from '@/src/components/BrutalBox';
import BudgetCard from '@/src/components/BudgetCard';
import FadeInView from '@/src/components/FadeInView';
import HighlightText from '@/src/components/HighlightText';
import MonthSelector from '@/src/components/MonthSelector';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import SText from '@/src/components/SText';
import TransactionItem from '@/src/components/TransactionItem';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import ProgressBar from '@/src/components/ProgressBar';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { formatCOP } from '@/src/utils/currency';
import { isEditableTransaction } from '@/lib/transactionHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import ZeroBalanceAlert from '@/src/components/ZeroBalanceAlert';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

function BalanceHero({
  value,
  loading,
  critical,
}: {
  value: number;
  loading: boolean;
  critical: boolean;
}) {
  const isEmpty = !loading && isBalanceEmpty(value);
  const isLow = !loading && critical && !isEmpty;
  const scale = useSharedValue(0.92);
  useEffect(() => {
    if (!loading) scale.value = withSpring(1, { damping: 14 });
  }, [loading, value]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.heroInner, animStyle]}>
      {isEmpty || isLow ? (
        <View style={[styles.zeroBadge, brutalBorder(2)]}>
          <Ionicons name="sad-outline" size={14} color={colors.expense} />
          <SText variant="caption2" color={colors.expense} style={{ fontWeight: '800' }}>
            {isEmpty ? 'Sin saldo' : 'Casi en cero'}
          </SText>
        </View>
      ) : null}
      <SText variant="label" color={colors.textSecondary} style={styles.heroLabel}>
        BALANCE NETO
      </SText>
      {loading ? (
        <SText variant="title1" style={styles.heroAmount}>---</SText>
      ) : (
        <SText
          variant="title1"
          style={[styles.heroAmount, (isEmpty || isLow) && { color: colors.expense }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}
        >
          {formatCOP(value)}
        </SText>
      )}
    </Animated.View>
  );
}

function StatTile({
  label,
  value,
  loading,
  tone,
  icon,
}: {
  label: string;
  value: string;
  loading: boolean;
  tone: 'income' | 'expense';
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const bg = tone === 'income' ? colors.incomeBg : colors.expenseBg;
  const fg = tone === 'income' ? '#15803D' : colors.expense;

  return (
    <BrutalBox bg={bg} radius={radii.md} shadow={3} style={{ flex: 1 }} contentStyle={styles.statTile}>
      <View style={[styles.statIcon, brutalBorder(2), { backgroundColor: colors.surface }]}>
        <Ionicons name={icon} size={18} color={fg} />
      </View>
      <SText variant="caption2" color={colors.textMuted}>{label}</SText>
      {loading ? (
        <SkeletonLoader variant="text" />
      ) : (
        <SText variant="headline" color={fg} style={{ fontWeight: '800', marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </SText>
      )}
    </BrutalBox>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  bg = colors.surface,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  bg?: string;
}) {
  return (
    <AnimatedPressable style={{ flex: 1 }} onPress={onPress}>
      <BrutalBox bg={bg} radius={radii.md} shadow={3} contentStyle={styles.quickAction}>
        <Ionicons name={icon} size={22} color={colors.ink} />
        <SText variant="micro" style={styles.quickLabel}>{label}</SText>
      </BrutalBox>
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { selectedMonth, refreshKey } = useApp();
  const stats = useMonthlyStats(selectedMonth);
  const budgets = useBudgets(selectedMonth);
  const transactions = useTransactions(selectedMonth);

  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showZeroAlert, setShowZeroAlert] = useState(false);
  const wasHealthyRef = useRef(true);
  const dismissedCriticalRef = useRef(false);

  const loadBalance = useCallback(() => {
    setBalanceLoading(true);
    getMainAccount()
      .then((acct) => {
        if (acct) setBalance(Number(acct.balance));
        setFetchError(false);
      })
      .catch(() => setFetchError(true))
      .finally(() => setBalanceLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBalance();
      stats.refresh();
      budgets.refresh();
      transactions.refresh();
    }, [loadBalance, stats.refresh, budgets.refresh, transactions.refresh, refreshKey])
  );

  useEffect(() => {
    loadBalance();
  }, [loadBalance, refreshKey]);

  const balanceCritical = isBalanceCritical(balance, stats.income);

  useEffect(() => {
    if (balanceLoading) return;

    if (!balanceCritical) {
      wasHealthyRef.current = true;
      dismissedCriticalRef.current = false;
      return;
    }

    if (wasHealthyRef.current && !dismissedCriticalRef.current) {
      setShowZeroAlert(true);
      wasHealthyRef.current = false;
    }
  }, [balance, balanceLoading, balanceCritical]);

  const health =
    budgets.data.length > 0
      ? Math.round(
          budgets.data.reduce((s, b) => s + Number(b.percentage), 0) / budgets.data.length
        )
      : 0;

  const netFlow = stats.income - stats.expenses;
  const netPositive = netFlow >= 0;
  const recentTxns = transactions.data.slice(0, 4);
  const monthLabel = formatMonthLabel(selectedMonth);

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
              <HighlightText variant="title2">Tu dinero</HighlightText>
              <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 6 }}>
                Resumen de {monthLabel}
              </SText>
            </View>
            <MonthSelector />
          </View>
        </FadeInView>

        <FadeInView index={1}>
          <BrutalBox
            bg={!balanceLoading && balanceCritical ? colors.expenseBg : colors.yellow}
            radius={radii.xl}
            shadow={6}
            contentStyle={styles.heroCard}
          >
            <BalanceHero value={balance} loading={balanceLoading} critical={balanceCritical} />
            {!stats.loading && (
              <View style={[styles.flowPill, brutalBorder(2), { backgroundColor: colors.surface }]}>
                <Ionicons
                  name={netPositive ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={netPositive ? '#15803D' : colors.expense}
                />
                <SText
                  variant="caption1"
                  style={{ fontWeight: '700', color: netPositive ? '#15803D' : colors.expense }}
                >
                  {netPositive ? '+' : ''}{formatCOP(netFlow)} este mes
                </SText>
              </View>
            )}
          </BrutalBox>
        </FadeInView>

        {fetchError && (
          <BrutalBox bg={colors.errorBg} radius={radii.md} contentStyle={styles.errorBanner}>
            <SText variant="footnote" color={colors.error}>
              Error de conexión. Verifica Supabase.
            </SText>
          </BrutalBox>
        )}

        <FadeInView index={2}>
          <View style={styles.statsRow}>
            <StatTile
              label="INGRESOS"
              value={`+${formatCOP(stats.income)}`}
              loading={stats.loading}
              tone="income"
              icon="arrow-up-circle"
            />
            <StatTile
              label="GASTOS"
              value={`-${formatCOP(stats.expenses)}`}
              loading={stats.loading}
              tone="expense"
              icon="arrow-down-circle"
            />
          </View>
        </FadeInView>

        <FadeInView index={3}>
          <View style={styles.quickRow}>
            <QuickAction icon="add-circle" label="Añadir" onPress={() => router.push('/(tabs)/add')} bg={colors.yellow} />
            <QuickAction icon="wallet" label="Presup." onPress={() => router.push('/(tabs)/budgets')} />
            <QuickAction icon="analytics" label="Comparar" onPress={() => router.push('/(tabs)/compare')} />
          </View>
        </FadeInView>

        <FadeInView index={4}>
          <BrutalBox contentStyle={styles.healthCard}>
            <View style={styles.healthHeader}>
              <SText variant="subhead" style={styles.sectionTitle}>Salud presupuestal</SText>
              <SText variant="headline" style={{ fontWeight: '800' }}>{health}%</SText>
            </View>
            <ProgressBar
              percentage={Math.min(health, 100)}
              height={14}
              color={health > 80 ? colors.pink : colors.yellowDark}
            />
            <SText variant="caption2" color={colors.textMuted} style={{ marginTop: 8 }}>
              Promedio de uso de tus presupuestos
            </SText>
          </BrutalBox>
        </FadeInView>

        {budgets.data.length > 0 && (
          <FadeInView index={5}>
            <View style={styles.sectionHeader}>
              <HighlightText variant="title3">Presupuestos</HighlightText>
              <AnimatedPressable onPress={() => router.push('/(tabs)/budgets')}>
                <SText variant="caption1" color={colors.pink} style={{ fontWeight: '800' }}>
                  VER TODOS →
                </SText>
              </AnimatedPressable>
            </View>
          </FadeInView>
        )}

        {budgets.loading ? (
          <>
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </>
        ) : (
          budgets.data.slice(0, 2).map((b, i) => (
            <BudgetCard key={b.id} budget={b} index={i + 6} />
          ))
        )}

        <FadeInView index={8}>
          <View style={styles.sectionHeader}>
            <HighlightText variant="title3">Actividad</HighlightText>
            {recentTxns.length > 0 && (
              <AnimatedPressable onPress={() => router.push('/(tabs)/history')}>
                <SText variant="caption1" color={colors.pink} style={{ fontWeight: '800' }}>
                  VER MÁS →
                </SText>
              </AnimatedPressable>
            )}
          </View>
        </FadeInView>

        <FadeInView index={9}>
          <BrutalBox contentStyle={styles.txnCard}>
            {transactions.loading ? (
              <>
                <SkeletonLoader variant="listItem" />
                <SkeletonLoader variant="listItem" />
              </>
            ) : recentTxns.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, brutalBorder(2)]}>
                  <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
                </View>
                <SText variant="body" style={{ fontWeight: '700', marginTop: 12 }}>
                  Sin movimientos
                </SText>
                <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 4, textAlign: 'center' }}>
                  Registra tu primer ingreso o gasto
                </SText>
                <AnimatedPressable onPress={() => router.push('/(tabs)/add')} style={{ marginTop: 16 }}>
                  <BrutalBox bg={colors.yellow} radius={radii.pill} shadow={3} contentStyle={styles.emptyBtn}>
                    <Ionicons name="add" size={18} color={colors.ink} />
                    <SText variant="callout" style={{ fontWeight: '800' }}>Añadir transacción</SText>
                  </BrutalBox>
                </AnimatedPressable>
              </View>
            ) : (
              recentTxns.map((tx, i) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  showDate
                  index={i}
                  readOnly={!isEditableTransaction(tx)}
                  onPress={() =>
                    router.push({ pathname: '/transaction/[id]', params: { id: tx.id } })
                  }
                />
              ))
            )}
          </BrutalBox>
        </FadeInView>

        <View style={{ height: 120 }} />
      </ScrollView>

      <ZeroBalanceAlert
        visible={showZeroAlert}
        balance={balance}
        onDismiss={() => {
          setShowZeroAlert(false);
          dismissedCriticalRef.current = true;
        }}
        onGoToBudgets={() => router.push('/(tabs)/budgets')}
      />
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
  heroCard: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroInner: { alignItems: 'center', width: '100%' },
  zeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginBottom: spacing.sm,
  },
  heroLabel: { letterSpacing: 1, marginBottom: spacing.sm },
  heroAmount: { fontWeight: '800', fontSize: 36, textAlign: 'center', width: '100%' },
  flowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    marginTop: spacing.lg,
  },
  errorBanner: { padding: spacing.md, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statTile: { flex: 1, padding: spacing.lg },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickAction: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: 6,
  },
  quickLabel: { fontWeight: '700', textAlign: 'center' },
  healthCard: { padding: spacing.lg, marginBottom: spacing.lg },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontWeight: '800', textTransform: 'uppercase' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  txnCard: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, marginBottom: spacing.lg },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.bgAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
