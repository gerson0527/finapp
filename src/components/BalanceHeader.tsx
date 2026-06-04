import React from 'react';
import { View, StyleSheet } from 'react-native';
import { formatCOP } from '@/src/utils/currency';
import SText from '@/src/components/SText';

interface BalanceHeaderProps {
  balance: number;
  label?: string;
  rightElement?: React.ReactNode;
}

export default function BalanceHeader({
  balance,
  label = 'BALANCE TOTAL',
  rightElement,
}: BalanceHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <SText variant="headline" color="#000">JD</SText>
        </View>
      </View>
      <View style={styles.balanceContainer}>
        <SText variant="caption2" color="#888" style={{ letterSpacing: 0.5 }}>{label}</SText>
        <SText variant="largeTitle" color="#AAFF00" style={{ marginTop: 2 }}>{formatCOP(balance)}</SText>
      </View>
      {rightElement ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#AAFF00', justifyContent: 'center', alignItems: 'center' },
  balanceContainer: { flex: 1 },
});
