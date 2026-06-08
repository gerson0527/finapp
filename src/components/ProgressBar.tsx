import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { brutal, brutalBorder } from '@/src/constants/theme';

interface ProgressBarProps {
  percentage: number;
  color?: string;
  height?: number;
  backgroundColor?: string;
}

export default function ProgressBar({
  percentage,
  color,
  height = 10,
  backgroundColor,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const fillColor = color ?? colors.yellow;
  const trackBg = backgroundColor ?? colors.bgAlt;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(Math.max(percentage, 0), 100), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={[styles.track, brutalBorder(2, colors), { height, backgroundColor: trackBg, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          { height: height - 4, backgroundColor: fillColor, borderRadius: (height - 4) / 2, margin: 2 },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: {},
});
