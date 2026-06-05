import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Modal, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useApp } from '@/src/context/AppContext';
import { useTransactions } from '@/hooks/useTransactions';
import { getCategories } from '@/services/categoryService';
import TransactionItem from '@/src/components/TransactionItem';
import SText from '@/src/components/SText';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import FadeInView from '@/src/components/FadeInView';
import GlassCard from '@/src/components/GlassCard';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import BrutalScreen from '@/src/components/BrutalScreen';
import HighlightText from '@/src/components/HighlightText';
import BrutalBox from '@/src/components/BrutalBox';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';
import { parseISO, isToday, isYesterday, format } from 'date-fns';
import { es } from 'date-fns/locale';

function getGroupKey(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
}

export default function HistoryScreen() {
  const router = useRouter();
  const { selectedMonth, refreshKey } = useApp();
  const { data: allTxns, loading, refresh } = useTransactions(selectedMonth);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh, refreshKey])
  );
  const [search, setSearch] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense' | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  React.useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  const filtered = useMemo(() => {
    let list = allTxns;
    if (search) list = list.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()));
    if (catFilter) list = list.filter((t) => t.category?.name === catFilter);
    if (typeFilter) list = list.filter((t) => t.type === typeFilter);
    return list;
  }, [allTxns, search, catFilter, typeFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((tx) => {
      const key = getGroupKey(tx.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }, [filtered]);

  const openEdit = useCallback((id: string) => {
    router.push({ pathname: '/transaction/[id]', params: { id } });
  }, [router]);

  const groupKeys = Object.keys(grouped);
  let itemIndex = 0;

  return (
    <BrutalScreen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <HighlightText variant="title1">Historial</HighlightText>
          <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 8, marginBottom: 16 }}>
            {filtered.length} transacciones
          </SText>
        </FadeInView>

        <FadeInView index={1}>
          <View style={styles.searchRow}>
            <View style={[styles.searchInput, brutalBorder(2)]}>
              <Ionicons name="search" size={18} color={colors.ink} />
              <TextInput
                style={styles.input}
                placeholder="Buscar..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <AnimatedPressable onPress={() => setFilterVisible(true)}>
              <BrutalBox
                bg={(catFilter || typeFilter) ? colors.pink : colors.yellow}
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
        ) : groupKeys.length === 0 ? (
          <FadeInView index={2}>
            <GlassCard contentStyle={styles.emptyState}>
              <SText variant="headline" style={{ fontWeight: '800', textTransform: 'uppercase' }}>Sin resultados</SText>
              <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 8 }}>Prueba otros filtros</SText>
            </GlassCard>
          </FadeInView>
        ) : (
          groupKeys.map((key, gi) => (
            <FadeInView key={key} index={gi + 2}>
              <SText variant="subhead" style={{ fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
                {key}
              </SText>
              <GlassCard contentStyle={styles.sectionCard}>
                {grouped[key].map((tx) => {
                  const idx = itemIndex++;
                  return (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      showTime
                      index={idx}
                      onPress={() => openEdit(tx.id)}
                    />
                  );
                })}
              </GlassCard>
            </FadeInView>
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={filterVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterVisible(false)}>
          <Animated.View entering={SlideInDown.springify().damping(20)} style={{ padding: 20 }}>
            <BrutalBox contentStyle={styles.modalContent}>
              <SText variant="title3" style={{ fontWeight: '800', textTransform: 'uppercase', marginBottom: 16 }}>Filtrar</SText>
              <View style={styles.filterOptions}>
                {[{ label: 'Todos', value: null }, { label: 'Ingresos', value: 'income' }, { label: 'Gastos', value: 'expense' }].map((opt) => (
                  <AnimatedPressable
                    key={opt.label}
                    style={[styles.chip, typeFilter === opt.value && styles.chipActive]}
                    onPress={() => setTypeFilter(opt.value as any)}
                  >
                    <SText variant="caption1" style={{ fontWeight: '800' }}>{opt.label}</SText>
                  </AnimatedPressable>
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <AnimatedPressable style={[styles.chip, !catFilter && styles.chipActive]} onPress={() => setCatFilter(null)}>
                    <SText variant="caption1" style={{ fontWeight: '800' }}>Todas</SText>
                  </AnimatedPressable>
                  {categories.map((c) => (
                    <AnimatedPressable
                      key={c.id}
                      style={[styles.chip, catFilter === c.name && styles.chipActive]}
                      onPress={() => setCatFilter(catFilter === c.name ? null : c.name)}
                    >
                      <SText variant="caption1" style={{ fontWeight: '800' }}>{c.name}</SText>
                    </AnimatedPressable>
                  ))}
                </View>
              </ScrollView>
              <AnimatedPressable onPress={() => setFilterVisible(false)} style={{ alignSelf: 'center', marginTop: 8 }}>
                <SText variant="headline" color={colors.pink} style={{ fontWeight: '800' }}>LISTO</SText>
              </AnimatedPressable>
            </BrutalBox>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </BrutalScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, zIndex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: 14, height: 48, gap: 8 },
  input: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '500' },
  filterBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  sectionCard: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, marginBottom: spacing.lg },
  emptyState: { padding: spacing.xxxl, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { padding: spacing.xxl },
  filterOptions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.pill, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.bgAlt },
  chipActive: { backgroundColor: colors.yellow },
});
