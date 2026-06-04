import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/services/transactionService';
import { formatCOP } from '@/src/utils/currency';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import { colors, radii } from '@/src/constants/theme';

interface TransactionItemProps {
  transaction: Transaction;
  showDate?: boolean;
  showTime?: boolean;
  index?: number;
  onPress?: () => void;
}

export default function TransactionItem({
  transaction,
  showDate = false,
  showTime = true,
  index = 0,
  onPress,
}: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const cat = transaction.category;

  const dateObj = parseISO(transaction.date);
  const dateStr = format(dateObj, 'd MMM', { locale: es });
  const timeStr = transaction.time?.slice(0, 5);

  const title = transaction.note || cat?.name || transaction.description;
  const subtitleParts = [
    transaction.note ? cat?.name : null,
    showDate ? dateStr : null,
    showTime ? timeStr : null,
  ].filter(Boolean);

  const content = (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: cat?.color || colors.yellow }]}>
        <Ionicons name={(cat?.icon as any) || 'ellipse'} size={20} color={colors.ink} />
      </View>
      <View style={styles.info}>
        <SText variant="body" numberOfLines={1} style={{ fontWeight: '600' }}>
          {title}
        </SText>
        {subtitleParts.length > 0 && (
          <SText variant="caption2" color={colors.textMuted} style={{ marginTop: 3 }}>
            {subtitleParts.join(' · ')}
          </SText>
        )}
      </View>
      <View style={[styles.amountBadge, { backgroundColor: isIncome ? colors.incomeBg : colors.expenseBg }]}>
        <SText variant="amountSmall" color={isIncome ? '#15803D' : colors.expense}>
          {isIncome ? '+' : '-'}{formatCOP(transaction.amount)}
        </SText>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
      )}
    </View>
  );

  return (
    <FadeInView index={index}>
      {onPress ? (
        <AnimatedPressable onPress={onPress} haptic={false}>
          {content}
        </AnimatedPressable>
      ) : (
        content
      )}
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.bgAlt,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  info: { flex: 1, marginLeft: 12 },
  amountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
    marginLeft: 8,
    borderWidth: 2,
    borderColor: colors.ink,
  },
});
