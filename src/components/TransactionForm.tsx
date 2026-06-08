import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Platform, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { format, isToday, parseISO } from 'date-fns';
import { getCategories, Category } from '@/services/categoryService';
import { getAccounts, Account } from '@/services/accountService';
import { CreateTransactionDTO, CreateTransferDTO, Transaction } from '@/services/transactionService';
import {
  BALANCE_EXCEEDED_MESSAGE,
  expenseExceedsBalance,
  expenseUpdateExceedsBalance,
} from '@/lib/balanceCheck';
import { showAlert } from '@/lib/platformAlert';
import BalanceExceededAlert from '@/src/components/BalanceExceededAlert';
import ConfirmModal from '@/src/components/ConfirmModal';
import AuthFeedback, { AuthFeedbackType } from '@/src/components/AuthFeedback';
import { copDigitsToNumber, formatCOP, formatCOPDigits, parseCOPDigits } from '@/src/utils/currency';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import HighlightText from '@/src/components/HighlightText';
import CategoryChip from '@/src/components/CategoryChip';
import DatePickerField from '@/src/components/DatePickerField';
import { radii, spacing, brutalBorder, webTextInputReset } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

export interface TransactionFormValues {
  type: 'expense' | 'income' | 'transfer';
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
  onTransfer?: (dto: CreateTransferDTO) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function TransactionForm({
  title,
  submitLabel,
  initial,
  onSubmit,
  onTransfer,
  onDelete,
}: TransactionFormProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) =>
      StyleSheet.create({
    actionBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radii.pill,
      backgroundColor: colors.expenseBg,
    },
    deleteBtnDisabled: { opacity: 0.6 },
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
    toggleBtnThird: { paddingVertical: 12 },
    toggleBtnCompact: { paddingVertical: 10, paddingHorizontal: 4 },
    toggleExpense: { backgroundColor: colors.expenseBg },
    toggleIncome: { backgroundColor: colors.incomeBg },
    toggleTransfer: { backgroundColor: colors.surfaceAlt },
    accountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
    accountChip: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      maxWidth: '48%',
    },
    accountChipActive: { backgroundColor: colors.yellow },
    recurringToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
    },
    recurringActive: { backgroundColor: colors.pink },
    dayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceAlt,
      marginBottom: spacing.lg,
    },
    dayInput: {
      width: 48,
      textAlign: 'center',
      fontWeight: '800',
      fontSize: 18,
      color: colors.ink,
    },
    amountCard: {
      padding: spacing.xxl,
      marginBottom: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    amountCardCompact: { padding: spacing.lg },
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
      ...webTextInputReset,
      ...(Platform.OS === 'web' ? { minWidth: 100 } : {}),
    },
    amountHint: {
      marginTop: 8,
      textAlign: 'center',
      width: '100%',
    },
    balanceHint: {
      marginTop: spacing.sm,
      textAlign: 'center',
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
  })
    );
  const { width: screenWidth } = useWindowDimensions();
  const compact = screenWidth < 360;
  const tx = initial?.transaction;
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(
    (initial?.type ?? (tx?.type === 'transfer' ? 'expense' : tx?.type) ?? 'expense') as 'expense' | 'income' | 'transfer'
  );
  const [amount, setAmount] = useState(
    initial?.amount ?? (tx ? String(Math.round(Number(tx.amount))) : '')
  );
  const [note, setNote] = useState(initial?.note ?? tx?.note ?? '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initial?.categoryId ?? tx?.category_id ?? null
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState(initial?.accountId ?? tx?.account_id ?? '');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDay, setRecurrenceDay] = useState(String(new Date().getDate()));
  const [transactionDate, setTransactionDate] = useState(
    initial?.date ?? (tx ? parseISO(tx.date) : new Date())
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formFeedback, setFormFeedback] = useState<{
    type: AuthFeedbackType;
    title?: string;
    message: string;
  } | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [showExceededAlert, setShowExceededAlert] = useState(false);
  const [exceededAttempt, setExceededAttempt] = useState(0);
  const amountRef = useRef<TextInput>(null);
  const amountScale = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      setFormFeedback(null);
      getCategories()
        .then(setCategories)
        .catch(() => {
          setFormFeedback({
            type: 'error',
            title: 'Categorías',
            message: 'No se pudieron cargar las categorías. Revisa tu conexión.',
          });
        });
      getAccounts()
        .then((list) => {
          setAccounts(list);
          if (list.length === 0) {
            setFormFeedback({
              type: 'error',
              title: 'Sin cuenta',
              message: 'Crea una cuenta en Más → Cuentas antes de registrar movimientos.',
            });
            return;
          }
          if (!accountId && list[0]) setAccountId(list[0].id);
          if (!fromAccountId && list[0]) setFromAccountId(list[0].id);
          if (!toAccountId && list[1]) setToAccountId(list[1].id);
          else if (!toAccountId && list[0]) setToAccountId(list[0].id);
        })
        .catch(() => {
          setFormFeedback({
            type: 'error',
            title: 'Cuentas',
            message: 'No se pudieron cargar tus cuentas.',
          });
        });
    }, [accountId, fromAccountId, toAccountId])
  );

  useEffect(() => {
    const selected = accounts.find((a) => a.id === accountId);
    setAccountBalance(selected ? Number(selected.balance) : null);
  }, [accountId, accounts]);

  useEffect(() => {
    amountScale.value = withSequence(withSpring(1.05, { damping: 8 }), withSpring(1, { damping: 12 }));
  }, [amount]);

  const amountAnim = useAnimatedStyle(() => ({ transform: [{ scale: amountScale.value }] }));
  const filteredCategories = categories.filter((c) =>
    type === 'income'
      ? (c.type === 'income' || c.type === 'both')
      : (c.type === 'expense' || c.type === 'both')
  );

  useEffect(() => {
    if (filteredCategories.length === 0) return;
    setSelectedCategoryId((prev) => {
      if (prev && filteredCategories.some((c) => c.id === prev)) return prev;
      return filteredCategories[0].id;
    });
  }, [type, categories]);

  const numAmount = copDigitsToNumber(amount);
  const exceedsBalance =
    type === 'expense' &&
    accountBalance !== null &&
    (tx
      ? expenseUpdateExceedsBalance(
          numAmount,
          accountBalance,
          tx.type,
          Number(tx.amount),
          'expense'
        )
      : expenseExceedsBalance(numAmount, accountBalance));

  async function handleSave() {
    setFormFeedback(null);

    if (!numAmount || numAmount <= 0) {
      setFormFeedback({ type: 'error', title: 'Monto inválido', message: 'Ingresa un monto mayor a 0.' });
      return;
    }
    if (!selectedCategoryId) {
      setFormFeedback({ type: 'error', title: 'Categoría', message: 'Selecciona una categoría.' });
      return;
    }

    if (type === 'transfer') {
      if (!onTransfer) {
        setFormFeedback({ type: 'error', message: 'Transferencias no disponibles.' });
        return;
      }
      if (!fromAccountId || !toAccountId) {
        setFormFeedback({ type: 'error', message: 'Selecciona cuentas origen y destino.' });
        return;
      }
      if (fromAccountId === toAccountId) {
        setFormFeedback({ type: 'error', message: 'Las cuentas deben ser diferentes.' });
        return;
      }
      const fromAcct = accounts.find((a) => a.id === fromAccountId);
      if (fromAcct && numAmount > Number(fromAcct.balance)) {
        setExceededAttempt(numAmount);
        setAccountBalance(Number(fromAcct.balance));
        setShowExceededAlert(true);
        return;
      }
      setSaving(true);
      try {
        const txTime = isToday(transactionDate)
          ? format(new Date(), 'HH:mm:ss')
          : '12:00:00';
        await onTransfer({
          amount: numAmount,
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          category_id: selectedCategoryId,
          date: format(transactionDate, 'yyyy-MM-dd'),
          time: txTime,
          note: note.trim() || undefined,
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'No se pudo transferir';
        setFormFeedback({ type: 'error', title: 'Error', message });
        showAlert('Error', message);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!accountId) {
      setFormFeedback({
        type: 'error',
        title: 'Sin cuenta',
        message: 'No hay cuenta disponible. Crea una en Más → Cuentas.',
      });
      return;
    }

    if (type === 'expense' && accountBalance !== null && exceedsBalance) {
      setExceededAttempt(numAmount);
      setShowExceededAlert(true);
      return;
    }

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
        is_recurring: type === 'expense' && !tx ? isRecurring : undefined,
        recurrence_day:
          type === 'expense' && !tx && isRecurring
            ? Math.min(31, Math.max(1, parseInt(recurrenceDay, 10) || 1))
            : undefined,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'No se pudo guardar';
      if (message === BALANCE_EXCEEDED_MESSAGE) {
        setExceededAttempt(numAmount);
        setShowExceededAlert(true);
      } else {
        setFormFeedback({ type: 'error', title: 'No se pudo guardar', message });
        showAlert('Error', message);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDeletePress() {
    if (!onDelete) return;
    setDeleteError(null);
    setDeleteConfirmVisible(true);
  }

  async function handleDeleteConfirm() {
    if (!onDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete();
      setDeleteConfirmVisible(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'No se pudo eliminar';
      setDeleteError(message);
      showAlert('Error', message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {onDelete ? (
        <View style={styles.actionBar}>
          <AnimatedPressable
            onPress={handleDeletePress}
            disabled={deleting}
            style={[styles.deleteBtn, brutalBorder(2, colors), deleting && styles.deleteBtnDisabled]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.expense} />
            <SText variant="caption2" color={colors.expense} style={{ fontWeight: '800' }}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </SText>
          </AnimatedPressable>
        </View>
      ) : null}

      {formFeedback ? (
        <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.sm }}>
          <AuthFeedback
            type={formFeedback.type}
            title={formFeedback.title}
            message={formFeedback.message}
          />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!tx ? <HighlightText variant="title2">{title}</HighlightText> : null}

        <FadeInView index={1}>
          <View style={[styles.toggleRow, compact && { gap: 6 }, tx && { marginTop: spacing.md }]}>
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <AnimatedPressable
                key={t}
                style={[
                  styles.toggleBtn,
                  styles.toggleBtnThird,
                  compact && styles.toggleBtnCompact,
                  type === t && (t === 'expense' ? styles.toggleExpense : t === 'income' ? styles.toggleIncome : styles.toggleTransfer),
                ]}
                onPress={() => !tx && setType(t)}
              >
                <SText
                  variant="caption1"
                  style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: compact ? 10 : undefined }}
                  numberOfLines={1}
                >
                  {t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : 'Transfer.'}
                </SText>
              </AnimatedPressable>
            ))}
          </View>
        </FadeInView>

        <FadeInView index={2}>
          <BrutalBox bg={colors.yellow} contentStyle={[styles.amountCard, compact && styles.amountCardCompact]}>
            <Animated.View style={[amountAnim, styles.amountInputWrap]}>
              <SText variant="title1" color={colors.ink} style={styles.amountPrefix}>$</SText>
              <TextInput
                ref={amountRef}
                style={[styles.amountInput, compact && { fontSize: 32 }]}
                value={formatCOPDigits(amount)}
                onChangeText={(t) => setAmount(parseCOPDigits(t))}
                keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                inputMode="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                maxLength={14}
                textAlign="center"
              />
              <SText variant="caption1" color={colors.textSecondary} style={{ fontWeight: '700' }}>
                COP
              </SText>
            </Animated.View>
            {amount.length > 0 && (
              <SText
                variant="footnote"
                color={exceedsBalance ? colors.expense : colors.textSecondary}
                style={[styles.amountHint, exceedsBalance && { fontWeight: '700' }]}
              >
                {exceedsBalance
                  ? 'Supera tu balance disponible'
                  : 'Pesos colombianos (COP)'}
              </SText>
            )}
            {type === 'expense' && accountBalance !== null ? (
              <SText variant="caption2" color={colors.textMuted} style={styles.balanceHint}>
                Disponible: {formatCOP(accountBalance)}
              </SText>
            ) : null}
          </BrutalBox>
        </FadeInView>

        <FadeInView index={3}>
          <SText variant="subhead" style={styles.label}>Fecha</SText>
          <DatePickerField value={transactionDate} onChange={setTransactionDate} />
        </FadeInView>

        <FadeInView index={4}>
          {type === 'transfer' ? (
            <>
              <SText variant="subhead" style={styles.label}>Cuenta origen</SText>
              <View style={styles.accountRow}>
                {accounts.map((a) => (
                  <AnimatedPressable
                    key={`from-${a.id}`}
                    style={[styles.accountChip, brutalBorder(2, colors), fromAccountId === a.id && styles.accountChipActive]}
                    onPress={() => setFromAccountId(a.id)}
                  >
                    <SText variant="caption2" style={{ fontWeight: '700' }} numberOfLines={1}>{a.name}</SText>
                  </AnimatedPressable>
                ))}
              </View>
              <SText variant="subhead" style={styles.label}>Cuenta destino</SText>
              <View style={styles.accountRow}>
                {accounts.map((a) => (
                  <AnimatedPressable
                    key={`to-${a.id}`}
                    style={[styles.accountChip, brutalBorder(2, colors), toAccountId === a.id && styles.accountChipActive]}
                    onPress={() => setToAccountId(a.id)}
                  >
                    <SText variant="caption2" style={{ fontWeight: '700' }} numberOfLines={1}>{a.name}</SText>
                  </AnimatedPressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <SText variant="subhead" style={styles.label}>Cuenta</SText>
              <View style={styles.accountRow}>
                {accounts.map((a) => (
                  <AnimatedPressable
                    key={a.id}
                    style={[styles.accountChip, brutalBorder(2, colors), accountId === a.id && styles.accountChipActive]}
                    onPress={() => setAccountId(a.id)}
                  >
                    <SText variant="caption2" style={{ fontWeight: '700' }} numberOfLines={1}>{a.name}</SText>
                  </AnimatedPressable>
                ))}
              </View>
            </>
          )}
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

        {type === 'expense' && !tx ? (
          <FadeInView index={5}>
            <AnimatedPressable
              style={[styles.recurringToggle, brutalBorder(2, colors), isRecurring && styles.recurringActive]}
              onPress={() => setIsRecurring(!isRecurring)}
            >
              <SText variant="footnote" style={{ fontWeight: '800' }}>
                ¿Es un gasto fijo mensual?
              </SText>
              <SText variant="caption2" color={colors.textMuted}>{isRecurring ? 'Sí' : 'No'}</SText>
            </AnimatedPressable>
            {isRecurring ? (
              <View style={[styles.dayRow, brutalBorder(2, colors)]}>
                <SText variant="footnote" style={{ fontWeight: '700' }}>Día del mes</SText>
                <TextInput
                  style={styles.dayInput}
                  value={recurrenceDay}
                  onChangeText={(t) => setRecurrenceDay(t.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            ) : null}
          </FadeInView>
        ) : null}

        <FadeInView index={6}>
          <SText variant="subhead" style={styles.label}>Nota (opcional)</SText>
          <TextInput
            style={[styles.textInput, brutalBorder(2, colors), { minHeight: 72, textAlignVertical: 'top' }]}
            value={note}
            onChangeText={setNote}
            placeholder="Detalle adicional..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </FadeInView>

        <FadeInView index={7} style={styles.saveSection}>
          <BrutalButton
            label={saving ? 'Guardando...' : submitLabel}
            onPress={handleSave}
            disabled={!amount || saving || deleting}
          />
        </FadeInView>
        <View style={{ height: 120 }} />
      </ScrollView>

      <BalanceExceededAlert
        visible={showExceededAlert}
        balance={accountBalance ?? 0}
        amount={exceededAttempt}
        onDismiss={() => setShowExceededAlert(false)}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Eliminar movimiento"
        message="¿Eliminar esta transacción? Se revertirá el efecto en tu balance."
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!deleting) {
            setDeleteConfirmVisible(false);
            setDeleteError(null);
          }
        }}
      />
    </>
  );
}

