import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import SText from '@/src/components/SText';
import { colors } from '@/src/constants/theme';

interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showPercentage?: boolean;
  label?: string;
}

export default function DonutChart({
  percentage,
  size = 140,
  strokeWidth = 14,
  color = colors.yellowDark,
  bgColor = colors.bgAlt,
  showPercentage = true,
  label,
}: DonutChartProps) {
  const [displayPct, setDisplayPct] = React.useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const target = Math.min(Math.max(percentage, 0), 100);
    const start = displayPct;
    const duration = 900;
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayPct(Math.round(start + (target - start) * easeOut));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayPct / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={colors.ink} strokeWidth={strokeWidth + 2} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={bgColor} strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showPercentage && (
        <View style={styles.centerContent}>
          <SText variant="title2" color={colors.ink} style={{ fontWeight: '800' }}>{displayPct}%</SText>
          {label && <SText variant="caption2" color={colors.textMuted} style={{ marginTop: 2 }}>{label}</SText>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  centerContent: { position: 'absolute', alignItems: 'center' },
});
