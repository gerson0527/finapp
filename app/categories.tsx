import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Stack } from 'expo-router';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryUsage,
  Category,
  CategoryUsage,
} from '@/services/categoryService';
import SText from '@/src/components/SText';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import HighlightText from '@/src/components/HighlightText';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import AuthFeedback, { AuthFeedbackType } from '@/src/components/AuthFeedback';
import { useApp } from '@/src/context/AppContext';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

const presetIcons = [
  'restaurant', 'car', 'film', 'cart', 'bag', 'play-circle',
  'home', 'fitness', 'cash', 'business', 'laptop', 'wallet',
  'card', 'cafe', 'airplane', 'heart', 'medical', 'school',
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
  const { triggerRefresh } = useApp();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const modalMaxHeight = Math.min(windowHeight * 0.86, Dimensions.get('window').height - insets.top - 12);
  const modalScrollMaxHeight = modalMaxHeight - 148;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{
    type: AuthFeedbackType;
    title?: string;
    message: string;
  } | null>(null);
  const [categoryUsage, setCategoryUsage] = useState<CategoryUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      // lista vacía; el usuario puede reintentar al volver a entrar
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const expenseCats = categories.filter((c) => c.type === 'expense');
  const incomeCats = categories.filter((c) => c.type === 'income');

  const openCreate = (type: CategoryType) => {
    setEditing(null);
    setForm(emptyForm(type));
    setCategoryUsage(null);
    setUsageLoading(false);
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
    setCategoryUsage(null);
    setUsageLoading(true);
    setModalVisible(true);
    getCategoryUsage(category.id)
      .then(setCategoryUsage)
      .catch(() => setCategoryUsage({ transactionCount: 0, budgetCount: 0, inUse: true }))
      .finally(() => setUsageLoading(false));
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditing(null);
    setForm(emptyForm());
    setConfirmDelete(false);
    setFormFeedback(null);
    setCategoryUsage(null);
    setUsageLoading(false);
  };

  async function handleSave() {
    if (!form.name.trim()) {
      setFormFeedback({
        type: 'error',
        title: 'Nombre requerido',
        message: 'Escribe un nombre para la categoría.',
      });
      return;
    }

    setSaving(true);
    setFormFeedback(null);
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
      triggerRefresh();
      closeModal();
    } catch (e: any) {
      setFormFeedback({
        type: 'error',
        title: 'No se pudo guardar',
        message: e.message || 'Inténtalo de nuevo.',
      });
    } finally {
      setSaving(false);
    }
  }

  function tryOpenDeleteConfirm() {
    if (!editing) return;
    if (categoryUsage?.inUse) {
      const parts: string[] = [];
      if (categoryUsage.transactionCount > 0) {
        parts.push(
          `${categoryUsage.transactionCount} transacción${categoryUsage.transactionCount > 1 ? 'es' : ''} en tu historial`
        );
      }
      if (categoryUsage.budgetCount > 0) {
        parts.push(
          `${categoryUsage.budgetCount} presupuesto${categoryUsage.budgetCount > 1 ? 's' : ''}`
        );
      }
      setFormFeedback({
        type: 'error',
        title: 'Categoría en uso',
        message: `Está en uso (${parts.join(' y ')}). No se puede eliminar si alguna vez se usó.`,
      });
      return;
    }
    setFormFeedback(null);
    setConfirmDelete(true);
  }

  async function handleDeleteConfirm() {
    if (!editing) return;

    setSaving(true);
    setFormFeedback(null);
    try {
      await deleteCategory(editing.id);
      await loadCategories();
      triggerRefresh();
      closeModal();
    } catch (e: any) {
      setConfirmDelete(false);
      setFormFeedback({
        type: 'error',
        title: 'No se pudo eliminar',
        message: e.message || 'Inténtalo de nuevo.',
      });
    } finally {
      setSaving(false);
    }
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
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalKeyboard}
            >
              <Animated.View
                entering={SlideInDown.springify().damping(20)}
                style={[styles.modalWrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
              >
                <BrutalBox
                  shadow={5}
                  style={{ maxHeight: modalMaxHeight }}
                  contentStyle={[styles.modalBody, { maxHeight: modalMaxHeight }]}
                >
                  <View style={styles.modalHeader}>
                    <View style={[styles.previewIcon, brutalBorder(2), { backgroundColor: form.color }]}>
                      <Ionicons name={form.icon as any} size={20} color={colors.ink} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <SText variant="callout" style={{ fontWeight: '800', textTransform: 'uppercase' }} numberOfLines={1}>
                        {confirmDelete ? 'Eliminar' : editing ? 'Editar categoría' : 'Nueva categoría'}
                      </SText>
                      {!confirmDelete ? (
                        <SText variant="caption2" color={colors.textMuted} numberOfLines={1}>
                          {form.name.trim() || 'Sin nombre'} · {form.type === 'expense' ? 'Gasto' : 'Ingreso'}
                        </SText>
                      ) : null}
                    </View>
                    <AnimatedPressable onPress={closeModal} style={[styles.modalCloseBtn, brutalBorder(2)]}>
                      <Ionicons name="close" size={18} color={colors.ink} />
                    </AnimatedPressable>
                  </View>

                  {formFeedback ? (
                    <AuthFeedback
                      type={formFeedback.type}
                      title={formFeedback.title}
                      message={formFeedback.message}
                    />
                  ) : null}

                  {confirmDelete && editing ? (
                    <View style={styles.modalFooter}>
                      <SText variant="body" style={{ marginBottom: spacing.md, lineHeight: 20 }}>
                        ¿Eliminar "{editing.name}"?
                      </SText>
                      <BrutalButton
                        label={saving ? 'Eliminando...' : 'Sí, eliminar'}
                        variant="pink"
                        onPress={handleDeleteConfirm}
                        disabled={saving}
                        small
                      />
                      <AnimatedPressable
                        onPress={() => setConfirmDelete(false)}
                        disabled={saving}
                        style={styles.modalCancelLink}
                      >
                        <SText variant="footnote" style={{ fontWeight: '700' }}>Volver</SText>
                      </AnimatedPressable>
                    </View>
                  ) : (
                    <>
                      <ScrollView
                        style={[styles.modalScrollArea, { maxHeight: modalScrollMaxHeight }]}
                        contentContainerStyle={styles.modalScrollContent}
                        showsVerticalScrollIndicator
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                      >
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
                              <SText variant="caption1" style={{ fontWeight: '800' }}>{opt.label}</SText>
                            </AnimatedPressable>
                          ))}
                        </View>

                        <SText variant="caption2" color={colors.textMuted} style={styles.fieldLabel}>Nombre</SText>
                        <TextInput
                          style={[styles.input, brutalBorder(2)]}
                          placeholder="Ej. Banco, Netflix..."
                          placeholderTextColor={colors.textMuted}
                          value={form.name}
                          onChangeText={(name) => setForm((f) => ({ ...f, name }))}
                        />

                        <SText variant="caption2" color={colors.textMuted} style={styles.fieldLabel}>Icono</SText>
                        <View style={styles.iconGrid}>
                          {presetIcons.map((ic) => (
                            <AnimatedPressable
                              key={ic}
                              style={[
                                styles.iconItem,
                                brutalBorder(2),
                                form.icon === ic && styles.iconItemSelected,
                              ]}
                              onPress={() => setForm((f) => ({ ...f, icon: ic }))}
                            >
                              <Ionicons name={ic as any} size={18} color={colors.ink} />
                            </AnimatedPressable>
                          ))}
                        </View>

                        <SText variant="caption2" color={colors.textMuted} style={styles.fieldLabel}>Color</SText>
                        <View style={styles.colorGrid}>
                          {presetColors.map((clr) => (
                            <AnimatedPressable
                              key={clr}
                              style={[
                                styles.colorItem,
                                { backgroundColor: clr },
                                brutalBorder(2),
                                form.color === clr && styles.colorItemSelected,
                              ]}
                              onPress={() => setForm((f) => ({ ...f, color: clr }))}
                            />
                          ))}
                        </View>

                        {editing && categoryUsage?.inUse ? (
                          <BrutalBox bg={colors.surfaceAlt} radius={radii.md} shadow={2} contentStyle={styles.usageHint}>
                            <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
                            <SText variant="caption2" color={colors.textSecondary} style={{ flex: 1, lineHeight: 18 }}>
                              {[
                                categoryUsage.transactionCount > 0
                                  ? `${categoryUsage.transactionCount} transacción${categoryUsage.transactionCount > 1 ? 'es' : ''} en el historial`
                                  : null,
                                categoryUsage.budgetCount > 0
                                  ? `${categoryUsage.budgetCount} presupuesto${categoryUsage.budgetCount > 1 ? 's' : ''}`
                                  : null,
                              ].filter(Boolean).join(' · ')}
                              . No se puede eliminar una categoría en uso.
                            </SText>
                          </BrutalBox>
                        ) : null}
                      </ScrollView>

                      <View style={styles.modalFooter}>
                        <BrutalButton
                          label={saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}
                          variant="pink"
                          onPress={handleSave}
                          disabled={!form.name.trim() || saving}
                          small
                        />
                        <View style={styles.footerLinks}>
                          <AnimatedPressable onPress={closeModal} style={styles.footerLinkBtn}>
                            <SText variant="caption2" style={{ fontWeight: '700' }}>Cancelar</SText>
                          </AnimatedPressable>
                          {editing && !usageLoading && !categoryUsage?.inUse ? (
                            <AnimatedPressable
                              onPress={tryOpenDeleteConfirm}
                              disabled={saving}
                              style={styles.footerLinkBtn}
                            >
                              <SText variant="caption2" color={colors.expense} style={{ fontWeight: '700' }}>
                                Eliminar
                              </SText>
                            </AnimatedPressable>
                          ) : null}
                        </View>
                      </View>
                    </>
                  )}
                </BrutalBox>
              </Animated.View>
            </KeyboardAvoidingView>
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
    ...brutalBorder(2),
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalKeyboard: { width: '100%', maxHeight: '100%' },
  modalWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  modalBody: {
    padding: spacing.md,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.bgAlt,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.bgAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollArea: {
    flexGrow: 0,
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingBottom: spacing.xs,
  },
  modalFooter: {
    borderTopWidth: 2,
    borderTopColor: colors.bgAlt,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  footerLinkBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  fieldLabel: {
    marginBottom: 4,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 15,
    marginBottom: spacing.sm,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as const } : {}),
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  iconItem: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconItemSelected: {
    backgroundColor: colors.yellow,
    borderWidth: 3,
    borderColor: colors.ink,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.xs,
  },
  colorItem: { width: 32, height: 32, borderRadius: 16 },
  colorItemSelected: { borderWidth: 3, borderColor: colors.ink },
  modalCancelLink: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  usageHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
});
