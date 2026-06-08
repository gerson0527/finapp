import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import {
  saveOnboardingIncome,
  createOnboardingAccount,
  finishOnboarding,
  AccountType,
} from '@/services/onboardingService';
import { useAuth } from '@/src/context/AuthContext';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import HighlightText from '@/src/components/HighlightText';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import { copDigitsToNumber, formatCOPDigits, parseCOPDigits } from '@/src/utils/currency';
import { radii, spacing, brutalBorder, webTextInputReset } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

const ACCOUNT_TYPES: { id: AccountType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'checking', label: 'Corriente', icon: 'card-outline' },
  { id: 'savings', label: 'Ahorros', icon: 'wallet-outline' },
  { id: 'cash', label: 'Efectivo', icon: 'cash-outline' },
  { id: 'credit', label: 'Crédito', icon: 'card' },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) =>
      StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.xl },
    progressTrack: {
      height: 8,
      backgroundColor: colors.bgAlt,
      borderRadius: radii.pill,
      overflow: 'hidden',
      marginBottom: spacing.sm,
      borderWidth: 2,
      borderColor: colors.ink,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.yellow,
    },
    stepLabel: { fontWeight: '800', marginBottom: spacing.xl },
    scroll: { paddingBottom: 120 },
    subtitle: { marginTop: spacing.sm, marginBottom: spacing.xl, lineHeight: 22 },
    amountCard: { padding: spacing.xl, marginBottom: spacing.xl },
    amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    amountInput: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.ink,
      minWidth: 80,
      textAlign: 'center',
      ...webTextInputReset,
    },
    fieldLabel: { fontWeight: '800', marginBottom: spacing.sm, marginTop: spacing.md },
    textInput: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      color: colors.ink,
      fontSize: 16,
      marginBottom: spacing.md,
    },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
    },
    typeChipActive: { backgroundColor: colors.yellow },
    doneCard: { padding: spacing.xxxl, alignItems: 'center', marginBottom: spacing.xl },
  })
    );
  const insets = useSafeAreaInsets();
  const { refreshOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [income, setIncome] = useState('');
  const [accountName, setAccountName] = useState('Cuenta Principal');
  const [accountType, setAccountType] = useState<AccountType>('checking');
  const [initialBalance, setInitialBalance] = useState('');

  const progress = useSharedValue(0.33);
  React.useEffect(() => {
    progress.value = withSpring(step / 3, { damping: 14 });
  }, [step, progress]);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const incomeNum = copDigitsToNumber(income);
  const balanceNum = copDigitsToNumber(initialBalance || income);

  async function handleStep1() {
    if (!incomeNum || incomeNum <= 0) {
      Alert.alert('Error', 'Ingresa tu ingreso mensual aproximado');
      return;
    }
    setLoading(true);
    try {
      await saveOnboardingIncome(incomeNum);
      setInitialBalance(income);
      setStep(2);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    if (!accountName.trim()) {
      Alert.alert('Error', 'Ponle un nombre a tu cuenta');
      return;
    }
    setLoading(true);
    try {
      await createOnboardingAccount(accountName.trim(), accountType, balanceNum);
      setStep(3);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    setLoading(true);
    try {
      await finishOnboarding(incomeNum);
      await refreshOnboarding();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo finalizar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>
      <SText variant="caption2" color={colors.textMuted} style={styles.stepLabel}>
        Paso {step} de 3
      </SText>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <FadeInView>
            <HighlightText variant="title2">¿Cuál es tu ingreso mensual?</HighlightText>
            <SText variant="body" color={colors.textMuted} style={styles.subtitle}>
              Aproximado en COP. Lo usamos como referencia para planear tu mes.
            </SText>
            <BrutalBox bg={colors.yellow} shadow={4} contentStyle={styles.amountCard}>
              <View style={styles.amountRow}>
                <SText variant="title2" style={{ fontWeight: '800' }}>$</SText>
                <TextInput
                  style={styles.amountInput}
                  value={formatCOPDigits(income)}
                  onChangeText={(t) => setIncome(parseCOPDigits(t))}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                  autoFocus
                />
                <SText variant="caption1" style={{ fontWeight: '700' }}>COP</SText>
              </View>
            </BrutalBox>
            <BrutalButton label={loading ? 'Guardando...' : 'Continuar'} onPress={handleStep1} disabled={loading} />
          </FadeInView>
        ) : null}

        {step === 2 ? (
          <FadeInView>
            <HighlightText variant="title2">Crea tu primera cuenta</HighlightText>
            <SText variant="body" color={colors.textMuted} style={styles.subtitle}>
              Nombre, tipo y cuánto dinero tienes ahora en esa cuenta.
            </SText>

            <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>NOMBRE</SText>
            <TextInput
              style={[styles.textInput, brutalBorder(2, colors)]}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Ej. Cuenta Principal"
              placeholderTextColor={colors.textMuted}
            />

            <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>TIPO</SText>
            <View style={styles.typeRow}>
              {ACCOUNT_TYPES.map((t) => (
                <AnimatedPressable
                  key={t.id}
                  style={[styles.typeChip, brutalBorder(2, colors), accountType === t.id && styles.typeChipActive]}
                  onPress={() => setAccountType(t.id)}
                >
                  <Ionicons name={t.icon} size={16} color={colors.ink} />
                  <SText variant="caption2" style={{ fontWeight: '700' }}>{t.label}</SText>
                </AnimatedPressable>
              ))}
            </View>

            <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>
              BALANCE INICIAL (COP)
            </SText>
            <BrutalBox bg={colors.surfaceAlt} shadow={3} contentStyle={styles.amountCard}>
              <View style={styles.amountRow}>
                <SText variant="title3" style={{ fontWeight: '800' }}>$</SText>
                <TextInput
                  style={[styles.amountInput, { fontSize: 28 }]}
                  value={formatCOPDigits(initialBalance)}
                  onChangeText={(t) => setInitialBalance(parseCOPDigits(t))}
                  keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                />
              </View>
            </BrutalBox>

            <BrutalButton label={loading ? 'Creando...' : 'Continuar'} onPress={handleStep2} disabled={loading} />
          </FadeInView>
        ) : null}

        {step === 3 ? (
          <FadeInView>
            <BrutalBox bg={colors.incomeBg} shadow={6} contentStyle={styles.doneCard}>
              <Ionicons name="checkmark-circle" size={64} color="#15803D" />
              <SText variant="title2" style={{ fontWeight: '900', marginTop: spacing.lg, textAlign: 'center' }}>
                ¡Listo!
              </SText>
              <SText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 }}>
                Tu cuenta está configurada. Empieza a registrar ingresos, gastos y presupuestos.
              </SText>
            </BrutalBox>
            <BrutalButton label={loading ? 'Entrando...' : 'Ir a FinApp'} onPress={handleFinish} disabled={loading} />
          </FadeInView>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

