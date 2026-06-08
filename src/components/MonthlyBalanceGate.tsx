import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { useApp } from '@/src/context/AppContext';
import { getCurrentMonth, getPreviousMonth, formatMonthLabel } from '@/lib/month';
import {
  isMonthConfigured,
  configureMonthBalance,
  compareMonthBalances,
  BalanceComparison,
} from '@/services/monthlyBalanceService';
import SText from '@/src/components/SText';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import HighlightText from '@/src/components/HighlightText';
import BalanceComparisonView from '@/src/components/BalanceComparisonView';
import { radii, spacing, brutalBorder, webTextInputReset } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { copDigitsToNumber, formatCOPDigits, parseCOPDigits } from '@/src/utils/currency';

interface MonthlyBalanceGateProps {
  children: React.ReactNode;
}

export default function MonthlyBalanceGate({ children }: MonthlyBalanceGateProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) =>
      StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    resultWrap: { alignItems: 'center', width: '100%' },
    hero: { alignItems: 'center', marginBottom: spacing.xxl },
    iconWrap: { width: 72, height: 72, justifyContent: 'center', alignItems: 'center' },
    subtitle: { marginTop: 10, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.md },
    card: { padding: spacing.xl },
    fieldLabel: { marginBottom: spacing.sm },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      gap: 6,
    },
    amountInput: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.ink,
      minWidth: 120,
      textAlign: 'center',
      ...webTextInputReset,
    },
    hint: { textAlign: 'center', marginTop: spacing.sm },
    note: { textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.xl, lineHeight: 18 },
  })
    );
  const { session, onboardingComplete } = useAuth();
  const { triggerRefresh } = useApp();
  const [month, setMonth] = useState(getCurrentMonth());
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [comparison, setComparison] = useState<BalanceComparison | null>(null);
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkMonth = useCallback(async () => {
    const current = getCurrentMonth();
    setMonth(current);

    if (!session || !onboardingComplete) {
      setVisible(false);
      return;
    }

    setChecking(true);
    try {
      const configured = await isMonthConfigured(current);
      setVisible(!configured);
      if (!configured) {
        setStep('form');
        setComparison(null);
      }
    } catch {
      setVisible(false);
    } finally {
      setChecking(false);
    }
  }, [session, onboardingComplete]);

  useEffect(() => {
    checkMonth();
  }, [checkMonth]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkMonth();
    });
    return () => sub.remove();
  }, [checkMonth]);

  function closeGate() {
    setVisible(false);
    setStep('form');
    setComparison(null);
    setBalance('');
  }

  async function handleSave() {
    const amount = copDigitsToNumber(balance);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Ingresa tu balance neto del mes');
      return;
    }

    setLoading(true);
    try {
      await configureMonthBalance(month, amount);
      triggerRefresh();

      const prevMonth = getPreviousMonth(month);
      const result = await compareMonthBalances(prevMonth, month);
      if (result) {
        setComparison(result);
        setStep('result');
      } else {
        closeGate();
      }
    } catch (e: any) {
      const msg = e.message || 'No se pudo guardar';
      if (/monthly_balance_config|404|400|relation/i.test(msg)) {
        Alert.alert(
          'Base de datos sin configurar',
          'Ejecuta la migración supabase/migrations/20250603_monthly_balance_config.sql en Supabase.'
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const showGate = visible && session && onboardingComplete && !checking;

  return (
    <>
      {children}
      <Modal visible={showGate === true} animationType="fade" transparent={false} onRequestClose={() => {}}>
        <View style={styles.container}>
          {step === 'form' ? (
            <>
              <View style={styles.hero}>
                <BrutalBox bg={colors.yellow} radius={radii.lg} shadow={6} contentStyle={styles.iconWrap}>
                  <Ionicons name="calendar" size={36} color={colors.ink} />
                </BrutalBox>
                <HighlightText variant="title2" centered style={{ marginTop: 20 }}>
                  Balance de {formatMonthLabel(month)}
                </HighlightText>
                <SText variant="body" color={colors.textMuted} style={styles.subtitle}>
                  Configura tu balance neto de este mes. Es obligatorio para continuar.
                </SText>
              </View>

              <BrutalBox contentStyle={styles.card}>
                <SText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
                  BALANCE NETO MENSUAL (COP)
                </SText>
                <View style={[styles.amountRow, brutalBorder(2, colors)]}>
                  <SText variant="title2" style={{ fontWeight: '700' }}>$</SText>
                  <TextInput
                    style={styles.amountInput}
                    value={formatCOPDigits(balance)}
                    onChangeText={(t) => setBalance(parseCOPDigits(t))}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                    autoFocus
                  />
                  <SText variant="caption1" color={colors.textSecondary} style={{ fontWeight: '700' }}>
                    COP
                  </SText>
                </View>
                {balance.length > 0 && (
                  <SText variant="footnote" color={colors.textSecondary} style={styles.hint}>
                    Pesos colombianos (COP)
                  </SText>
                )}

                <SText variant="caption2" color={colors.textMuted} style={styles.note}>
                  Puede ser tu salario, ingresos totales o el dinero con el que empiezas el mes.
                </SText>

                <BrutalButton
                  label={loading ? 'Guardando...' : 'Confirmar y continuar'}
                  onPress={handleSave}
                  disabled={!balance || loading}
                />
              </BrutalBox>
            </>
          ) : comparison ? (
            <View style={styles.resultWrap}>
              <HighlightText variant="title2" centered style={{ marginBottom: spacing.lg }}>
                Resultado del mes
              </HighlightText>
              <BalanceComparisonView comparison={comparison} />
              <View style={{ marginTop: spacing.xl, width: '100%' }}>
                <BrutalButton label="Continuar" onPress={closeGate} />
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

