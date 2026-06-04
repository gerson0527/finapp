import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/constants/theme';

interface BrutalScreenProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  showDecor?: boolean;
}

export function BrutalDecorations() {
  return (
    <>
      <View style={[styles.deco, styles.decoCircle1]} />
      <View style={[styles.deco, styles.decoCircle2]} />
      <View style={[styles.deco, styles.decoArc]} />
    </>
  );
}

export default function BrutalScreen({ children, style, showDecor = true }: BrutalScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }, style]}>
      {showDecor && <BrutalDecorations />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  deco: {
    position: 'absolute',
    backgroundColor: colors.decorative,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
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
});
