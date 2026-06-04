import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useBudgets } from '@/hooks/useBudgets';
import { useApp } from '@/src/context/AppContext';
import { createBudget } from '@/services/budgetService';
import { getCategories } from '@/services/categoryService';
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
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

export default function BudgetsScreen() {
  const { selectedMonth, triggerRefresh } = useApp();
  const budgets = useBudgets(selectedMonth);
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const openModal = async () => {
    try { setCategories(await getCategories()); } catch {}
    setShowModal(true);
  };

  const handleSave = async () => {
    const limit = parseFloat(newLimit);
    if (!newCategory || !limit || limit <= 0) { Alert.alert('Error', 'Completa todos los campos'); return; }
    setSaving(true);
    try {
      await createBudget({ category_id: newCategory, limit_amount: limit, month: selectedMonth });
      budgets.refresh();
      triggerRefresh();
      setShowModal(false);
      setNewCategory('');
      setNewLimit('');
    } catch (e: any) { Alert.alert('Error', e.message || 'No se pudo crear'); }
    finally { setSaving(false); }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  return (
    <BrutalScreen>
      <View style={styles.topRow}>
        <AnimatedPressable onPress={openModal} style={styles.addWrap}>
          <BrutalBox bg={colors.yellow} radius={radii.md} shadow={3} contentStyle={styles.addBtn}>
            <Ionicons name="add" size={26} color={colors.ink} />
          </BrutalBox>
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <HighlightText variant="title1">Presupuestos</HighlightText>
          <View style={{ marginTop: 12, marginBottom: 20 }}>
            <MonthSelector />
          </View>
        </FadeInView>

        {budgets.loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)
        ) : budgets.data.length === 0 ? (
          <FadeInView index={1}>
            <BrutalBox contentStyle={styles.emptyState}>
              <SText variant="headline" style={{ fontWeight: '800', textTransform: 'uppercase' }}>Sin presupuestos</SText>
              <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 8 }}>Toca + para crear uno</SText>
            </BrutalBox>
          </FadeInView>
        ) : (
          budgets.data.map((b, i) => <BudgetCard key={b.id} budget={b} index={i} />)
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInDown.springify().damping(20)} style={{ padding: 20 }}>
            <BrutalBox contentStyle={styles.modalContent}>
              <SText variant="title3" style={{ fontWeight: '800', textTransform: 'uppercase', marginBottom: 16 }}>
                Nuevo presupuesto
              </SText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {expenseCategories.map((c) => (
                    <AnimatedPressable
                      key={c.id}
                      style={[styles.chip, brutalBorder(2), newCategory === c.id && { backgroundColor: colors.pink }]}
                      onPress={() => setNewCategory(c.id)}
                    >
                      <Ionicons name={c.icon as any} size={18} color={colors.ink} />
                      <SText variant="caption2" style={{ fontWeight: '700' }}>{c.name}</SText>
                    </AnimatedPressable>
                  ))}
                </View>
              </ScrollView>
              <TextInput
                style={[styles.input, brutalBorder(2)]}
                value={newLimit}
                onChangeText={(t) => setNewLimit(t.replace(/[^0-9]/g, ''))}
                placeholder="Límite mensual COP"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
              <BrutalButton label={saving ? 'Creando...' : 'Crear'} onPress={handleSave} disabled={!newCategory || !newLimit || saving} />
              <AnimatedPressable onPress={() => setShowModal(false)} style={{ alignSelf: 'center', marginTop: 12 }}>
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
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 16, zIndex: 10 },
  addWrap: { marginLeft: 'auto' },
  addBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.xl },
  emptyState: { padding: spacing.xxxl, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { padding: spacing.xxl },
  chip: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.md, backgroundColor: colors.surface, gap: 4 },
  input: { backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: spacing.lg, paddingVertical: 14, color: colors.ink, fontSize: 15, marginBottom: spacing.lg },
});
