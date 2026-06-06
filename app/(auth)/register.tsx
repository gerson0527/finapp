import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { getAuthErrorMessage } from '@/lib/authErrors';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import HighlightText from '@/src/components/HighlightText';
import AuthFeedback, { AuthFeedbackType } from '@/src/components/AuthFeedback';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: AuthFeedbackType;
    title?: string;
    message: string;
  } | null>(null);

  async function handleRegister() {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setFeedback({ type: 'error', message: 'Ingresa correo y contraseña.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFeedback({ type: 'error', message: 'El correo no tiene un formato válido.' });
      return;
    }
    if (password.length < 6) {
      setFeedback({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const result = await signUp(trimmed, password);
      setFeedback(result);
      if (Platform.OS !== 'web') Alert.alert(result.title ?? 'Registro', result.message);
      if (result.type === 'info') router.replace('/(auth)/login');
    } catch (e: unknown) {
      setFeedback({ type: 'error', message: getAuthErrorMessage(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <AnimatedPressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 8 }]}>
        <Ionicons name="arrow-back" size={22} color={colors.ink} />
        <SText variant="callout" style={{ fontWeight: '700' }}>Volver</SText>
      </AnimatedPressable>

      <FadeInView>
        <HighlightText variant="title2">Crear cuenta</HighlightText>
        <SText variant="body" color={colors.textMuted} style={styles.subtitle}>
          Regístrate para empezar a controlar tu dinero.
        </SText>
      </FadeInView>

      <FadeInView index={1}>
        <BrutalBox contentStyle={styles.formCard}>
          {feedback ? (
            <AuthFeedback type={feedback.type} title={feedback.title} message={feedback.message} />
          ) : null}

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

          <View style={[styles.inputGroup, brutalBorder(2)]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.ink} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { paddingRight: 48 }]}
              placeholder="Contraseña (mín. 6)"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <AnimatedPressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)} haptic={false}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.ink} />
            </AnimatedPressable>
          </View>

          {loading ? (
            <BrutalBox bg={colors.yellow} radius={radii.pill} contentStyle={styles.loadingBtn}>
              <ActivityIndicator color={colors.ink} />
            </BrutalBox>
          ) : (
            <BrutalButton label="Crear cuenta" onPress={handleRegister} />
          )}

          <AnimatedPressable onPress={() => router.replace('/(auth)/login')} style={styles.linkBtn}>
            <SText variant="footnote" style={{ fontWeight: '700' }}>
              ¿Ya tienes cuenta? Inicia sesión
            </SText>
          </AnimatedPressable>
        </BrutalBox>
      </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingTop: 48 },
  backBtn: {
    position: 'absolute',
    left: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
  },
  subtitle: { marginTop: spacing.sm, marginBottom: spacing.xl, lineHeight: 22 },
  formCard: { padding: spacing.xl },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    height: 54,
  },
  inputIcon: { marginLeft: 14 },
  input: { flex: 1, color: colors.ink, fontSize: 15, paddingHorizontal: 12, fontWeight: '500' },
  eyeBtn: { padding: 14, position: 'absolute', right: 0 },
  loadingBtn: { paddingVertical: 16, alignItems: 'center', marginTop: spacing.sm },
  linkBtn: { marginTop: spacing.lg, alignItems: 'center' },
});
