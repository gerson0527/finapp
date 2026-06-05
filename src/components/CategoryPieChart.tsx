import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import SText from '@/src/components/SText';
import { formatCOP } from '@/src/utils/currency';
import { colors, spacing } from '@/src/constants/theme';
import type { ExpenseByCategory } from '@/services/analyticsService';

interface CategoryPieChartProps {
  data: ExpenseByCategory[];
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export default function CategoryPieChart({ data, size = 160 }: CategoryPieChartProps) {
  const total = data.reduce((s, d) => s + d.total, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  if (total <= 0) {
    return (
      <View style={[styles.empty, { width: size, height: size }]}>
        <SText variant="caption2" color={colors.textMuted}>Sin gastos este mes</SText>
      </View>
    );
  }

  let angle = 0;
  const slices = data.slice(0, 6).map((item) => {
    const sliceAngle = (item.total / total) * 360;
    const path = describeArc(cx, cy, r, angle, angle + sliceAngle);
    angle += sliceAngle;
    return { ...item, path };
  });

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={colors.ink} strokeWidth={2} />
        {slices.map((slice) => (
          <Path key={slice.category_id} d={slice.path} fill={slice.category_color} stroke={colors.ink} strokeWidth={1} />
        ))}
        <Circle cx={cx} cy={cy} r={r * 0.45} fill={colors.surface} stroke={colors.ink} strokeWidth={2} />
      </Svg>
      <View style={styles.legend}>
        {slices.map((slice) => (
          <View key={slice.category_id} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: slice.category_color }]} />
            <SText variant="caption2" style={{ flex: 1 }} numberOfLines={1}>{slice.category_name}</SText>
            <SText variant="caption2" style={{ fontWeight: '800' }}>{formatCOP(slice.total)}</SText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md },
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 80,
    backgroundColor: colors.bgAlt,
  },
  legend: { width: '100%', gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: colors.ink },
});
