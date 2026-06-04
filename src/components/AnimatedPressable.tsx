import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  brutal?: boolean;
  haptic?: boolean;
}

export default function AnimatedPressable({
  children,
  style,
  brutal = true,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: AnimatedPressableProps) {
  const press = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: brutal
      ? [{ translateX: press.value }, { translateY: press.value }]
      : [{ scale: 1 - press.value * 0.04 }],
  }));

  return (
    <AnimatedPressableBase
      {...props}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        press.value = withSpring(brutal ? 3 : 1, { damping: 15, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.value = withSpring(0, { damping: 12, stiffness: 300 });
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(e);
      }}
    >
      {children}
    </AnimatedPressableBase>
  );
}
