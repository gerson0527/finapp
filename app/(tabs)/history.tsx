import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useTransactions } from '@/hooks/useTransactions';
import { getCategories } from '@/services/categoryService';
import { getCurrentMonth, formatMonthLabel, getRecentMonths } from '@/lib/month';
import TransactionItem from '@/src/components/TransactionItem';
import SText from '@/src/components/SText';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import BrutalScreen from '@/src/components/BrutalScreen';
import HighlightText from '@/src/components/HighlightText';
import BrutalBox from '@/src/components/BrutalBox';
import { formatCOP } from '@/src/utils/currency';
import { isEditableTransaction } from '@/lib/transactionHelpers';
import { radii, spacing, brutalBorder } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import type { ThemeColors } from '@/src/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getTransactionDayKey,
  getTransactionGroupLabel,
} from '@/lib/transactionDate';

function SummaryPill({
  label,
  value,
  tone,
  colors,
  styles,
}: {
  label: string;
  value: string;
  tone: 'income' | 'expense' | 'neutral';
  colors: ThemeColors;
  styles: Record<string, object>;
}) {
  const bg =
    tone === 'income' ? colors.incomeBg
    : tone === 'expense' ? colors.expenseBg
    : colors.surface;
  const fg = tone === 'income' ? '#15803D' : tone === 'expense' ? colors.expense : colors.ink;

  return (
    <BrutalBox bg={bg} radius={radii.md} shadow={3} style={{ flex: 1 }} contentStyle={styles.summaryPill}>
      <SText variant="caption2" color={colors.textMuted} style={styles.summaryLabel}>{label}</SText>
      <SText variant="callout" color={fg} style={{ fontWeight: '800', marginTop: 4 }} numberOfLines={1}>
        {value}
      </SText>
    </BrutalBox>
  );
}

