import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Stack } from 'expo-router';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  Category,
} from '@/services/categoryService';
import SText from '@/src/components/SText';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import HighlightText from '@/src/components/HighlightText';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

const presetIcons = [
  'restaurant', 'car', 'film', 'cart', 'bag', 'play-circle',
  'home', 'flash', 'medical', 'fitness', 'school', 'gift',
  'cash', 'business', 'laptop', 'wallet', 'card', 'shirt',
  'cafe', 'airplane', 'heart', 'book', 'musical-notes', 'pizza',
];

const presetColors = [
  colors.yellowDark, colors.pink, '#4A9EFF', colors.warning,
  '#A855F7', '#FF69B4', '#00D4AA', '#FF8C00', colors.income, colors.expense,
];

type CategoryType = 'expense' | 'income';

interface FormState {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

const emptyForm = (type: CategoryType = 'expense'): FormState => ({
  name: '',
  type,
  icon: 'wallet',
  color: colors.yellowDark,
});

function CategoryRow({
  category,
  badgeLabel,
  badgeBg,
  onPress,
}: {
  category: Category;
  badgeLabel: string;
  badgeBg: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.catRow}>
      <View style={[styles.iconWrap, { backgroundColor: category.color || colors.yellow }]}>
        <Ionicons name={category.icon as any} size={22} color={colors.ink} />
      </View>
      <SText variant="body" style={{ flex: 1, fontWeight: '600' }}>{category.name}</SText>
      <View style={[styles.badge, brutalBorder(2), { backgroundColor: badgeBg }]}>
        <SText variant="caption2" style={{ fontWeight: '700' }}>{badgeLabel}</SText>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
    </AnimatedPressable>
  );
}

