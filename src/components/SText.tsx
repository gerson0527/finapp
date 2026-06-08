import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { typography, textSharp } from '@/src/constants/typography';
import { useTheme } from '@/src/context/ThemeContext';

type Variant = keyof typeof typography;

interface STextProps extends TextProps {
  variant?: Variant;
  color?: string;
  uppercase?: boolean;
}

export default function SText({
  variant = 'body',
  color,
  uppercase = false,
  style,
  ...props
}: STextProps) {
  const { colors } = useTheme();
  const base = typography[variant];

  return (
    <Text
      style={[
        typeof base === 'object' ? base : undefined,
        { color: color ?? colors.text },
        textSharp,
        uppercase && styles.uppercase,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  uppercase: {
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
