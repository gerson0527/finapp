import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Modal, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import {
  compareMonthBalances,
  getConfiguredMonths,
  BalanceComparison,
} from '@/services/monthlyBalanceService';
import { getCurrentMonth, getPreviousMonth, formatMonthLabel } from '@/lib/month';
import { useApp } from '@/src/context/AppContext';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import GlassCard from '@/src/components/GlassCard';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalScreen from '@/src/components/BrutalScreen';
import BalanceComparisonView from '@/src/components/BalanceComparisonView';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import HighlightText from '@/src/components/HighlightText';
import { colors, radii, spacing } from '@/src/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CompareScreen() {
  const insets = useSafeAreaInsets();
  const { refreshKey } = useApp();
  const currentMonth = getCurrentMonth();
  const [compareMonth, setCompareMonth] = useState(getPreviousMonth(currentMonth));
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [comparison, setComparison] = useState<BalanceComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const months = await getConfiguredMonths();
      const options = months.filter((m) => m !== currentMonth);
      setAvailableMonths(options);

      const defaultCompare = options.includes(getPreviousMonth(currentMonth))
        ? getPreviousMonth(currentMonth)
        : options[0] ?? null;

      const target =
        compareMonth !== currentMonth && options.includes(compareMonth)
          ? compareMonth
          : defaultCompare;

      if (target) {
        setCompareMonth(target);
        const result = await compareMonthBalances(target, currentMonth);
        setComparison(result);
      } else {
        setComparison(null);
      }
    } catch {
      setComparison(null);
    } finally {
      setLoading(false);
    }
  }, [compareMonth, currentMonth, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSelectMonth(month: string) {
    setCompareMonth(month);
    setPickerVisible(false);
    setLoading(true);
    try {
      const result = await compareMonthBalances(month, currentMonth);
      setComparison(result);
    } catch {
      setComparison(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <BrutalScreen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          <HighlightText variant="title1">Comparar balance</HighlightText>
          <SText variant="footnote" color={colors.textMuted} style={styles.subtitle}>
            Mes actual vs mes elegido
          </SText>
        </FadeInView>

        <FadeInView index={1}>
          <AnimatedPressable onPress={() => setPickerVisible(true)}>
            <BrutalBox bg={colors.yellow} contentStyle={styles.pickerRow}>
              <Ionicons name="calendar" size={20} color={colors.ink} />
              <View style={{ flex: 1 }}>
                <SText variant="caption2" color={colors.textMuted}>COMPARAR CON</SText>
                <SText variant="body" style={{ fontWeight: '700' }}>
                  {formatMonthLabel(compareMonth)}
                </SText>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.ink} />
            </BrutalBox>
          </AnimatedPressable>
        </FadeInView>

        <FadeInView index={2}>
          {loading ? (
            <SkeletonLoader variant="card" />
          ) : !comparison && availableMonths.length === 0 ? (
            <GlassCard contentStyle={styles.emptyCard}>
              <Ionicons name="analytics-outline" size={32} color={colors.textMuted} />
              <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 8, textAlign: 'center' }}>
                Configura al menos dos meses para comparar tu balance
              </SText>
            </GlassCard>
          ) : comparison ? (
            <BalanceComparisonView comparison={comparison} />
          ) : (
            <GlassCard contentStyle={styles.emptyCard}>
              <SText variant="footnote" color={colors.textMuted}>No hay datos para comparar</SText>
            </GlassCard>
          )}
        </FadeInView>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            style={[styles.modalWrap, { marginBottom: Math.max(insets.bottom, 20) }]}
          >
            <BrutalBox contentStyle={styles.modalContent}>
              <SText variant="headline" style={{ fontWeight: '800', marginBottom: spacing.md }}>
                COMPARAR CON
              </SText>
              <FlatList
                data={availableMonths.map((m) => ({ value: m, label: formatMonthLabel(m) }))}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <AnimatedPressable
                    style={[styles.monthItem, item.value === compareMonth && styles.monthItemActive]}
                    onPress={() => handleSelectMonth(item.value)}
                  >
                    <SText variant="body" style={{ fontWeight: item.value === compareMonth ? '800' : '500' }}>
                      {item.label}
                    </SText>
                  </AnimatedPressable>
                )}
              />
            </BrutalBox>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </BrutalScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  subtitle: { marginTop: 8, marginBottom: spacing.lg },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyCard: { padding: spacing.xxxl, alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 20 },
  modalWrap: { marginBottom: 20 },
  modalContent: { padding: spacing.xl, maxHeight: 360 },
  monthItem: {
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  monthItemActive: { backgroundColor: colors.yellow },
});
