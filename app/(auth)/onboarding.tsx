import { completeOnboarding } from "@/services/onboardingService";
import BrutalBox from "@/src/components/BrutalBox";
import BrutalButton from "@/src/components/BrutalButton";
import FadeInView from "@/src/components/FadeInView";
import HighlightText from "@/src/components/HighlightText";
import SText from "@/src/components/SText";
import { brutalBorder, colors, radii, spacing } from "@/src/constants/theme";
import { copDigitsToNumber, formatCOPDigits, parseCOPDigits } from "@/src/utils/currency";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshOnboarding } = useAuth();
  const [income, setIncome] = useState("");
  const [loading, setLoading] = useState(false);

  const logoScale = useSharedValue(0.9);
  React.useEffect(() => {
    logoScale.value = withDelay(80, withSpring(1, { damping: 12 }));
  }, []);
  const logoAnim = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  async function handleContinue() {
    const amount = copDigitsToNumber(income);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Ingresa cuánto ganas al mes (aproximado)");
      return;
    }

    setLoading(true);
    try {
      await completeOnboarding(amount);
      await refreshOnboarding();
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = e.message || 'No se pudo configurar tu cuenta';
      if (/profiles|user_id|404|400|relation/i.test(msg)) {
        Alert.alert(
          'Base de datos sin configurar',
          'Falta aplicar la migración en Supabase. Ve al SQL Editor y ejecuta el archivo supabase/migrations/20250603_user_onboarding.sql'
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 24 }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Animated.View style={[styles.hero, logoAnim]}>
        <BrutalBox
          bg={colors.yellow}
          radius={radii.lg}
          shadow={6}
          contentStyle={styles.logoWrap}
        >
          <Ionicons name="cash" size={40} color={colors.ink} />
        </BrutalBox>
        <HighlightText variant="title2" centered style={{ marginTop: 20 }}>
          Bienvenido a FinApp
        </HighlightText>
        <SText variant="body" color={colors.textMuted} style={styles.subtitle}>
          Cuéntanos cuánto ganas al mes (aproximado). Ese monto será tu balance
          neto inicial.
        </SText>
      </Animated.View>

      <FadeInView index={1} delay={120}>
        <BrutalBox contentStyle={styles.card}>
          <SText
            variant="label"
            color={colors.textMuted}
            style={styles.fieldLabel}
          >
            INGRESO MENSUAL (COP)
          </SText>
          <View style={[styles.amountRow, brutalBorder(2)]}>
            <SText variant="title2" style={{ fontWeight: "700" }}>
              $
            </SText>
            <TextInput
              style={styles.amountInput}
              value={formatCOPDigits(income)}
              onChangeText={(t) => setIncome(parseCOPDigits(t))}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType={Platform.OS === "web" ? "numeric" : "number-pad"}
              autoFocus
            />
            <SText variant="caption1" color={colors.textSecondary} style={{ fontWeight: "700" }}>
              COP
            </SText>
          </View>
          {income.length > 0 && (
            <SText
              variant="footnote"
              color={colors.textSecondary}
              style={styles.hint}
            >
              Pesos colombianos (COP) · balance inicial
            </SText>
          )}

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={18} color={colors.ink} />
            <SText
              variant="footnote"
              color={colors.textSecondary}
              style={{ flex: 1 }}
            >
              Crearemos tu meta de Fondo de Emergencia en $0 para que empieces
              desde cero.
            </SText>
          </View>

          <BrutalButton
            label={loading ? "Configurando..." : "Empezar"}
            onPress={handleContinue}
            disabled={!income || loading}
          />
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
    justifyContent: "center",
  },
  hero: { alignItems: "center", marginBottom: spacing.xxl },
  logoWrap: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  card: { padding: spacing.xl },
  fieldLabel: { marginBottom: spacing.sm },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: 6,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.ink,
    minWidth: 120,
    textAlign: "center",
    ...(Platform.OS === "web" ? { outlineStyle: "none" as const } : {}),
  },
  hint: { textAlign: "center", marginTop: spacing.sm },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.bgAlt,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
