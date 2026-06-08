import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  deleteRecurringTemplate,
  getNextRecurrenceLabel,
  getRecurringTemplates,
  setRecurringActive,
  type RecurringTemplate,
} from '@/services/recurringService';
import BrutalScreen from '@/src/components/BrutalScreen';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import HighlightText from '@/src/components/HighlightText';
import SText from '@/src/components/SText';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import FadeInView from '@/src/components/FadeInView';
import { formatCOP } from '@/src/utils/currency';
import { radii, spacing, brutalBorder } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

export default function RecurringScreen() {
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) =>
      StyleSheet.create({
    content: { padding: spacing.xl, paddingBottom: 120 },
    empty: { padding: spacing.xl, alignItems: 'center' },
    card: { padding: spacing.lg, marginBottom: spacing.md },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    catDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.ink },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    toggleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    actionBtn: {
      width: 40,
      height: 40,
      borderRadius: radii.sm,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
  })
    );
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RecurringTemplate[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getRecurringTemplates());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function toggleActive(item: RecurringTemplate) {
    try {
      await setRecurringActive(item.id, !item.is_recurring);
      load();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  }

  function confirmDelete(item: RecurringTemplate) {
    Alert.alert(
      'Eliminar recurrente',
      `¿Eliminar "${item.description}"? No se borrarán los registros ya generados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecurringTemplate(item.id);
              load();
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Gastos recurrentes' }} />
      <BrutalScreen skipTopInset>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <HighlightText variant="title2">Recurrentes</HighlightText>
          <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 6, marginBottom: spacing.lg }}>
            Gastos fijos que se registran automáticamente cada mes.
          </SText>

          <BrutalButton
            label="Nuevo gasto fijo"
            small
            onPress={() => router.push('/(tabs)/add')}
            style={{ marginBottom: spacing.xl }}
          />

          {loading ? (
            <>
              <SkeletonLoader variant="card" />
              <SkeletonLoader variant="card" />
            </>
          ) : items.length === 0 ? (
            <BrutalBox bg={colors.surfaceAlt} contentStyle={styles.empty}>
              <Ionicons name="repeat-outline" size={32} color={colors.textMuted} />
              <SText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: spacing.md }}>
                Aún no tienes gastos fijos. Créalos al registrar un gasto o con el botón de arriba.
              </SText>
            </BrutalBox>
          ) : (
            items.map((item, index) => (
              <FadeInView key={item.id} index={index}>
                <BrutalBox
                  bg={item.is_recurring ? colors.yellow : colors.surfaceAlt}
                  shadow={3}
                  contentStyle={styles.card}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.catDot, { backgroundColor: item.category?.color ?? colors.pink }]} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <SText variant="headline" style={{ fontWeight: '800' }} numberOfLines={1}>
                        {item.description}
                      </SText>
                      <SText variant="caption2" color={colors.textMuted} numberOfLines={1}>
                        {item.category?.name ?? 'Sin categoría'} · {item.account?.name ?? 'Cuenta'}
                      </SText>
                    </View>
                    <SText variant="headline" style={{ fontWeight: '900', flexShrink: 0, maxWidth: '38%' }} numberOfLines={1} adjustsFontSizeToFit>
                      {formatCOP(Number(item.amount))}
                    </SText>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={[styles.metaChip, brutalBorder(undefined, colors)]}>
                      <Ionicons name="calendar-outline" size={14} color={colors.ink} />
                      <SText variant="caption2" style={{ fontWeight: '700' }}>
                        Día {item.recurrence_day ?? 1}
                      </SText>
                    </View>
                    <View style={[styles.metaChip, brutalBorder(undefined, colors)]}>
                      <Ionicons name="arrow-forward-circle-outline" size={14} color={colors.ink} />
                      <SText variant="caption2" style={{ fontWeight: '700' }}>
                        Próximo: {getNextRecurrenceLabel(item.recurrence_day)}
                      </SText>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <View style={styles.toggleRow}>
                      <SText variant="caption2" style={{ fontWeight: '800' }}>Activo</SText>
                      <Switch
                        value={item.is_recurring}
                        onValueChange={() => toggleActive(item)}
                        trackColor={{ false: colors.surfaceAlt, true: colors.pink }}
                        thumbColor={colors.surface}
                      />
                    </View>
                    <AnimatedPressable
                      style={[styles.actionBtn, brutalBorder(undefined, colors)]}
                      onPress={() => router.push(`/transaction/${item.id}` as any)}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.ink} />
                    </AnimatedPressable>
                    <AnimatedPressable
                      style={[styles.actionBtn, brutalBorder(undefined, colors), { backgroundColor: colors.expenseBg }]}
                      onPress={() => confirmDelete(item)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.ink} />
                    </AnimatedPressable>
                  </View>
                </BrutalBox>
              </FadeInView>
            ))
          )}
        </ScrollView>
      </BrutalScreen>
    </>
  );
}

