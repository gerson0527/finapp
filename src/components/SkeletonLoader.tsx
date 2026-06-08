import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { radii } from '@/src/constants/theme';
import BrutalBox from '@/src/components/BrutalBox';

interface SkeletonLoaderProps {
  variant?: 'card' | 'listItem' | 'text';
}

function SkeletonBlock({ style }: { style: object }) {
  const { colors } = useTheme();
  const shimmer = useSharedValue(0.4);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(0.8, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  return (
    <Animated.View style={[style, { backgroundColor: colors.bgAlt }, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
});

export default function SkeletonLoader({ variant = 'text' }: SkeletonLoaderProps) {
  if (variant === 'card') {
    return (
      <BrutalBox contentStyle={styles.card}>
        <SkeletonBlock style={{ width: '35%', height: 14, borderRadius: 6 }} />
        <SkeletonBlock style={{ width: '75%', height: 22, borderRadius: 6, marginTop: 10 }} />
        <SkeletonBlock style={{ width: '100%', height: 10, borderRadius: 4, marginTop: 16 }} />
      </BrutalBox>
    );
  }

  if (variant === 'listItem') {
    return (
      <View style={styles.listItem}>
        <SkeletonBlock style={{ width: 44, height: 44, borderRadius: radii.sm }} />
        <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
          <SkeletonBlock style={{ width: '55%', height: 14, borderRadius: 6 }} />
          <SkeletonBlock style={{ width: '35%', height: 12, borderRadius: 6 }} />
        </View>
        <SkeletonBlock style={{ width: 80, height: 16, borderRadius: 6 }} />
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <SkeletonBlock style={{ width: '70%', height: 14, borderRadius: 6 }} />
      <SkeletonBlock style={{ width: '50%', height: 12, borderRadius: 6 }} />
    </View>
  );
}
