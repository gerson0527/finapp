import React from 'react';
import { View, StyleSheet, TextInput, Platform, TextInputProps } from 'react-native';
import SText from '@/src/components/SText';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

interface SettingsFieldProps extends TextInputProps {
  label: string;
  hint?: string;
}

export default function SettingsField({ label, hint, style, ...inputProps }: SettingsFieldProps) {
  return (
    <View style={styles.wrap}>
      <SText variant="caption1" color={colors.textMuted} style={styles.label}>
        {label}
      </SText>
      <TextInput
        style={[styles.input, brutalBorder(2), style]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
      {hint ? (
        <SText variant="caption2" color={colors.textMuted} style={styles.hint}>
          {hint}
        </SText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    color: colors.ink,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as const } : {}),
  },
  hint: {
    marginTop: spacing.sm,
    lineHeight: 18,
  },
});
