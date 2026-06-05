import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Transaction } from '@/services/transactionService';
import {
  isBudgetPayment,
  isSavingsContribution,
  getTransactionSourceLabel,
} from '@/lib/transactionHelpers';
import SText from '@/src/components/SText';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import HighlightText from '@/src/components/HighlightText';
import { formatCOP } from '@/src/utils/currency';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

interface TransactionReadOnlyViewProps {
  transaction: Transaction;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export default function TransactionReadOnlyView({
  transaction,
  onDelete,
  onClose,
}: TransactionReadOnlyViewProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const isIncome = transaction.type === 'income';
  const cat = transaction.category;
  const sourceLabel = getTransactionSourceLabel(transaction);
  const title = transaction.description || cat?.name || 'Movimiento';
  const dateLabel = format(parseISO(transaction.date), "d 'de' MMMM yyyy", { locale: es });

  function handleDelete() {
    if (!onDelete) return;
    Alert.alert(
      'Eliminar movimiento',
      isBudgetPayment(transaction)
        ? `¿Eliminar el pago de "${title}"? Se actualizará tu presupuesto.`
        : `¿Eliminar "${title}"?`,
      [
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
      ]
    );
  }

  function goToSource() {
    if (isBudgetPayment(transaction)) {
      router.replace('/(tabs)/budgets');
    } else if (isSavingsContribution(transaction)) {
      router.replace('/(tabs)/savings');
    }
  }

  return (
    <>
      <View style={styles.header}>
        <AnimatedPressable onPress={onClose}>
          <SText variant="callout" style={{ fontWeight: '700' }}>✕ Cerrar</SText>
        </AnimatedPressable>
        {onDelete ? (
          <AnimatedPressable onPress={handleDelete} disabled={deleting}>
            <SText variant="callout" color={colors.error} style={{ fontWeight: '700' }}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </SText>
          </AnimatedPressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <HighlightText variant="title2">Detalle</HighlightText>

        {sourceLabel ? (
          <View style={[styles.sourceBadge, brutalBorder(2), {
            backgroundColor: isBudgetPayment(transaction) ? colors.surfaceAlt : colors.incomeBg,
          }]}>
            <Ionicons
              name={isBudgetPayment(transaction) ? 'wallet' : 'flag'}
              size={14}
              color={colors.ink}
            />
            <SText variant="caption2" style={{ fontWeight: '800' }}>{sourceLabel}</SText>
          </View>
        ) : null}

        <BrutalBox
          bg={isIncome ? colors.incomeBg : colors.expenseBg}
          contentStyle={styles.amountCard}
        >
          <SText variant="caption2" color={colors.textMuted} style={{ textTransform: 'uppercase' }}>
            {isIncome ? 'Ingreso' : 'Gasto'}
          </SText>
          <SText variant="title1" color={isIncome ? '#15803D' : colors.expense} style={{ fontWeight: '800' }}>
            {isIncome ? '+' : '-'}{formatCOP(transaction.amount)}
          </SText>
        </BrutalBox>

        <BrutalBox contentStyle={styles.detailCard}>
          <View style={styles.detailRow}>
            <SText variant="caption2" color={colors.textMuted}>Concepto</SText>
            <SText variant="body" style={{ fontWeight: '800', marginTop: 4 }}>{title}</SText>
          </View>
          {cat ? (
            <View style={[styles.detailRow, styles.detailBorder]}>
              <SText variant="caption2" color={colors.textMuted}>Categoría</SText>
              <View style={styles.catRow}>
                <View style={[styles.catIcon, { backgroundColor: cat.color || colors.yellow }, brutalBorder(2)]}>
                  <Ionicons name={(cat.icon as any) || 'ellipse'} size={14} color={colors.ink} />
                </View>
                <SText variant="body" style={{ fontWeight: '700' }}>{cat.name}</SText>
              </View>
            </View>
          ) : null}
          <View style={[styles.detailRow, styles.detailBorder]}>
            <SText variant="caption2" color={colors.textMuted}>Fecha</SText>
            <SText variant="body" style={{ fontWeight: '700', marginTop: 4 }}>{dateLabel}</SText>
          </View>
          {transaction.note ? (
            <View style={[styles.detailRow, styles.detailBorder]}>
              <SText variant="caption2" color={colors.textMuted}>Nota</SText>
              <SText variant="body" style={{ marginTop: 4 }}>{transaction.note}</SText>
            </View>
          ) : null}
        </BrutalBox>

        <BrutalBox bg={colors.surfaceAlt} radius={radii.md} shadow={2} contentStyle={styles.hintBox}>
          <SText variant="footnote" color={colors.textSecondary} style={{ lineHeight: 20 }}>
            {isBudgetPayment(transaction)
              ? 'Este pago está vinculado a un presupuesto. No se edita como una transacción normal — gestiónalo desde Presupuestos.'
              : 'Este aporte está vinculado a una meta de ahorro. Gestiónalo desde la pestaña Ahorros.'}
          </SText>
        </BrutalBox>

        <BrutalButton
          label={isBudgetPayment(transaction) ? 'Ir a presupuestos' : 'Ir a ahorros'}
          onPress={goToSource}
          style={{ marginTop: spacing.lg }}
        />
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
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  sourceBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  amountCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailCard: { padding: spacing.lg, marginBottom: spacing.lg },
  detailRow: { paddingVertical: spacing.sm },
  detailBorder: { borderTopWidth: 2, borderTopColor: colors.bgAlt },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  catIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintBox: { padding: spacing.md },
});
