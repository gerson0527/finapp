import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { updatePassword } from '@/services/accountSettingsService';
import BrutalScreen from '@/src/components/BrutalScreen';
import BrutalButton from '@/src/components/BrutalButton';
import SettingsField from '@/src/components/SettingsField';
import AuthFeedback from '@/src/components/AuthFeedback';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import { colors, spacing } from '@/src/constants/theme';

export default function PasswordSettingsScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSave = password.length >= 6 && password === confirm;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setFeedback(null);
    try {
      await updatePassword(password);
      setFeedback({ type: 'success', message: 'Tu contraseña se actualizó correctamente.' });
      setPassword('');
      setConfirm('');
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'No se pudo cambiar la contraseña.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Contraseña' }} />
      <BrutalScreen showDecor={false}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeInView>
            <SText variant="body" color={colors.textSecondary} style={styles.intro}>
              Elige una contraseña segura de al menos 6 caracteres. La usarás para iniciar sesión.
            </SText>
          </FadeInView>

          {feedback ? <AuthFeedback type={feedback.type} message={feedback.message} /> : null}

          <FadeInView index={1}>
            <SettingsField
              label="Nueva contraseña"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <SettingsField
              label="Confirmar contraseña"
              placeholder="Repite la contraseña"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              hint={mismatch ? 'Las contraseñas no coinciden' : undefined}
            />
          </FadeInView>

          <FadeInView index={2}>
            <BrutalButton
              label={saving ? 'Guardando...' : 'Cambiar contraseña'}
              onPress={handleSave}
              disabled={!canSave || saving}
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
});
