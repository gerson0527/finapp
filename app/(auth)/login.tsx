import React, { useState } from 'react';
import {
  View, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withDelay } from 'react-native-reanimated';
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

interface FeedbackState {
  type: AuthFeedbackType;
  title?: string;
  message: string;
}

function showNativeAlert(title: string, message: string) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message);
  }
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const logoScale = useSharedValue(0.85);
  React.useEffect(() => {
    logoScale.value = withDelay(100, withSpring(1, { damping: 12 }));
  }, []);
  const logoAnim = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));

  function clearFeedback() {
    setFeedback(null);
  }

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    clearFeedback();
  }

  function validateForm(): string | null {
    const trimmed = email.trim();
    if (!trimmed || !password) return 'Ingresa correo y contraseña.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'El correo no tiene un formato válido.';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    return null;
  }

  async function handleSubmit() {
    const validationError = validateForm();
    if (validationError) {
      setFeedback({ type: 'error', title: 'Datos incompletos', message: validationError });
      showNativeAlert('Error', validationError);
      return;
    }

    setLoading(true);
    clearFeedback();

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        setFeedback({
          type: 'success',
          title: 'Sesión iniciada',
          message: 'Bienvenido. Cargando tu cuenta…',
        });
        showNativeAlert('Sesión iniciada', 'Bienvenido a FinApp.');
      } else {
        const result = await signUp(email.trim(), password);
        setFeedback(result);
        showNativeAlert(result.title ?? 'Registro', result.message);
        if (result.type === 'info') {
          setMode('login');
        }
      }
    } catch (e: unknown) {
      const message = getAuthErrorMessage(e);
      setFeedback({
        type: 'error',
        title: mode === 'login' ? 'No se pudo iniciar sesión' : 'No se pudo registrar',
        message,
      });
      showNativeAlert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.deco1} />
      <View style={styles.deco2} />

      <Animated.View style={[styles.topSection, logoAnim]}>
        <BrutalBox bg={colors.yellow} radius={radii.lg} shadow={6} contentStyle={styles.logoWrap}>
          <Ionicons name="wallet" size={44} color={colors.ink} />
        </BrutalBox>
        <View style={{ marginTop: 20 }}>
          <HighlightText variant="title1">FinApp</HighlightText>
        </View>
        <SText variant="body" color={colors.textMuted} style={{ marginTop: 10, textAlign: 'center' }}>
          Controla tus finanzas personales
        </SText>
      </Animated.View>

      <FadeInView index={2} delay={150}>
        <BrutalBox contentStyle={styles.formCard}>
          <View style={styles.toggleRow}>
            {(['login', 'register'] as const).map((m) => (
              <AnimatedPressable
                key={m}
                style={[styles.toggleBtn, mode === m && styles.toggleActive]}
                onPress={() => switchMode(m)}
              >
                <SText variant="callout" style={{ fontWeight: '800', textTransform: 'uppercase' }}>
                  {m === 'login' ? 'Entrar' : 'Registro'}
                </SText>
              </AnimatedPressable>
            ))}
          </View>

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
              onChangeText={(text) => {
                setEmail(text);
                if (feedback) clearFeedback();
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={[styles.inputGroup, brutalBorder(2)]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.ink} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { paddingRight: 48 }]}
              placeholder="Contraseña"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (feedback) clearFeedback();
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <AnimatedPressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)} haptic={false}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.ink} />
            </AnimatedPressable>
          </View>

          {mode === 'register' ? (
            <SText variant="caption2" color={colors.textMuted} style={styles.hint}>
              Crea tu cuenta con correo y contraseña. No necesitas confirmar por email.
            </SText>
          ) : null}

          {loading ? (
            <BrutalBox bg={colors.yellow} radius={radii.pill} contentStyle={styles.loadingBtn}>
              <ActivityIndicator color={colors.ink} />
            </BrutalBox>
          ) : (
            <BrutalButton
              label={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              onPress={handleSubmit}
            />
          )}
        </BrutalBox>
      </FadeInView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', paddingHorizontal: 24 },
  deco1: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: colors.decorative, top: 60, right: -20, borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)' },
  deco2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: colors.decorative, bottom: 40, left: -60, opacity: 0.6 },
  topSection: { alignItems: 'center', marginBottom: 28 },
  logoWrap: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  formCard: { padding: spacing.xl },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.pill, alignItems: 'center', borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.bgAlt },
  toggleActive: { backgroundColor: colors.pink },
  hint: { marginBottom: spacing.md, lineHeight: 18 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, marginBottom: spacing.md, height: 54 },
  inputIcon: { marginLeft: 14 },
  input: { flex: 1, color: colors.ink, fontSize: 15, paddingHorizontal: 12, fontWeight: '500' },
  eyeBtn: { padding: 14, position: 'absolute', right: 0 },
  loadingBtn: { paddingVertical: 16, alignItems: 'center', marginTop: spacing.sm },
});
