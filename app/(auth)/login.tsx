import React, { useState } from 'react';
import {
  View, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const logoScale = useSharedValue(0.85);
  React.useEffect(() => {
    logoScale.value = withDelay(100, withSpring(1, { damping: 12 }));
  }, [logoScale]);
  const logoAnim = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));

  function clearFeedback() {
    setFeedback(null);
  }

  function validateForm(): string | null {
    const trimmed = email.trim();
    if (!trimmed || !password) return 'Ingresa correo y contraseña.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'El correo no tiene un formato válido.';
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
      await signIn(email.trim(), password);
      setFeedback({
        type: 'success',
        title: 'Sesión iniciada',
        message: 'Bienvenido. Cargando tu cuenta…',
      });
      showNativeAlert('Sesión iniciada', 'Bienvenido a FinApp.');
    } catch (e: unknown) {
      const message = getAuthErrorMessage(e);
      setFeedback({
        type: 'error',
        title: 'No se pudo iniciar sesión',
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
              autoComplete="current-password"
            />
            <AnimatedPressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)} haptic={false}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.ink} />
            </AnimatedPressable>
          </View>

          <AnimatedPressable
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotLink}
          >
            <SText variant="footnote" color={colors.textSecondary} style={{ fontWeight: '700' }}>
              ¿Olvidaste tu contraseña?
            </SText>
          </AnimatedPressable>

          {loading ? (
            <BrutalBox bg={colors.yellow} radius={radii.pill} contentStyle={styles.loadingBtn}>
              <ActivityIndicator color={colors.ink} />
            </BrutalBox>
          ) : (
            <BrutalButton label="Iniciar sesión" onPress={handleSubmit} />
          )}

          <AnimatedPressable onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
            <SText variant="footnote" style={{ fontWeight: '700' }}>
              ¿No tienes cuenta? Regístrate
            </SText>
          </AnimatedPressable>
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
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, marginBottom: spacing.md, height: 54 },
  inputIcon: { marginLeft: 14 },
  input: { flex: 1, color: colors.ink, fontSize: 15, paddingHorizontal: 12, fontWeight: '500' },
  eyeBtn: { padding: 14, position: 'absolute', right: 0 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  registerLink: { marginTop: spacing.lg, alignItems: 'center' },
  loadingBtn: { paddingVertical: 16, alignItems: 'center', marginTop: spacing.sm },
});
