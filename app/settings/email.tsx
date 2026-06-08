import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { updateEmail } from '@/services/accountSettingsService';
import BrutalScreen from '@/src/components/BrutalScreen';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import SettingsField from '@/src/components/SettingsField';
import AuthFeedback from '@/src/components/AuthFeedback';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import { radii, spacing } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

export default function EmailSettingsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const currentEmail = session?.user?.email ?? '';

  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      await updateEmail(newEmail);
      setFeedback({
        type: 'info',
        message:
          'Te enviamos un enlace de confirmación al nuevo correo. Debes confirmarlo para completar el cambio.',
      });
      setNewEmail('');
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'No se pudo actualizar el correo.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Correo electrónico' }} />
      <BrutalScreen showDecor={false} skipTopInset>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeInView>
            <SText variant="body" color={colors.textSecondary} style={styles.intro}>
              Tu correo actual es{' '}
              <SText variant="body" style={{ fontWeight: '800' }}>{currentEmail}</SText>.
              Al cambiarlo recibirás un enlace de verificación.
            </SText>
          </FadeInView>

          {feedback ? (
            <AuthFeedback type={feedback.type} message={feedback.message} />
          ) : null}

          <FadeInView index={1}>
            <BrutalBox bg={colors.surfaceAlt} radius={radii.md} shadow={3} contentStyle={styles.currentBox}>
              <SText variant="caption2" color={colors.textMuted}>Correo actual</SText>
              <SText variant="callout" style={{ fontWeight: '800', marginTop: 4 }}>{currentEmail}</SText>
            </BrutalBox>

            <SettingsField
              label="Nuevo correo"
              placeholder="tu@correo.com"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </FadeInView>

          <FadeInView index={2}>
            <BrutalButton
              label={saving ? 'Enviando...' : 'Actualizar correo'}
              onPress={handleSave}
              disabled={!newEmail.trim() || saving}
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
  currentBox: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
});
