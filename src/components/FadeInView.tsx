import React, { ReactNode } from 'react';
import { ViewProps } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface FadeInViewProps extends ViewProps {
  children: ReactNode;
  index?: number;
  delay?: number;
  direction?: 'down' | 'up';
}

export default function FadeInView({
  children,
  index = 0,
  delay = 0,
  direction = 'down',
  style,
  ...props
}: FadeInViewProps) {
  const entering = direction === 'up'
    ? FadeInUp.delay(index * 55 + delay).duration(450).springify().damping(18)
    : FadeInDown.delay(index * 55 + delay).duration(450).springify().damping(18);

  return (
    <Animated.View entering={entering} style={style} {...props}>
      {children}
    </Animated.View>
  );
}
