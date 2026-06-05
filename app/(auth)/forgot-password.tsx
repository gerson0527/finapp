import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { getAuthErrorMessage } from '@/lib/authErrors';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import HighlightText from '@/src/components/HighlightText';
import AuthFeedback from '@/src/components/AuthFeedback';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Ingresa un correo válido.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed);
      if (resetError) throw resetError;
      setSent(true);
      if (Platform.OS !== 'web') {
        Alert.alert('Correo enviado', 'Revisa tu bandeja para restablecer la contraseña.');
      }
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.ink} />
        <SText variant="callout" style={{ fontWeight: '700' }}>Volver</SText>
      </AnimatedPressable>

      <FadeInView>
        <HighlightText variant="title2">Recuperar contraseña</HighlightText>
        <SText variant="body" color={colors.textMuted} style={styles.subtitle}>
          Te enviaremos un enlace a tu correo para crear una nueva contraseña.
        </SText>
      </FadeInView>

      <FadeInView index={1}>
        <BrutalBox contentStyle={styles.formCard}>
          {sent ? (
            <AuthFeedback
              type="success"
              title="Revisa tu correo"
              message="Si existe una cuenta con ese email, recibirás instrucciones para restablecer tu contraseña."
            />
          ) : null}
          {error ? <AuthFeedback type="error" message={error} /> : null}

          {!sent ? (
            <>
              <View style={[styles.inputGroup, brutalBorder(2)]}>
                <Ionicons name="mail-outline" size={18} color={colors.ink} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              <BrutalButton
                label={loading ? 'Enviando...' : 'Enviar enlace'}
                onPress={handleSend}
                disabled={loading}
              />
            </>
          ) : (
            <BrutalButton label="Volver al login" onPress={() => router.replace('/(auth)/login')} />
          )}
        </BrutalBox>
      </FadeInView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  formCard: { padding: spacing.xl },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    height: 54,
  },
  inputIcon: { marginLeft: 14 },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    paddingHorizontal: 12,
    fontWeight: '500',
  },
});
