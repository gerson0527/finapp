import React from 'react';
import { View, StyleSheet, TextInput, Platform, TextInputProps } from 'react-native';
import SText from '@/src/components/SText';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { radii, spacing, brutalBorder, webTextInputReset } from '@/src/constants/theme';

interface SettingsFieldProps extends TextInputProps {
  label: string;
  hint?: string;
}

export default function SettingsField({ label, hint, style, ...inputProps }: SettingsFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
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
        ...webTextInputReset,
      },
      hint: {
        marginTop: spacing.sm,
        lineHeight: 18,
      },
    })
  );

  return (
    <View style={styles.wrap}>
      <SText variant="caption1" color={colors.textMuted} style={styles.label}>
        {label}
      </SText>
      <TextInput
        style={[styles.input, brutalBorder(2, colors), style]}
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
