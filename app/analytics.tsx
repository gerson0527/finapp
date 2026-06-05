import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/src/context/AppContext';
import { getExpenseAnalytics } from '@/services/analyticsService';
import { formatMonthLabel } from '@/lib/month';
import BrutalScreen from '@/src/components/BrutalScreen';
import BrutalBox from '@/src/components/BrutalBox';
import HighlightText from '@/src/components/HighlightText';
import SText from '@/src/components/SText';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import ExpenseBarChart from '@/src/components/ExpenseBarChart';
import CategoryPieChart from '@/src/components/CategoryPieChart';
import { formatCOP } from '@/src/utils/currency';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

export default function AnalyticsScreen() {
  const { selectedMonth } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getExpenseAnalytics>> | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getExpenseAnalytics(selectedMonth)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, [selectedMonth])
  );

  const pct = data?.percentChange;
  const pctLabel =
    pct == null
      ? 'Sin datos del mes anterior'
      : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs mes anterior`;

  return (
    <BrutalScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <HighlightText variant="title2">Analytics</HighlightText>
          <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 6, marginBottom: spacing.lg }}>
            {formatMonthLabel(selectedMonth)} · gastos e insights
          </SText>

          {loading ? (
            <SkeletonLoader height={120} style={{ marginBottom: spacing.lg }} />
          ) : data ? (
            <>
              <BrutalBox bg={colors.yellow} shadow={4} contentStyle={styles.compareCard}>
                <View style={[styles.compareIcon, brutalBorder(2)]}>
                  <Ionicons
                    name={pct != null && pct <= 0 ? 'trending-down' : 'trending-up'}
                    size={22}
                    color={colors.ink}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <SText variant="caption2" color={colors.textMuted}>Gastos este mes</SText>
                  <SText variant="title3" style={{ fontWeight: '900' }}>
                    {formatCOP(data.currentMonthTotal)}
                  </SText>
                  <SText
                    variant="footnote"
                    color={pct != null && pct > 0 ? colors.expense : '#15803D'}
                    style={{ fontWeight: '700', marginTop: 4 }}
                  >
                    {pctLabel}
                  </SText>
                </View>
              </BrutalBox>

              <SText variant="caption1" color={colors.textMuted} style={styles.sectionLabel}>
                GASTOS ÚLTIMOS 6 MESES
              </SText>
              <BrutalBox shadow={4} contentStyle={styles.chartCard}>
                <ExpenseBarChart data={data.monthly} />
              </BrutalBox>

              <SText variant="caption1" color={colors.textMuted} style={styles.sectionLabel}>
                POR CATEGORÍA (MES ACTUAL)
              </SText>
              <BrutalBox shadow={4} contentStyle={styles.chartCard}>
                <CategoryPieChart data={data.byCategory} />
              </BrutalBox>
            </>
          ) : (
            <BrutalBox bg={colors.surfaceAlt} contentStyle={{ padding: spacing.xl }}>
              <SText variant="body" color={colors.textSecondary}>No se pudieron cargar los datos.</SText>
            </BrutalBox>
          )}
        </ScrollView>
    </BrutalScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: 120 },
  compareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  compareIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: { fontWeight: '800', letterSpacing: 0.5, marginBottom: spacing.sm },
  chartCard: { padding: spacing.lg, marginBottom: spacing.xl, alignItems: 'center' },
});
