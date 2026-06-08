import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useChartWidth } from '@/src/hooks/useChartWidth';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import SText from '@/src/components/SText';
import { formatMonthLabel } from '@/lib/month';
import { formatCOP } from '@/src/utils/currency';
import { useTheme } from '@/src/context/ThemeContext';
import { spacing } from '@/src/constants/theme';
import type { NetBalanceByMonth } from '@/services/analyticsService';

interface NetBalanceLineChartProps {
  data: NetBalanceByMonth[];
  height?: number;
}

export default function NetBalanceLineChart({ data, height = 140 }: NetBalanceLineChartProps) {
  const { colors } = useTheme();
  const width = useChartWidth(8);
  const values = data.map((d) => d.net);
  const maxAbs = Math.max(...values.map(Math.abs), 1);
  const padX = 16;
  const padY = 20;
  const chartH = height - padY * 2;
  const step = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0;

  const points = data.map((item, i) => {
    const x = padX + i * step;
    const y = padY + chartH / 2 - (item.net / maxAbs) * (chartH / 2 - 8);
    return `${x},${y}`;
  });

  const zeroY = padY + chartH / 2;

  return (
    <View style={styles.wrap}>
      <Svg width={width} height={height}>
        <Line
          x1={padX}
          y1={zeroY}
          x2={width - padX}
          y2={zeroY}
          stroke={colors.textMuted}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        {points.length > 1 ? (
          <Polyline
            points={points.join(' ')}
            fill="none"
            stroke={colors.ink}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {data.map((item, i) => {
          const x = padX + i * step;
          const y = padY + chartH / 2 - (item.net / maxAbs) * (chartH / 2 - 8);
          return (
            <Circle
              key={item.month}
              cx={x}
              cy={y}
              r={5}
              fill={item.net >= 0 ? colors.incomeBg : colors.expenseBg}
              stroke={colors.ink}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
      <View style={[styles.labels, { width }]}>
        {data.map((item) => (
          <View key={item.month} style={{ flex: 1, alignItems: 'center' }}>
            <SText variant="caption2" color={colors.textMuted} numberOfLines={1}>
              {formatMonthLabel(item.month).split(' ')[0]}
            </SText>
            <SText variant="caption2" style={{ fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
              {formatCOP(item.net).replace(/\s/g, '')}
            </SText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.sm, width: '100%' },
  labels: { flexDirection: 'row', marginTop: spacing.sm },
});