export default function HistoryScreen() {
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
    filterBadge: {
      backgroundColor: colors.pink,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radii.pill,
    },
    summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    summaryPill: { padding: spacing.md, minWidth: 0 },
    summaryLabel: { textTransform: 'uppercase', letterSpacing: 0.3 },
    searchRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
    searchInput: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      height: 48,
      gap: 8,
    },
    input: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '500' },
    filterBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    groupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    groupTitle: { fontWeight: '800', textTransform: 'uppercase' },
    sectionCard: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, marginBottom: spacing.lg },
    divider: { height: 2, backgroundColor: colors.bgAlt },
    emptyState: { padding: spacing.xxxl, alignItems: 'center' },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: radii.md,
      backgroundColor: colors.bgAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalWrap: { padding: spacing.xl },
    modalContent: { padding: spacing.xl },
    fieldLabel: { marginBottom: spacing.sm, textTransform: 'uppercase', fontWeight: '600' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
    },
    chipActive: { backgroundColor: colors.yellow },
    modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, alignItems: 'center' },
    modalSecondary: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
    },
    modalDone: { paddingVertical: 14, alignItems: 'center' },
  })
    );
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [historyMonth, setHistoryMonth] = useState(getCurrentMonth);
  const { data: allTxns, loading, refresh } = useTransactions(historyMonth);

  const [search, setSearch] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense' | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const currentMonth = getCurrentMonth();
  const monthLabel = formatMonthLabel(historyMonth);
  const isCurrentMonth = historyMonth === currentMonth;
  const monthOptions = getRecentMonths(12);

  const hasActiveFilters = !isCurrentMonth || !!catFilter || !!typeFilter;

  React.useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let list = allTxns;
    if (search) {
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          (t.note?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
          (t.category?.name?.toLowerCase().includes(search.toLowerCase()) ?? false)
      );
    }
    if (catFilter) list = list.filter((t) => t.category?.name === catFilter);
    if (typeFilter) list = list.filter((t) => t.type === typeFilter);
    return list;
  }, [allTxns, search, catFilter, typeFilter]);

  const summary = useMemo(() => {
    const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { income, expenses, net: income - expenses };
  }, [filtered]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((tx) => {
      const dayKey = getTransactionDayKey(tx.date);
      const list = map.get(dayKey);
      if (list) list.push(tx);
      else map.set(dayKey, [tx]);
    });

    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dayKey, items]) => ({
        dayKey,
        label: getTransactionGroupLabel(dayKey),
        items,
      }));
  }, [filtered]);

  const openEdit = useCallback((id: string) => {
    router.push({ pathname: '/transaction/[id]', params: { id } });
  }, [router]);

  function clearFilters() {
    setHistoryMonth(getCurrentMonth());
    setCatFilter(null);
    setTypeFilter(null);
    setSearch('');
  }

  let itemIndex = 0;

  return (
    <BrutalScreen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <HighlightText variant="title2">Historial</HighlightText>
              <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 6 }}>
                {monthLabel} · {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
              </SText>
            </View>
            {hasActiveFilters ? (
              <View style={[styles.filterBadge, brutalBorder(2, colors)]}>
                <SText variant="caption2" style={{ fontWeight: '800' }}>Filtrado</SText>
              </View>
            ) : null}
          </View>
        </FadeInView>

        {!loading && filtered.length > 0 ? (
          <FadeInView index={1}>
            <View style={styles.summaryRow}>
              <SummaryPill label="INGRESOS" value={`+${formatCOP(summary.income)}`} tone="income" colors={colors} styles={styles} />
              <SummaryPill label="GASTOS" value={`-${formatCOP(summary.expenses)}`} tone="expense" colors={colors} styles={styles} />
              <SummaryPill
                label="NETO"
                value={`${summary.net >= 0 ? '+' : ''}${formatCOP(summary.net)}`}
                tone="neutral"
                colors={colors}
                styles={styles}
              />
            </View>
          </FadeInView>
        ) : null}

        <FadeInView index={2}>
          <View style={styles.searchRow}>
            <View style={[styles.searchInput, brutalBorder(2, colors)]}>
              <Ionicons name="search" size={18} color={colors.ink} />
              <TextInput
                style={styles.input}
                placeholder="Buscar en este mes..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <AnimatedPressable onPress={() => setFilterVisible(true)}>
              <BrutalBox
                bg={hasActiveFilters ? colors.pink : colors.yellow}
                radius={radii.md}
                shadow={3}
                contentStyle={styles.filterBtn}
              >
                <Ionicons name="options" size={20} color={colors.ink} />
              </BrutalBox>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonLoader key={i} variant="listItem" />)
        ) : grouped.length === 0 ? (
          <FadeInView index={3}>
            <BrutalBox contentStyle={styles.emptyState}>
              <View style={[styles.emptyIcon, brutalBorder(2, colors)]}>
                <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
              </View>
              <SText variant="body" style={{ fontWeight: '800', marginTop: spacing.md }}>
                Sin movimientos
              </SText>
              <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 6, textAlign: 'center' }}>
                {hasActiveFilters
                  ? 'No hay resultados con estos filtros en ' + monthLabel
                  : 'No hay transacciones en ' + monthLabel}
              </SText>
              {hasActiveFilters ? (
                <AnimatedPressable onPress={clearFilters} style={{ marginTop: spacing.lg }}>
                  <BrutalBox bg={colors.yellow} radius={radii.pill} shadow={3} contentStyle={styles.emptyBtn}>
                    <SText variant="callout" style={{ fontWeight: '800' }}>Limpiar filtros</SText>
                  </BrutalBox>
                </AnimatedPressable>
              ) : null}
            </BrutalBox>
          </FadeInView>
        ) : (
          grouped.map((group, gi) => (
            <FadeInView key={group.dayKey} index={gi + 3}>
              <View style={styles.groupHeader}>
                <SText variant="subhead" style={styles.groupTitle}>{group.label}</SText>
                <SText variant="caption2" color={colors.textMuted}>
                  {group.items.length} mov.
                </SText>
              </View>
              <BrutalBox contentStyle={styles.sectionCard}>
                {group.items.map((tx, i) => {
                  const idx = itemIndex++;
                  return (
                    <View key={tx.id}>
                      <TransactionItem
                        transaction={tx}
                        showTime
                        index={idx}
                        onPress={() => openEdit(tx.id)}
                        readOnly={!isEditableTransaction(tx)}
                      />
                      {i < group.items.length - 1 ? <View style={styles.divider} /> : null}
                    </View>
                  );
                })}
              </BrutalBox>
            </FadeInView>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={filterVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterVisible(false)}>
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            style={[styles.modalWrap, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          >
            <TouchableOpacity activeOpacity={1}>
              <BrutalBox contentStyle={styles.modalContent}>
                <SText variant="title3" style={{ fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }}>
                  Filtros
                </SText>
                <SText variant="caption2" color={colors.textMuted} style={{ marginBottom: spacing.lg }}>
                  Cambia el mes o refina la lista
                </SText>

                <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Mes</SText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                  <View style={styles.chipRow}>
                    {monthOptions.map((m) => (
                      <AnimatedPressable
                        key={m.value}
                        style={[styles.chip, brutalBorder(2, colors), historyMonth === m.value && styles.chipActive]}
                        onPress={() => setHistoryMonth(m.value)}
                      >
                        <SText variant="caption2" style={{ fontWeight: '800' }}>{m.label}</SText>
                      </AnimatedPressable>
                    ))}
                  </View>
                </ScrollView>

                <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Tipo</SText>
                <View style={styles.chipRow}>
                  {([
                    { label: 'Todos', value: null },
                    { label: 'Ingresos', value: 'income' as const },
                    { label: 'Gastos', value: 'expense' as const },
                  ]).map((opt) => (
                    <AnimatedPressable
                      key={opt.label}
                      style={[styles.chip, brutalBorder(2, colors), typeFilter === opt.value && styles.chipActive]}
                      onPress={() => setTypeFilter(opt.value)}
                    >
                      <SText variant="caption2" style={{ fontWeight: '800' }}>{opt.label}</SText>
                    </AnimatedPressable>
                  ))}
                </View>

                <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Categoría</SText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                  <View style={styles.chipRow}>
                    <AnimatedPressable
                      style={[styles.chip, brutalBorder(2, colors), !catFilter && styles.chipActive]}
                      onPress={() => setCatFilter(null)}
                    >
                      <SText variant="caption2" style={{ fontWeight: '800' }}>Todas</SText>
                    </AnimatedPressable>
                    {categories.map((c) => (
                      <AnimatedPressable
                        key={c.id}
                        style={[styles.chip, brutalBorder(2, colors), catFilter === c.name && styles.chipActive]}
                        onPress={() => setCatFilter(catFilter === c.name ? null : c.name)}
                      >
                        <SText variant="caption2" style={{ fontWeight: '800' }}>{c.name}</SText>
                      </AnimatedPressable>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  {hasActiveFilters ? (
                    <AnimatedPressable style={[styles.modalSecondary, brutalBorder(2, colors)]} onPress={clearFilters}>
                      <SText variant="callout" style={{ fontWeight: '700' }}>Limpiar</SText>
                    </AnimatedPressable>
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <AnimatedPressable onPress={() => setFilterVisible(false)}>
                      <BrutalBox bg={colors.yellow} radius={radii.pill} shadow={3} contentStyle={styles.modalDone}>
                        <SText variant="callout" style={{ fontWeight: '800' }}>Listo</SText>
                      </BrutalBox>
                    </AnimatedPressable>
                  </View>
                </View>
              </BrutalBox>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </BrutalScreen>
  );
}