function CategorySection({
  title,
  categories,
  badgeLabel,
  badgeBg,
  index,
  onAdd,
  onEdit,
}: {
  title: string;
  categories: Category[];
  badgeLabel: string;
  badgeBg: string;
  index: number;
  onAdd: () => void;
  onEdit: (category: Category) => void;
}) {
  return (
    <FadeInView index={index}>
      <View style={styles.sectionHeader}>
        <HighlightText variant="title3">{title}</HighlightText>
        <AnimatedPressable onPress={onAdd}>
          <BrutalBox bg={colors.yellow} radius={radii.sm} shadow={3} contentStyle={styles.sectionAddBtn}>
            <Ionicons name="add" size={18} color={colors.ink} />
          </BrutalBox>
        </AnimatedPressable>
      </View>

      {categories.length === 0 ? (
        <BrutalBox contentStyle={styles.emptySection}>
          <SText variant="footnote" color={colors.textMuted}>Sin categorías aún</SText>
          <AnimatedPressable onPress={onAdd} style={{ marginTop: 10 }}>
            <SText variant="callout" color={colors.pink} style={{ fontWeight: '700' }}>
              + Añadir categoría
            </SText>
          </AnimatedPressable>
        </BrutalBox>
      ) : (
        <BrutalBox contentStyle={styles.sectionCard}>
          {categories.map((c, i) => (
            <View key={c.id}>
              <CategoryRow
                category={c}
                badgeLabel={badgeLabel}
                badgeBg={badgeBg}
                onPress={() => onEdit(c)}
              />
              {i < categories.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </BrutalBox>
      )}
    </FadeInView>
  );
}

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const expenseCats = categories.filter((c) => c.type === 'expense' || c.type === 'both');
  const incomeCats = categories.filter((c) => c.type === 'income' || c.type === 'both');

  const openCreate = (type: CategoryType) => {
    setEditing(null);
    setForm(emptyForm(type));
    setModalVisible(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      type: category.type === 'income' ? 'income' : 'expense',
      icon: category.icon,
      color: category.color,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditing(null);
    setForm(emptyForm());
  };

  async function handleSave() {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Escribe un nombre para la categoría');
      return;
    }

    setSaving(true);
    try {
      const dto = {
        name: form.name.trim(),
        icon: form.icon,
        color: form.color,
        type: form.type,
      };

      if (editing) {
        await updateCategory(editing.id, dto);
      } else {
        await createCategory(dto);
      }

      await loadCategories();
      closeModal();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;

    Alert.alert(
      'Eliminar categoría',
      `¿Eliminar "${editing.name}"? Solo se bloquea si ya tienes transacciones con esta categoría.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteCategory(editing.id);
              await loadCategories();
              closeModal();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo eliminar');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Categorías',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerShadowVisible: false,
          headerRight: () => (
            <AnimatedPressable onPress={() => openCreate('expense')} style={{ marginRight: 8 }}>
              <BrutalBox bg={colors.yellow} radius={radii.sm} shadow={3} contentStyle={styles.headerAddBtn}>
                <Ionicons name="add" size={22} color={colors.ink} />
              </BrutalBox>
            </AnimatedPressable>
          ),
        }}
      />

      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <FadeInView>
            <HighlightText variant="title2">Categorías</HighlightText>
            <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 8, marginBottom: spacing.xl }}>
              Crea y edita categorías de ingresos y gastos
            </SText>
          </FadeInView>

          {loading ? (
            <>
              <SkeletonLoader variant="card" />
              <SkeletonLoader variant="card" />
            </>
          ) : (
            <>
              <CategorySection
                title="Gastos"
                categories={expenseCats}
                badgeLabel="Gasto"
                badgeBg={colors.expenseBg}
                index={1}
                onAdd={() => openCreate('expense')}
                onEdit={openEdit}
              />
              <CategorySection
                title="Ingresos"
                categories={incomeCats}
                badgeLabel="Ingreso"
                badgeBg={colors.incomeBg}
                index={2}
                onAdd={() => openCreate('income')}
                onEdit={openEdit}
              />
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animated.View entering={SlideInDown.springify().damping(20)} style={{ padding: 20 }}>
              <BrutalBox contentStyle={styles.modalContent}>
                <SText variant="title3" style={{ fontWeight: '700', marginBottom: spacing.lg }}>
                  {editing ? 'Editar categoría' : 'Nueva categoría'}
                </SText>

                <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Tipo</SText>
                <View style={styles.typeRow}>
                  {([
                    { label: 'Gasto', value: 'expense' as const, bg: colors.expenseBg },
                    { label: 'Ingreso', value: 'income' as const, bg: colors.incomeBg },
                  ]).map((opt) => (
                    <AnimatedPressable
                      key={opt.value}
                      style={[
                        styles.typeChip,
                        brutalBorder(2),
                        { backgroundColor: form.type === opt.value ? opt.bg : colors.surface },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, type: opt.value }))}
                    >
                      <SText variant="callout" style={{ fontWeight: '700' }}>{opt.label}</SText>
                    </AnimatedPressable>
                  ))}
                </View>

                <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Nombre</SText>
                <TextInput
                  style={[styles.input, brutalBorder(2)]}
                  placeholder="Ej. Restaurantes, Nómina..."
                  placeholderTextColor={colors.textMuted}
                  value={form.name}
                  onChangeText={(name) => setForm((f) => ({ ...f, name }))}
                />

                <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Icono</SText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.iconRow}>
                    {presetIcons.map((ic) => (
                      <AnimatedPressable
                        key={ic}
                        style={[
                          styles.iconItem,
                          brutalBorder(2),
                          form.icon === ic && { backgroundColor: colors.yellow },
                        ]}
                        onPress={() => setForm((f) => ({ ...f, icon: ic }))}
                      >
                        <Ionicons name={ic as any} size={22} color={colors.ink} />
                      </AnimatedPressable>
                    ))}
                  </View>
                </ScrollView>

                <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Color</SText>
                <View style={styles.iconRow}>
                  {presetColors.map((clr) => (
                    <AnimatedPressable
                      key={clr}
                      style={[
                        styles.colorItem,
                        { backgroundColor: clr },
                        brutalBorder(2),
                        form.color === clr && { borderColor: colors.ink, borderWidth: 3 },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, color: clr }))}
                    />
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <AnimatedPressable style={[styles.cancelBtn, brutalBorder(2)]} onPress={closeModal}>
                    <SText variant="callout" style={{ fontWeight: '600' }}>Cancelar</SText>
                  </AnimatedPressable>
                  <View style={{ flex: 1 }}>
                    <BrutalButton
                      label={saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}
                      onPress={handleSave}
                      disabled={!form.name.trim() || saving}
                      small
                    />
                  </View>
                </View>

                {editing && (
                  <AnimatedPressable
                    onPress={handleDelete}
                    disabled={saving}
                    style={[styles.deleteBtn, brutalBorder(2)]}
                  >
                    <SText variant="callout" color={colors.expense} style={{ fontWeight: '700' }}>
                      {saving ? '...' : 'Eliminar categoría'}
                    </SText>
                  </AnimatedPressable>
                )}
              </BrutalBox>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerAddBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionAddBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  sectionCard: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, marginBottom: spacing.xl },
  emptySection: { padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.xl },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: spacing.md,
  },
  divider: { height: 2, backgroundColor: colors.bgAlt },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { padding: spacing.xl, maxHeight: '90%' },
  fieldLabel: { marginBottom: 6, marginTop: spacing.sm, textTransform: 'uppercase', fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.sm },
  typeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 15,
  },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconItem: {
    width: 46,
    height: 46,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorItem: { width: 36, height: 36, borderRadius: 18 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: spacing.lg, alignItems: 'center' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  deleteBtn: {
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.expenseBg,
  },
});
