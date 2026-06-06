import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import SText from '@/src/components/SText';
import AuthFeedback from '@/src/components/AuthFeedback';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  error = null,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const insets = useSafeAreaInsets();
  const bg = variant === 'danger' ? colors.expenseBg : colors.surfaceAlt;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Animated.View entering={SlideInDown.springify().damping(20)} style={styles.wrap}>
          <BrutalBox bg={bg} shadow={5} contentStyle={styles.content}>
            <View style={styles.header}>
              <View style={[styles.icon, brutalBorder(), { backgroundColor: colors.surface }]}>
                <Ionicons
                  name={variant === 'danger' ? 'trash-outline' : 'help-circle-outline'}
                  size={22}
                  color={variant === 'danger' ? colors.expense : colors.ink}
                />
              </View>
              <SText variant="title3" style={{ fontWeight: '800', textTransform: 'uppercase', flex: 1 }}>
                {title}
              </SText>
            </View>

            {error ? <AuthFeedback type="error" title="Error" message={error} /> : null}

            <SText variant="body" color={colors.textSecondary} style={{ lineHeight: 22, marginBottom: spacing.lg }}>
              {message}
            </SText>

            <BrutalButton
              label={loading ? 'Procesando...' : confirmLabel}
              variant={variant === 'danger' ? 'pink' : 'yellow'}
              onPress={onConfirm}
              disabled={loading}
            />
            <AnimatedPressable onPress={onCancel} style={styles.cancel} disabled={loading}>
              <SText variant="footnote" style={{ fontWeight: '700' }}>{cancelLabel}</SText>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  wrap: { width: '100%' },
  content: { padding: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cancel: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm },
});
