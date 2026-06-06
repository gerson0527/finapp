import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { createTransaction, createTransfer } from '@/services/transactionService';
import { checkBudgetAlertsAfterExpense } from '@/services/notificationService';
import { useApp } from '@/src/context/AppContext';
import BrutalScreen from '@/src/components/BrutalScreen';
import TransactionForm from '@/src/components/TransactionForm';
import { colors, spacing } from '@/src/constants/theme';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { triggerRefresh } = useApp();

  return (
    <BrutalScreen showDecor={false}>
      <View style={styles.handle} />
      <TransactionForm
        title="Nueva transacción"
        submitLabel="Guardar"
        onSubmit={async (dto) => {
          await createTransaction(dto);
          if (dto.type === 'expense') {
            await checkBudgetAlertsAfterExpense(dto.date.slice(0, 7), {
              categoryId: dto.category_id,
              budgetId: dto.budget_id,
            }).catch(() => {});
          }
          triggerRefresh();
          router.back();
        }}
        onTransfer={async (dto) => {
          await createTransfer(dto);
          triggerRefresh();
          router.back();
        }}
      />
    </BrutalScreen>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.ink,
    alignSelf: 'center',
    marginTop: 8,
  },
});
