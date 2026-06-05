import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import BrutalBox from '@/src/components/BrutalBox';
import SText from '@/src/components/SText';
import { colors, brutal, radii } from '@/src/constants/theme';

interface BrutalButtonProps {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'yellow' | 'white' | 'pink';
  disabled?: boolean;
  small?: boolean;
}

export default function BrutalButton({
  label,
  onPress,
  style,
  variant = 'yellow',
  disabled = false,
  small = false,
}: BrutalButtonProps) {
  const press = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: press.value }, { translateY: press.value }],
  }));

  const bg =
    variant === 'yellow' ? colors.yellow :
    variant === 'pink' ? colors.pink :
    colors.surface;

  return (
    <Animated.View style={[style, animStyle, disabled && { opacity: 0.5 }]}>
      <Pressable
        disabled={disabled}
        onPressIn={() => { press.value = withSpring(3, { damping: 15 }); }}
        onPressOut={() => { press.value = withSpring(0, { damping: 12 }); }}
        onPress={() => {
          if (disabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress?.();
        }}
      >
        <BrutalBox
          bg={bg}
          radius={radii.pill}
          shadow={small ? brutal.shadowOffsetSm : brutal.shadowOffset}
          contentStyle={[styles.btn, small && styles.btnSmall]}
        >
          <SText variant={small ? 'caption1' : 'headline'} color={colors.ink} style={styles.label}>
            {label}
          </SText>
        </BrutalBox>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 16, paddingHorizontal: 28, alignItems: 'center' },
  btnSmall: { paddingVertical: 10, paddingHorizontal: 18 },
  label: { textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.4 },
});
