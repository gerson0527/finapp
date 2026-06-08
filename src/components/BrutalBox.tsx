import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { brutal, radii, brutalBorder } from '@/src/constants/theme';

interface BrutalBoxProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  bg?: string;
  shadow?: number;
  radius?: number;
  noShadow?: boolean;
}

export default function BrutalBox({
  children,
  style,
  contentStyle,
  bg,
  shadow = brutal.shadowOffset,
  radius = radii.lg,
  noShadow = false,
}: BrutalBoxProps) {
  const { colors } = useTheme();
  const fill = bg ?? colors.surface;

  return (
    <View style={[styles.wrapper, !noShadow && { marginBottom: shadow, marginRight: shadow }, style]}>
      {!noShadow && (
        <View
          style={[
            styles.shadowLayer,
            {
              top: shadow,
              left: shadow,
              borderRadius: radius,
              backgroundColor: colors.shadow,
            },
          ]}
        />
      )}
      <View
        style={[
          brutalBorder(brutal.border, colors),
          {
            borderRadius: radius,
            backgroundColor: fill,
            overflow: 'hidden',
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  shadowLayer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    top: 0,
  },
});
