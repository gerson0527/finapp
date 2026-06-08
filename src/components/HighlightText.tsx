import React, { ReactNode } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import SText from '@/src/components/SText';
import { useTheme } from '@/src/context/ThemeContext';

interface HighlightTextProps {
  children: ReactNode;
  variant?: 'title1' | 'title2' | 'title3' | 'headline';
  style?: StyleProp<TextStyle>;
  highlightColor?: string;
  centered?: boolean;
}

export default function HighlightText({
  children,
  variant = 'title2',
  style,
  highlightColor,
  centered = false,
}: HighlightTextProps) {
  const { colors } = useTheme();
  const highlight = highlightColor ?? colors.yellow;

  return (
    <View style={{ alignSelf: centered ? 'center' : 'flex-start' }}>
      <View
        style={{
          position: 'absolute',
          left: -4,
          right: -4,
          bottom: variant === 'title1' ? 6 : 4,
          height: variant === 'title1' ? 16 : 12,
          backgroundColor: highlight,
          zIndex: 0,
        }}
      />
      <SText
        variant={variant}
        color={colors.ink}
        style={[
          {
            textTransform: 'uppercase',
            fontWeight: '700',
            letterSpacing: 0.5,
            zIndex: 1,
            textAlign: centered ? 'center' : 'left',
          },
          style,
        ]}
      >
        {children}
      </SText>
    </View>
  );
}
