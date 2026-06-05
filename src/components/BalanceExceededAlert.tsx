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
} from 'react-native-reanimated';
import SText from '@/src/components/SText';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import { formatCOP } from '@/src/utils/currency';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

interface BalanceExceededAlertProps {
  visible: boolean;
  balance: number;
  amount: number;
  onDismiss: () => void;
}

const SHAKE_PAUSE_MS = 2800;

function useCardShake(active: boolean) {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.92);

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
        withTiming(-12, { duration: 40 }),
        withTiming(12, { duration: 40 }),
        withTiming(-9, { duration: 40 }),
        withTiming(9, { duration: 40 }),
        withTiming(0, { duration: 45 }),
        withDelay(SHAKE_PAUSE_MS, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(-2.5, { duration: 40 }),
        withTiming(2.5, { duration: 40 }),
        withTiming(0, { duration: 45 }),
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

export default function BalanceExceededAlert({
  visible,
  balance,
  amount,
  onDismiss,
}: BalanceExceededAlertProps) {
  const cardShake = useCardShake(visible);
  const shortfall = Math.max(amount - balance, 0);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.wrap, cardShake]}>
          <BrutalBox bg={colors.expenseBg} shadow={6} contentStyle={styles.card}>
            <View style={[styles.iconCircle, brutalBorder(3)]}>
              <Ionicons name="wallet-outline" size={44} color={colors.expense} />
              <View style={[styles.stopBadge, brutalBorder(3)]}>
                <Ionicons name="close" size={14} color={colors.ink} />
              </View>
            </View>

            <SText variant="title3" style={styles.title}>
              ¡Superaste tu balance!
            </SText>
            <SText variant="body" color={colors.textSecondary} style={styles.message}>
              Querías gastar {formatCOP(amount)}, pero solo tienes {formatCOP(balance)} disponible.
              {shortfall > 0
                ? ` Te faltan ${formatCOP(shortfall)} para poder hacer este gasto.`
                : ''}
            </SText>

            <BrutalBox bg={colors.surface} radius={radii.md} shadow={2} contentStyle={styles.tipBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.ink} />
              <SText variant="footnote" color={colors.textSecondary} style={{ flex: 1, lineHeight: 20 }}>
                Registra un ingreso o reduce el monto del gasto para no quedar en negativo.
              </SText>
            </BrutalBox>

            <BrutalButton
              label="Entendido"
              variant="pink"
              onPress={onDismiss}
              style={{ marginTop: spacing.lg, width: '100%' }}
            />
            <AnimatedPressable onPress={onDismiss} style={styles.dismissBtn}>
              <SText variant="footnote" style={{ fontWeight: '700' }}>Ajustar monto</SText>
            </AnimatedPressable>
          </BrutalBox>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stopBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.yellow,
    justifyContent: 'center',
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
});
