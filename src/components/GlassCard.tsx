import React, { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import BrutalBox from '@/src/components/BrutalBox';
import { colors, radii } from '@/src/constants/theme';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accent?: string;
  glow?: boolean;
  bg?: string;
}

/** Neo-brutalist card (kept name for compatibility) */
export default function GlassCard({
  children,
  style,
  contentStyle,
  bg = colors.surface,
}: GlassCardProps) {
  return (
    <BrutalBox bg={bg} radius={radii.lg} style={style} contentStyle={contentStyle}>
      {children}
    </BrutalBox>
  );
}
