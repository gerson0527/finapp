import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { getProfile } from '@/services/profileService';
import { updateMonthlyIncome } from '@/services/accountSettingsService';
import BrutalScreen from '@/src/components/BrutalScreen';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AuthFeedback from '@/src/components/AuthFeedback';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import { copDigitsToNumber, formatCOP, formatCOPDigits, parseCOPDigits } from '@/src/utils/currency';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';
import { View, TextInput, Platform } from 'react-native';

export default function IncomeSettingsScreen() {
  const [income, setIncome] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        if (p?.monthly_income != null) {
          setIncome(parseCOPDigits(String(Math.round(Number(p.monthly_income)))));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    const amount = copDigitsToNumber(income);
    if (!amount || amount <= 0) {
      setFeedback({ type: 'error', message: 'Ingresa un monto válido mayor a 0.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await updateMonthlyIncome(amount);
      setFeedback({
        type: 'success',
        message: `Tu ingreso de referencia quedó en ${formatCOP(amount)}.`,
      });
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Ingreso mensual' }} />
      <BrutalScreen showDecor={false}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeInView>
            <SText variant="body" color={colors.textSecondary} style={styles.intro}>
              Este es tu ingreso mensual de referencia — lo que configuraste al empezar.
              Sirve como guía para planear tus presupuestos y no cambia tu balance actual.
            </SText>
          </FadeInView>

          {feedback ? <AuthFeedback type={feedback.type} message={feedback.message} /> : null}

          <FadeInView index={1}>
            <SText variant="caption1" color={colors.textMuted} style={styles.label}>
              INGRESO MENSUAL (COP)
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
                  editable={!loading}
                />
                <SText variant="caption1" color={colors.textSecondary} style={{ fontWeight: '700' }}>
                  COP
                </SText>
              </View>
              {income.length > 0 ? (
                <SText variant="footnote" color={colors.textSecondary} style={{ textAlign: 'center' }}>
                  Pesos colombianos (COP)
                </SText>
              ) : null}
            </BrutalBox>

            <BrutalBox bg={colors.surfaceAlt} radius={radii.md} shadow={2} contentStyle={styles.tip}>
              <SText variant="footnote" color={colors.textSecondary} style={{ lineHeight: 20 }}>
                Para ajustar límites de gym, Netflix u otros gastos fijos, ve a la pestaña Presupuestos.
              </SText>
            </BrutalBox>
          </FadeInView>

          <FadeInView index={2}>
            <BrutalButton
              label={saving ? 'Guardando...' : 'Guardar ingreso'}
              onPress={handleSave}
              disabled={!income || saving || loading}
            />
          </FadeInView>
        </ScrollView>
      </BrutalScreen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  intro: {
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  amountCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.ink,
    minWidth: 80,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as const, minWidth: 120 } : {}),
  },
  tip: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
});
