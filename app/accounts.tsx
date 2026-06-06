import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import {
  getAccounts,
  createAccount,
  Account,
  CreateAccountDTO,
} from '@/services/accountService';
import { useApp } from '@/src/context/AppContext';
import BrutalScreen from '@/src/components/BrutalScreen';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import HighlightText from '@/src/components/HighlightText';
import SText from '@/src/components/SText';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import { copDigitsToNumber, formatCOP, formatCOPDigits, parseCOPDigits } from '@/src/utils/currency';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TYPES: CreateAccountDTO['type'][] = ['checking', 'savings', 'cash', 'credit'];
const TYPE_LABELS: Record<CreateAccountDTO['type'], string> = {
  checking: 'Corriente',
  savings: 'Ahorros',
  cash: 'Efectivo',
  credit: 'Crédito',
};

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { triggerRefresh } = useApp();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CreateAccountDTO['type']>('checking');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await getAccounts());
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleCreate() {
    const amount = copDigitsToNumber(balance);
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await createAccount({ name: name.trim(), type, balance: amount });
      triggerRefresh();
      setShowModal(false);
      setName('');
      setBalance('');
      load();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BrutalScreen skipTopInset>
      <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topRow}>
            <HighlightText variant="title2">Mis cuentas</HighlightText>
            <AnimatedPressable onPress={() => setShowModal(true)} style={[styles.addBtn, brutalBorder(2)]}>
              <Ionicons name="add" size={22} color={colors.ink} />
            </AnimatedPressable>
          </View>

          {loading ? (
            <SkeletonLoader height={80} count={3} gap={12} />
          ) : accounts.length === 0 ? (
            <BrutalBox bg={colors.surfaceAlt} contentStyle={{ padding: spacing.xl }}>
              <SText variant="body" color={colors.textSecondary}>Crea tu primera cuenta.</SText>
            </BrutalBox>
          ) : (
            accounts.map((acct) => (
              <AnimatedPressable
                key={acct.id}
                onPress={() => router.push(`/(tabs)/history?accountId=${acct.id}` as never)}
              >
                <BrutalBox shadow={4} contentStyle={styles.accountRow}>
                  <View style={[styles.acctIcon, brutalBorder(2), { backgroundColor: acct.color || colors.yellow }]}>
                    <Ionicons name="wallet-outline" size={20} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SText variant="body" style={{ fontWeight: '800' }}>{acct.name}</SText>
                    <SText variant="caption2" color={colors.textMuted}>{TYPE_LABELS[acct.type]}</SText>
                  </View>
                  <SText variant="callout" style={{ fontWeight: '800' }}>{formatCOP(Number(acct.balance))}</SText>
                </BrutalBox>
              </AnimatedPressable>
            ))
          )}
        </ScrollView>

        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.overlay}>
            <Animated.View
              entering={SlideInDown.springify()}
              style={[styles.modalWrap, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
            >
              <BrutalBox bg={colors.yellow} contentStyle={styles.modalContent}>
                <SText variant="title3" style={{ fontWeight: '800', marginBottom: spacing.lg }}>Nueva cuenta</SText>
                <TextInput
                  style={[styles.input, brutalBorder(2)]}
                  placeholder="Nombre"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={colors.textMuted}
                />
                <View style={styles.typeRow}>
                  {TYPES.map((t) => (
                    <AnimatedPressable
                      key={t}
                      style={[styles.typeChip, brutalBorder(2), type === t && { backgroundColor: colors.pink }]}
                      onPress={() => setType(t)}
                    >
                      <SText variant="caption2" style={{ fontWeight: '700' }}>{TYPE_LABELS[t]}</SText>
                    </AnimatedPressable>
                  ))}
                </View>
                <View style={styles.balanceRow}>
                  <SText style={{ fontWeight: '800' }}>$</SText>
                  <TextInput
                    style={styles.balanceInput}
                    value={formatCOPDigits(balance)}
                    onChangeText={(t) => setBalance(parseCOPDigits(t))}
                    keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                  <SText variant="caption2" style={{ fontWeight: '700' }}>COP</SText>
                </View>
                <BrutalButton label={saving ? 'Creando...' : 'Crear cuenta'} onPress={handleCreate} disabled={saving} />
                <AnimatedPressable onPress={() => setShowModal(false)} style={{ marginTop: spacing.md, alignItems: 'center' }}>
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
  content: { padding: spacing.xl, paddingBottom: 120, gap: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, marginBottom: spacing.sm },
  acctIcon: { width: 44, height: 44, borderRadius: radii.sm, justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalWrap: { padding: spacing.lg },
  modalContent: { padding: spacing.xl },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.ink,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.surface },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: spacing.lg },
  balanceInput: { fontSize: 24, fontWeight: '800', minWidth: 80, textAlign: 'center', color: colors.ink },
});
