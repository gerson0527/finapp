import React, { useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import SText from '@/src/components/SText';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import { formatCOP } from '@/src/utils/currency';
import { isBalanceEmpty } from '@/lib/balanceAlerts';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import type { ThemeColors } from '@/src/constants/colors';
import { radii, spacing, brutalBorder } from '@/src/constants/theme';

interface ZeroBalanceAlertProps {
  visible: boolean;
  balance: number;
  onDismiss: () => void;
  onGoToBudgets?: () => void;
}

function TearDrop({ delay, left }: { delay: number; left: number }) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0.9);

  useEffect(() => {
    const start = () => {
      y.value = 0;
      opacity.value = 0.9;
      y.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(14, { duration: 900, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 0 }),
          withTiming(0, { duration: 900, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
    };
    const t = setTimeout(start, delay);
    return () => clearTimeout(t);
  }, [delay, y, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ position: 'absolute', top: 58 }, { left }, style]}>
      <View style={tearDotStyle} />
    </Animated.View>
  );
}

const tearDotStyle = {
  width: 6,
  height: 10,
  borderRadius: 3,
  backgroundColor: '#4A9EFF',
};

const SHAKE_PAUSE_MS = 2600;

function useCardShake(active: boolean) {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (!active) {
      translateX.value = 0;
      rotate.value = 0;
      scale.value = 1;
      return;
    }

    scale.value = withSpring(1, { damping: 9, stiffness: 200 });

    translateX.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 42 }),
        withTiming(14, { duration: 42 }),
        withTiming(-11, { duration: 42 }),
        withTiming(11, { duration: 42 }),
        withTiming(-7, { duration: 42 }),
        withTiming(7, { duration: 42 }),
        withTiming(0, { duration: 50 }),
        withDelay(SHAKE_PAUSE_MS, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );

    rotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 42 }),
        withTiming(3, { duration: 42 }),
        withTiming(-2.5, { duration: 42 }),
        withTiming(2.5, { duration: 42 }),
        withTiming(0, { duration: 50 }),
        withDelay(SHAKE_PAUSE_MS, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
  }, [active, translateX, rotate, scale]);

  return useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));
}

function SadFace({ colors }: { colors: ThemeColors }) {
  const sway = useSharedValue(0);
  const bounce = useSharedValue(1);

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    bounce.value = withRepeat(
      withSequence(
        withTiming(0.94, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [sway, bounce]);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${sway.value}deg` },
      { scale: bounce.value },
    ],
  }));

  return (
    <View style={{ width: 88, height: 88, marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
          },
          brutalBorder(3, colors),
          faceStyle,
        ]}
      >
        <Ionicons name="sad" size={52} color={colors.ink} />
      </Animated.View>
      <TearDrop delay={0} left={28} />
      <TearDrop delay={450} left={52} />
    </View>
  );
}

export default function ZeroBalanceAlert({
  visible,
  balance,
  onDismiss,
  onGoToBudgets,
}: ZeroBalanceAlertProps) {
  const { colors } = useTheme();
  const empty = isBalanceEmpty(balance);
  const cardShake = useCardShake(visible);

  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.xl,
      },
      wrap: { width: '100%' },
      card: {
        padding: spacing.xl,
        alignItems: 'center',
      },
      title: {
        fontWeight: '800',
        textTransform: 'uppercase',
        textAlign: 'center',
        marginBottom: spacing.sm,
      },
      message: {
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.md,
      },
      tipBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        padding: spacing.md,
        width: '100%',
      },
      dismissBtn: {
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
      },
    })
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.wrap, cardShake]}>
          <BrutalBox bg={colors.expenseBg} shadow={6} contentStyle={styles.card}>
            <SadFace colors={colors} />

            <SText variant="title3" style={styles.title}>
              {empty ? 'Tu balance llegó a cero' : '¡Casi sin saldo!'}
            </SText>
            <SText variant="body" color={colors.textSecondary} style={styles.message}>
              {empty
                ? 'No te queda dinero disponible. Es momento de frenar los gastos y aprender a gestionar mejor tu plata.'
                : `Solo te quedan ${formatCOP(balance)}. Estás llegando a cero — aprende a gestionar tu dinero antes de que sea tarde.`}
            </SText>

            <BrutalBox bg={colors.surface} radius={radii.md} shadow={2} contentStyle={styles.tipBox}>
              <Ionicons name="bulb-outline" size={18} color={colors.ink} />
              <SText variant="footnote" color={colors.textSecondary} style={{ flex: 1, lineHeight: 20 }}>
                Crea presupuestos, revisa tu historial y evita gastar más de lo que ingresa cada mes.
              </SText>
            </BrutalBox>

            {onGoToBudgets ? (
              <BrutalButton
                label="Ir a presupuestos"
                variant="pink"
                onPress={() => {
                  onDismiss();
                  onGoToBudgets();
                }}
                style={{ marginTop: spacing.lg }}
              />
            ) : null}
            <AnimatedPressable onPress={onDismiss} style={styles.dismissBtn}>
              <SText variant="footnote" style={{ fontWeight: '700' }}>Entendido</SText>
            </AnimatedPressable>
          </BrutalBox>
        </Animated.View>
      </View>
    </Modal>
  );
}
