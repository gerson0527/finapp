import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  getTransaction,
  updateTransaction,
  deleteTransaction,
  Transaction,
} from '@/services/transactionService';
import { useApp } from '@/src/context/AppContext';
import BrutalScreen from '@/src/components/BrutalScreen';
import TransactionForm from '@/src/components/TransactionForm';
import SText from '@/src/components/SText';
import { colors, spacing } from '@/src/constants/theme';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { triggerRefresh } = useApp();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getTransaction(id)
      .then(setTransaction)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Editar transacción',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerShadowVisible: false,
        }}
      />
      <BrutalScreen showDecor={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.yellowDark} />
          </View>
        ) : error || !transaction ? (
          <View style={styles.center}>
            <SText variant="body" color={colors.error}>{error || 'No encontrada'}</SText>
          </View>
        ) : (
          <TransactionForm
            title="Editar transacción"
            submitLabel="Guardar cambios"
            initial={{ transaction }}
            onCancel={() => router.back()}
            onSubmit={async (dto) => {
              await updateTransaction(transaction.id, dto);
              triggerRefresh();
              router.back();
            }}
            onDelete={async () => {
              await deleteTransaction(transaction.id);
              triggerRefresh();
              router.back();
            }}
          />
        )}
      </BrutalScreen>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
});
