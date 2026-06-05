import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SText from '@/src/components/SText';
import { colors, radii, brutalBorder } from '@/src/constants/theme';

export type AuthFeedbackType = 'success' | 'error' | 'info';

interface AuthFeedbackProps {
  type: AuthFeedbackType;
  message: string;
  title?: string;
}

const CONFIG: Record<AuthFeedbackType, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: colors.incomeBg, icon: 'checkmark-circle' },
  error: { bg: colors.expenseBg, icon: 'alert-circle' },
  info: { bg: colors.surfaceAlt, icon: 'mail' },
};

export default function AuthFeedback({ type, message, title }: AuthFeedbackProps) {
  const { bg, icon } = CONFIG[type];

  return (
    <View style={[styles.box, brutalBorder(2), { backgroundColor: bg }]}>
      <Ionicons name={icon} size={22} color={colors.ink} style={styles.icon} />
      <View style={styles.textWrap}>
        {title ? (
          <SText variant="callout" style={{ fontWeight: '800', marginBottom: 4 }}>
            {title}
          </SText>
        ) : null}
        <SText variant="footnote" color={colors.textSecondary}>
          {message}
        </SText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: radii.md,
    marginBottom: 16,
    gap: 10,
  },
  icon: { marginTop: 1 },
  textWrap: { flex: 1 },
});
