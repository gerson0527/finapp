import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useChartWidth } from '@/src/hooks/useChartWidth';
import Svg, { Rect } from 'react-native-svg';
import SText from '@/src/components/SText';
import { formatMonthLabel } from '@/lib/month';
import { formatCOP } from '@/src/utils/currency';
import { colors, spacing } from '@/src/constants/theme';
import type { ExpenseByMonth } from '@/services/analyticsService';

interface ExpenseBarChartProps {
  data: ExpenseByMonth[];
  height?: number;
}

export default function ExpenseBarChart({ data, height = 160 }: ExpenseBarChartProps) {
  const maxWidth = useChartWidth();
  const max = Math.max(...data.map((d) => d.total), 1);
  const gap = 12;
  const barWidth = data.length > 0
    ? Math.min(28, Math.max(18, Math.floor((maxWidth - gap) / data.length - gap)))
    : 28;
  const chartWidth = data.length * (barWidth + gap);
  const scrollable = chartWidth > maxWidth;

  const chart = (
    <>
      <Svg width={chartWidth} height={height}>
        {data.map((item, i) => {
          const barHeight = Math.max((item.total / max) * (height - 24), item.total > 0 ? 6 : 0);
          const x = i * (barWidth + gap);
          const y = height - barHeight - 8;
          return (
            <Rect
              key={item.month}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={colors.pink}
              stroke={colors.ink}
              strokeWidth={2}
              rx={4}
            />
          );
        })}
      </Svg>
      <View style={[styles.labels, { width: chartWidth }]}>
        {data.map((item) => (
          <View key={item.month} style={{ width: barWidth + gap, alignItems: 'center' }}>
            <SText variant="caption2" color={colors.textMuted} numberOfLines={1}>
              {formatMonthLabel(item.month).split(' ')[0]}
            </SText>
            <SText variant="caption2" style={{ fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
              {item.total > 0 ? formatCOP(item.total).replace(/\s/g, '') : '-'}
            </SText>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <View style={styles.wrap}>
      {scrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {chart}
        </ScrollView>
      ) : (
        chart
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.sm, width: '100%' },
  scrollContent: { alignItems: 'center' },
  labels: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
});
