import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useAuth } from '@/src/context/AuthContext';
import BrutalScreen from '@/src/components/BrutalScreen';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import HighlightText from '@/src/components/HighlightText';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getDisplayName(session: ReturnType<typeof useAuth>['session']): string {
  const metaName = String(session?.user?.user_metadata?.display_name ?? '').trim();
  if (metaName) return metaName;
  const email = session?.user?.email ?? '';
  const local = email.split('@')[0] ?? '';
  if (!local) return 'Usuario';
  const part = local.split(/[._-]/).filter(Boolean)[0];
  if (!part) return local;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

/** Nombre corto para el saludo en pantallas estrechas. */
function formatWelcomeName(raw: string): string {
  const withoutDigits = raw.replace(/\d+/g, ' ').trim().split(/\s+/)[0] ?? raw;
  const name = withoutDigits.length >= 2 ? withoutDigits : raw;
  if (name.length <= 14) return name;
  return `${name.slice(0, 13)}…`;
}

const TIPS = [
  { icon: 'trending-down-outline' as const, text: 'Revisa tus gastos del mes' },
  { icon: 'pie-chart-outline' as const, text: 'Mira cómo van tus presupuestos' },
  { icon: 'add-circle-outline' as const, text: 'Registra un movimiento en segundos' },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const { session, completeWelcome } = useAuth();

  const greeting = useMemo(() => getGreeting(), []);
  const name = useMemo(() => formatWelcomeName(getDisplayName(session)), [session]);
  const compact = windowHeight < 700;

  const scale = useSharedValue(0.9);
  React.useEffect(() => {
    scale.value = withDelay(80, withSpring(1, { damping: 12 }));
  }, [scale]);
  const heroAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handleContinue() {
    completeWelcome();
    router.replace('/(tabs)');
  }

  const bottomPad = Math.max(insets.bottom, spacing.lg);

  return (
    <BrutalScreen>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: spacing.xl,
              minHeight: windowHeight - insets.top - bottomPad - 72,
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroBlock}>
            <Animated.View style={[styles.hero, heroAnim]}>
              <BrutalBox bg={colors.yellow} shadow={6} contentStyle={styles.logo}>
                <Ionicons name="sparkles" size={compact ? 40 : 48} color={colors.ink} />
              </BrutalBox>
            </Animated.View>

            <FadeInView index={1} style={styles.intro}>
              <SText variant="footnote" color={colors.textMuted} style={styles.greeting}>
                {greeting}
              </SText>
              <HighlightText variant={compact ? 'title2' : 'title1'} centered>
                ¡Hola, {name}!
              </HighlightText>
              <SText variant="body" color={colors.textSecondary} style={styles.subtitle}>
                Qué bueno verte de nuevo. Tu resumen del mes te espera: gastos, presupuestos y metas.
              </SText>
            </FadeInView>
          </View>

          <FadeInView index={2} style={styles.tips}>
            {TIPS.map((tip) => (
              <BrutalBox key={tip.text} bg={colors.surfaceAlt} shadow={3} contentStyle={styles.tipRow}>
                <View style={[styles.tipIcon, brutalBorder()]}>
                  <Ionicons name={tip.icon} size={18} color={colors.ink} />
                </View>
                <SText variant="footnote" style={{ fontWeight: '700', flex: 1 }}>
                  {tip.text}
                </SText>
              </BrutalBox>
            ))}
          </FadeInView>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: bottomPad, paddingHorizontal: spacing.xl }]}>
          <FadeInView index={3}>
            <BrutalButton label="Empezar" onPress={handleContinue} />
          </FadeInView>
        </View>
      </View>
    </BrutalScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  heroBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    minHeight: 220,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intro: {
    width: '100%',
    alignItems: 'center',
  },
  greeting: {
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.md,
    lineHeight: 24,
    textAlign: 'center',
  },
  tips: {
    gap: spacing.sm,
    width: '100%',
    paddingBottom: spacing.lg,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: 0,
  },
});
