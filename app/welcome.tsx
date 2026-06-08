import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
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
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { radii, spacing, brutalBorder } from '@/src/constants/theme';

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
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      root: {
        flex: 1,
        justifyContent: 'space-between',
      },
      heroZone: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 0,
      },
      hero: {
        alignItems: 'center',
      },
      logo: {
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
        marginBottom: spacing.xs,
        textAlign: 'center',
      },
      subtitle: {
        marginTop: spacing.md,
        lineHeight: 22,
        textAlign: 'center',
        paddingHorizontal: spacing.sm,
      },
      tips: {
        gap: spacing.sm,
        width: '100%',
        flexShrink: 0,
        marginVertical: spacing.sm,
      },
      tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
      },
      tipRowTiny: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
      },
      tipIcon: {
        borderRadius: radii.sm,
        backgroundColor: colors.yellow,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
      },
      footer: {
        flexShrink: 0,
        paddingTop: spacing.xs,
      },
    })
  );

  const greeting = useMemo(() => getGreeting(), []);
  const name = useMemo(() => formatWelcomeName(getDisplayName(session)), [session]);

  const tiny = windowHeight < 620;
  const compact = windowHeight < 720;

  const scale = useSharedValue(0.9);
  React.useEffect(() => {
    scale.value = withDelay(80, withSpring(1, { damping: 12 }));
  }, [scale]);
  const heroAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handleContinue() {
    completeWelcome();
    router.replace('/(tabs)');
  }

  const logoSize = tiny ? 72 : compact ? 84 : 96;
  const iconSize = tiny ? 34 : compact ? 42 : 48;
  const tipIconSize = tiny ? 34 : 40;
  const bottomPad = Math.max(insets.bottom, spacing.sm);

  return (
    <BrutalScreen>
      <View
        style={[
          styles.root,
          {
            paddingTop: tiny ? spacing.sm : spacing.md,
            paddingBottom: bottomPad,
            paddingHorizontal: spacing.xl,
          },
        ]}
      >
        <View style={styles.heroZone}>
          <Animated.View style={[styles.hero, heroAnim, { marginBottom: tiny ? spacing.md : spacing.lg }]}>
            <BrutalBox
              bg={colors.yellow}
              shadow={6}
              contentStyle={[styles.logo, { width: logoSize, height: logoSize }]}
            >
              <Ionicons name="sparkles" size={iconSize} color={colors.ink} />
            </BrutalBox>
          </Animated.View>

          <FadeInView index={1} style={styles.intro}>
            <SText variant="caption2" color={colors.textMuted} style={styles.greeting}>
              {greeting}
            </SText>
            <HighlightText variant={tiny ? 'title3' : compact ? 'title2' : 'title1'} centered>
              ¡Hola, {name}!
            </HighlightText>
            <SText
              variant={tiny ? 'footnote' : 'body'}
              color={colors.textSecondary}
              style={[styles.subtitle, tiny && { lineHeight: 18, marginTop: spacing.sm }]}
            >
              Qué bueno verte de nuevo. Tu resumen del mes te espera: gastos, presupuestos y metas.
            </SText>
          </FadeInView>
        </View>

        <FadeInView index={2} style={[styles.tips, tiny && { gap: 6 }]}>
          {TIPS.map((tip) => (
            <BrutalBox
              key={tip.text}
              bg={colors.surfaceAlt}
              shadow={3}
              contentStyle={[styles.tipRow, tiny && styles.tipRowTiny]}
            >
              <View
                style={[
                  styles.tipIcon,
                  brutalBorder(undefined, colors),
                  { width: tipIconSize, height: tipIconSize },
                ]}
              >
                <Ionicons name={tip.icon} size={tiny ? 16 : 18} color={colors.ink} />
              </View>
              <SText
                variant={tiny ? 'caption2' : 'footnote'}
                style={{ fontWeight: '700', flex: 1 }}
                numberOfLines={2}
              >
                {tip.text}
              </SText>
            </BrutalBox>
          ))}
        </FadeInView>

        <FadeInView index={3} style={styles.footer}>
          <BrutalButton label="Empezar" onPress={handleContinue} />
        </FadeInView>
      </View>
    </BrutalScreen>
  );
}
