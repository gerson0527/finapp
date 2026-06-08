import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '@/services/transactionService';
import { getTransactionSourceLabel } from '@/lib/transactionHelpers';
import { formatCOP } from '@/src/utils/currency';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { radii } from '@/src/constants/theme';

interface TransactionItemProps {
  transaction: Transaction;
  showDate?: boolean;
  showTime?: boolean;
  index?: number;
  onPress?: () => void;
  readOnly?: boolean;
}

export default function TransactionItem({
  transaction,
  showDate = false,
  showTime = true,
  index = 0,
  onPress,
  readOnly = false,
}: TransactionItemProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
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
      info: { flex: 1, marginLeft: 12, minWidth: 0 },
      amountBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radii.sm,
        marginLeft: 8,
        borderWidth: 2,
        borderColor: colors.ink,
        flexShrink: 0,
        maxWidth: '42%',
      },
    })
  );

  const isIncome = transaction.type === 'income';
  const cat = transaction.category;

  const dateObj = parseISO(transaction.date);
  const dateStr = format(dateObj, 'd MMM', { locale: es });
  const timeStr = transaction.time?.slice(0, 5);

  const title = transaction.description || cat?.name || transaction.note || 'Movimiento';
  const sourceLabel = getTransactionSourceLabel(transaction);
  const subtitleParts = [
    sourceLabel,
    cat?.name && cat.name !== title ? cat.name : null,
    transaction.note && transaction.note !== title ? transaction.note : null,
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
          <SText variant="caption2" color={colors.textMuted} style={{ marginTop: 3 }} numberOfLines={1}>
            {subtitleParts.join(' · ')}
          </SText>
        )}
      </View>
      <View style={[styles.amountBadge, { backgroundColor: isIncome ? colors.incomeBg : colors.expenseBg }]}>
        <SText variant="amountSmall" color={isIncome ? '#15803D' : colors.expense} numberOfLines={1} adjustsFontSizeToFit>
          {isIncome ? '+' : '-'}{formatCOP(transaction.amount)}
        </SText>
      </View>
      {onPress ? (
        <Ionicons
          name={readOnly ? 'information-circle-outline' : 'chevron-forward'}
          size={readOnly ? 18 : 16}
          color={colors.textMuted}
          style={{ marginLeft: 6 }}
        />
      ) : null}
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
