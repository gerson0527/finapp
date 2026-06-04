import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, brutal, radii, brutalBorder } from '@/src/constants/theme';

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
  bg = colors.surface,
  shadow = brutal.shadowOffset,
  radius = radii.lg,
  noShadow = false,
}: BrutalBoxProps) {
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
              backgroundColor: colors.ink,
            },
          ]}
        />
      )}
      <View
        style={[
          brutalBorder(),
          {
            borderRadius: radius,
            backgroundColor: bg,
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
