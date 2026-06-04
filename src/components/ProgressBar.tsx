import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, brutal, radii, brutalBorder } from '@/src/constants/theme';

interface ProgressBarProps {
  percentage: number;
  color?: string;
  height?: number;
  backgroundColor?: string;
}

export default function ProgressBar({
  percentage,
  color = colors.yellow,
  height = 10,
  backgroundColor = colors.bgAlt,
}: ProgressBarProps) {
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
    <View style={[styles.track, brutalBorder(2), { height, backgroundColor, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          { height: height - 4, backgroundColor: color, borderRadius: (height - 4) / 2, margin: 2 },
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
