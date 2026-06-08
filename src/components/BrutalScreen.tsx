import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface BrutalScreenProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  showDecor?: boolean;
  skipTopInset?: boolean;
}

export function BrutalDecorations() {
  const { isDark } = useTheme();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      deco: {
        position: 'absolute',
        backgroundColor: colors.decorative,
        borderWidth: 2,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      },
      decoCircle1: {
        width: 120,
        height: 120,
        borderRadius: 60,
        top: 80,
        right: -30,
      },
      decoCircle2: {
        width: 60,
        height: 60,
        borderRadius: 30,
        bottom: 200,
        left: -15,
      },
      decoArc: {
        width: 200,
        height: 200,
        borderRadius: 100,
        bottom: -80,
        right: -60,
        opacity: 0.5,
      },
    })
  );

  return (
    <>
      <View style={[styles.deco, styles.decoCircle1]} />
      <View style={[styles.deco, styles.decoCircle2]} />
      <View style={[styles.deco, styles.decoArc, isDark && { opacity: 0.35 }]} />
    </>
  );
}

export default function BrutalScreen({
  children,
  style,
  showDecor = true,
  skipTopInset = false,
}: BrutalScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      screen: {
        flex: 1,
        backgroundColor: c.bg,
        overflow: 'hidden',
      },
    })
  );

  return (
    <View style={[styles.screen, !skipTopInset && { paddingTop: insets.top }, style]}>
      {showDecor && <BrutalDecorations />}
      {children}
    </View>
  );
}
