import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { format, isToday, parseISO } from 'date-fns';
import { getCategories, Category } from '@/services/categoryService';
import { getMainAccount } from '@/services/accountService';
import { CreateTransactionDTO, Transaction } from '@/services/transactionService';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import HighlightText from '@/src/components/HighlightText';
import CategoryChip from '@/src/components/CategoryChip';
import DatePickerField from '@/src/components/DatePickerField';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

export interface TransactionFormValues {
  type: 'expense' | 'income';
  amount: string;
  description: string;
  note: string;
  categoryId: string | null;
  accountId: string;
  date: Date;
}

interface TransactionFormProps {
  title: string;
  submitLabel: string;
  initial?: Partial<TransactionFormValues> & { transaction?: Transaction };
  onSubmit: (dto: CreateTransactionDTO) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export default function TransactionForm({
  title,
  submitLabel,
  initial,
  onSubmit,
  onDelete,
  onCancel,
}: TransactionFormProps) {
  const tx = initial?.transaction;
  const [type, setType] = useState<'expense' | 'income'>(
    (initial?.type ?? tx?.type ?? 'expense') as 'expense' | 'income'
  );
  const [amount, setAmount] = useState(
    initial?.amount ?? (tx ? String(Math.round(Number(tx.amount))) : '')
  );
  const [note, setNote] = useState(initial?.note ?? tx?.note ?? '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initial?.categoryId ?? tx?.category_id ?? null
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountId, setAccountId] = useState(initial?.accountId ?? tx?.account_id ?? '');
  const [transactionDate, setTransactionDate] = useState(
    initial?.date ?? (tx ? parseISO(tx.date) : new Date())
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const amountRef = useRef<TextInput>(null);
  const amountScale = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      getCategories().then(setCategories).catch(() => {});
    }, [])
  );

  useEffect(() => {
    if (!accountId) {
      getMainAccount().then((a) => { if (a) setAccountId(a.id); });
    }
  }, [accountId]);

  useEffect(() => {
    amountScale.value = withSequence(withSpring(1.05, { damping: 8 }), withSpring(1, { damping: 12 }));
  }, [amount]);

  const amountAnim = useAnimatedStyle(() => ({ transform: [{ scale: amountScale.value }] }));
  const filteredCategories = categories.filter((c) =>
    type === 'expense' ? (c.type === 'expense' || c.type === 'both') : (c.type === 'income' || c.type === 'both')
  );

  useEffect(() => {
    if (filteredCategories.length === 0) return;
    setSelectedCategoryId((prev) => {
      if (prev && filteredCategories.some((c) => c.id === prev)) return prev;
      return filteredCategories[0].id;
    });
  }, [type, categories]);

  async function handleSave() {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) { Alert.alert('Error', 'Ingresa un monto válido'); return; }
    if (!selectedCategoryId) { Alert.alert('Error', 'Selecciona una categoría'); return; }
    if (!accountId) { Alert.alert('Error', 'No hay cuenta disponible'); return; }

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
    const description = selectedCategory?.name ?? tx?.description ?? 'Transacción';

    setSaving(true);
    try {
      const txTime =
        tx?.time && format(transactionDate, 'yyyy-MM-dd') === tx.date
          ? tx.time
          : isToday(transactionDate)
            ? format(new Date(), 'HH:mm:ss')
            : '12:00:00';

      await onSubmit({
        type,
        amount: numAmount,
        description,
        category_id: selectedCategoryId,
        account_id: accountId,
        date: format(transactionDate, 'yyyy-MM-dd'),
        time: txTime,
        note: note.trim() || undefined,
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!onDelete) return;
    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
    const label = selectedCategory?.name ?? tx?.description ?? 'esta transacción';
    Alert.alert('Eliminar transacción', `¿Eliminar "${label}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await onDelete();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo eliminar');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <>
      <View style={styles.header}>
        <AnimatedPressable onPress={onCancel}>
          <SText variant="callout" style={{ fontWeight: '700' }}>✕ Cancelar</SText>
        </AnimatedPressable>
        {onDelete && (
          <AnimatedPressable onPress={handleDelete} disabled={deleting}>
            <SText variant="callout" color={colors.error} style={{ fontWeight: '700' }}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </SText>
          </AnimatedPressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <HighlightText variant="title2">{title}</HighlightText>

        <FadeInView index={1}>
          <View style={styles.toggleRow}>
            {(['expense', 'income'] as const).map((t) => (
              <AnimatedPressable
                key={t}
                style={[styles.toggleBtn, type === t && (t === 'expense' ? styles.toggleExpense : styles.toggleIncome)]}
                onPress={() => setType(t)}
              >
                <SText variant="headline" style={{ fontWeight: '700', textTransform: 'uppercase' }}>
                  {t === 'expense' ? 'Gasto' : 'Ingreso'}
                </SText>
              </AnimatedPressable>
            ))}
          </View>
        </FadeInView>

        <FadeInView index={2}>
          <BrutalBox bg={colors.yellow} contentStyle={styles.amountCard}>
            <Animated.View style={[amountAnim, styles.amountInputWrap]}>
              <SText variant="title1" color={colors.ink} style={styles.amountPrefix}>$</SText>
              <TextInput
                ref={amountRef}
                style={styles.amountInput}
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
                keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                inputMode="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                maxLength={10}
                textAlign="center"
              />
            </Animated.View>
            {amount.length > 0 && (
              <SText variant="footnote" color={colors.textSecondary} style={styles.amountHint}>
                {parseInt(amount, 10).toLocaleString('es-CO')} COP
              </SText>
            )}
          </BrutalBox>
        </FadeInView>

        <FadeInView index={3}>
          <SText variant="subhead" style={styles.label}>Fecha</SText>
          <DatePickerField value={transactionDate} onChange={setTransactionDate} />
        </FadeInView>

        <FadeInView index={4}>
          <SText variant="subhead" style={styles.label}>Categoría</SText>
          <View style={styles.categoryGrid}>
            {filteredCategories.map((cat) => (
              <CategoryChip
                key={cat.id}
                name={cat.name}
                icon={cat.icon}
                selected={selectedCategoryId === cat.id}
                onPress={() => setSelectedCategoryId(cat.id)}
              />
            ))}
          </View>
        </FadeInView>

        <FadeInView index={5}>
          <SText variant="subhead" style={styles.label}>Nota (opcional)</SText>
          <TextInput
            style={[styles.textInput, brutalBorder(2), { minHeight: 72, textAlignVertical: 'top' }]}
            value={note}
            onChangeText={setNote}
            placeholder="Detalle adicional..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </FadeInView>

        <FadeInView index={6} style={styles.saveSection}>
          <BrutalButton
            label={saving ? 'Guardando...' : submitLabel}
            onPress={handleSave}
            disabled={!amount || saving || deleting}
          />
        </FadeInView>
        <View style={{ height: 120 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  scrollContent: { paddingHorizontal: spacing.xl },
  toggleRow: { flexDirection: 'row', gap: 10, marginVertical: spacing.xl },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.pill,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  toggleExpense: { backgroundColor: colors.expenseBg },
  toggleIncome: { backgroundColor: colors.incomeBg },
  amountCard: {
    padding: spacing.xxl,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  amountPrefix: { fontWeight: '700', marginRight: 2 },
  amountInput: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.ink,
    minWidth: 60,
    paddingVertical: 4,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as const, minWidth: 100 } : {}),
  },
  amountHint: {
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  label: { fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.lg, textTransform: 'uppercase' },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 15,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.lg,
    justifyContent: 'flex-start',
  },
  saveSection: {
    marginTop: spacing.xxxl,
    marginBottom: spacing.lg,
  },
});
