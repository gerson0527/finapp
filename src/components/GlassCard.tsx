import React, { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import BrutalBox from '@/src/components/BrutalBox';
import { useTheme } from '@/src/context/ThemeContext';
import { radii } from '@/src/constants/theme';

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
  bg,
}: GlassCardProps) {
  const { colors } = useTheme();

  return (
    <BrutalBox bg={bg ?? colors.surface} radius={radii.lg} style={style} contentStyle={contentStyle}>
      {children}
    </BrutalBox>
  );
}
