import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/src/context/AppContext';
import { getRecentMonths } from '@/lib/month';
import { exportMonthCsv, exportMonthPdf } from '@/services/exportService';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import SText from '@/src/components/SText';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExportModal({ visible, onClose }: ExportModalProps) {
  const { selectedMonth } = useApp();
  const [month, setMonth] = useState(selectedMonth);
  const [loading, setLoading] = useState<'csv' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const months = getRecentMonths(12);

  async function handleExport(format: 'csv' | 'pdf') {
    setLoading(format);
    setError(null);
    try {
      if (format === 'csv') await exportMonthCsv(month);
      else await exportMonthPdf(month);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View entering={SlideInDown.springify().damping(20)} style={styles.sheetWrap}>
          <TouchableOpacity activeOpacity={1}>
            <BrutalBox bg={colors.surface} radius={radii.xl} shadow={4} contentStyle={styles.sheet}>
              <View style={styles.header}>
                <SText variant="headline" style={{ fontWeight: '900' }}>Exportar datos</SText>
                <AnimatedPressable onPress={onClose} style={[styles.closeBtn, brutalBorder()]}>
                  <Ionicons name="close" size={18} color={colors.ink} />
                </AnimatedPressable>
              </View>

              <SText variant="footnote" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
                Elige el mes y el formato. CSV para Excel; PDF con resumen y presupuestos.
              </SText>

              <SText variant="caption1" color={colors.textMuted} style={styles.label}>MES</SText>
              <FlatList
                data={months}
                keyExtractor={(item) => item.value}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: spacing.lg }}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => {
                  const selected = item.value === month;
                  return (
                    <AnimatedPressable
                      style={[styles.monthChip, brutalBorder(), selected && styles.monthChipActive]}
                      onPress={() => setMonth(item.value)}
                    >
                      <SText variant="caption2" style={{ fontWeight: '800' }}>{item.label}</SText>
                    </AnimatedPressable>
                  );
                }}
              />

              {error ? (
                <View style={[styles.errorBox, brutalBorder()]}>
                  <SText variant="footnote" color={colors.expense}>{error}</SText>
                </View>
              ) : null}

              <View style={styles.actions}>
                <BrutalButton
                  label={loading === 'csv' ? 'Generando...' : 'CSV'}
                  variant="white"
                  small
                  disabled={!!loading}
                  onPress={() => handleExport('csv')}
                  style={{ flex: 1 }}
                />
                <BrutalButton
                  label={loading === 'pdf' ? 'Generando...' : 'PDF'}
                  small
                  disabled={!!loading}
                  onPress={() => handleExport('pdf')}
                  style={{ flex: 1 }}
                />
              </View>

              {loading ? (
                <ActivityIndicator color={colors.ink} style={{ marginTop: spacing.md }} />
              ) : null}
            </BrutalBox>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  sheetWrap: { marginBottom: spacing.lg },
  sheet: { padding: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontWeight: '800', letterSpacing: 0.5, marginBottom: spacing.sm },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
  },
  monthChipActive: { backgroundColor: colors.yellow },
  errorBox: {
    backgroundColor: colors.expenseBg,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
});
