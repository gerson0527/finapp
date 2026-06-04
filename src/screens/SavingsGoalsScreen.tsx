import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { addContribution, createSavingsGoal } from '@/services/savingsService';
import SavingsGoalCard from '@/src/components/SavingsGoalCard';
import SkeletonLoader from '@/src/components/SkeletonLoader';
import SText from '@/src/components/SText';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import HighlightText from '@/src/components/HighlightText';
import FadeInView from '@/src/components/FadeInView';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

const presetIcons = ['airplane', 'shield-checkmark', 'laptop', 'home', 'car', 'heart', 'school', 'gift'];
const presetColors = ['#4A9EFF', colors.yellowDark, colors.pink, colors.warning, '#A855F7', '#FF69B4', '#00D4AA', '#FF8C00'];

interface SavingsGoalsScreenProps {
  showAddButton?: boolean;
}

export default function SavingsGoalsScreen({ showAddButton }: SavingsGoalsScreenProps) {
  const goals = useSavingsGoals();
  const [showCreate, setShowCreate] = useState(false);
  const [showContribute, setShowContribute] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('airplane');
  const [selectedColor, setSelectedColor] = useState('#4A9EFF');
  const [contributeAmount, setContributeAmount] = useState('');

  async function handleCreate() {
    if (!title.trim() || !targetAmount) {
      Alert.alert('Error', 'Completa nombre y monto objetivo');
      return;
    }
    try {
      await createSavingsGoal({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
        target_amount: parseFloat(targetAmount),
      });
      goals.refresh();
      setShowCreate(false);
      setTitle('');
      setSubtitle('');
      setTargetAmount('');
      setSelectedIcon('airplane');
      setSelectedColor('#4A9EFF');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleContribute(goalId: string) {
    const amount = parseFloat(contributeAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    try {
      await addContribution(goalId, amount);
      goals.refresh();
      setShowContribute(null);
      setContributeAmount('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <View style={styles.container}>
      {showAddButton ? (
        <View style={styles.headerAction}>
          <AnimatedPressable onPress={() => setShowCreate(true)} style={{ alignSelf: 'flex-end' }}>
            <BrutalBox bg={colors.yellow} radius={radii.md} shadow={3} contentStyle={styles.headerAddBtn}>
              <Ionicons name="add" size={26} color={colors.ink} />
            </BrutalBox>
          </AnimatedPressable>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <HighlightText variant="title2">Tus metas</HighlightText>
          <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 8, marginBottom: spacing.lg }}>
            Ahorra para lo que más te importa
          </SText>
        </FadeInView>

        {goals.loading ? (
          Array.from({ length: 2 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)
        ) : goals.data.length === 0 ? (
          <FadeInView index={1}>
            <BrutalBox contentStyle={styles.emptyState}>
              <Ionicons name="flag-outline" size={40} color={colors.textMuted} />
              <SText variant="headline" style={{ fontWeight: '700', marginTop: 12 }}>Sin metas aún</SText>
              <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 6, textAlign: 'center' }}>
                Toca + para crear tu primera meta
              </SText>
            </BrutalBox>
          </FadeInView>
        ) : (
          goals.data.map((g, i) => (
            <SavingsGoalCard key={g.id} goal={g} index={i + 1} onContribute={() => setShowContribute(g.id)} />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInDown.springify().damping(20)} style={{ padding: 20 }}>
            <BrutalBox contentStyle={styles.modalContent}>
              <SText variant="title3" style={{ fontWeight: '700', marginBottom: spacing.lg }}>Nueva meta</SText>

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Nombre</SText>
              <TextInput
                style={[styles.input, brutalBorder(2)]}
                placeholder="Viaje, emergencia..."
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Descripción (opcional)</SText>
              <TextInput
                style={[styles.input, brutalBorder(2)]}
                placeholder="Fondo de vacaciones"
                placeholderTextColor={colors.textMuted}
                value={subtitle}
                onChangeText={setSubtitle}
              />

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Monto objetivo (COP)</SText>
              <TextInput
                style={[styles.input, brutalBorder(2)]}
                placeholder="3000000"
                placeholderTextColor={colors.textMuted}
                value={targetAmount}
                onChangeText={(t) => setTargetAmount(t.replace(/[^0-9]/g, ''))}
                keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
              />

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Icono</SText>
              <View style={styles.iconRow}>
                {presetIcons.map((ic) => (
                  <AnimatedPressable
                    key={ic}
                    style={[styles.iconItem, brutalBorder(2), selectedIcon === ic && { backgroundColor: colors.yellow }]}
                    onPress={() => setSelectedIcon(ic)}
                  >
                    <Ionicons name={ic as any} size={22} color={colors.ink} />
                  </AnimatedPressable>
                ))}
              </View>

              <SText variant="caption1" color={colors.textMuted} style={styles.fieldLabel}>Color</SText>
              <View style={styles.iconRow}>
                {presetColors.map((clr) => (
                  <AnimatedPressable
                    key={clr}
                    style={[
                      styles.colorItem,
                      { backgroundColor: clr },
                      brutalBorder(2),
                      selectedColor === clr && { borderColor: colors.ink, borderWidth: 3 },
                    ]}
                    onPress={() => setSelectedColor(clr)}
                  />
                ))}
              </View>

              <View style={styles.modalActions}>
                <AnimatedPressable style={[styles.cancelBtn, brutalBorder(2)]} onPress={() => setShowCreate(false)}>
                  <SText variant="callout" style={{ fontWeight: '600' }}>Cancelar</SText>
                </AnimatedPressable>
                <View style={{ flex: 1 }}>
                  <BrutalButton label="Crear meta" onPress={handleCreate} disabled={!title || !targetAmount} small />
                </View>
              </View>
            </BrutalBox>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={!!showContribute} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInDown.springify().damping(20)} style={{ padding: 20 }}>
            <BrutalBox bg={colors.yellow} contentStyle={styles.modalContent}>
              <SText variant="title3" style={{ fontWeight: '700', marginBottom: spacing.lg, textAlign: 'center' }}>
                Aportar a meta
              </SText>
              <View style={styles.amountRow}>
                <SText variant="title1" style={{ fontWeight: '700' }}>$</SText>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={contributeAmount}
                  onChangeText={(t) => setContributeAmount(t.replace(/[^0-9]/g, ''))}
                  keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                  autoFocus
                />
              </View>
              {contributeAmount.length > 0 && (
                <SText variant="footnote" color={colors.textSecondary} style={{ textAlign: 'center', marginBottom: spacing.md }}>
                  {parseInt(contributeAmount, 10).toLocaleString('es-CO')} COP
                </SText>
              )}
              <View style={styles.modalActions}>
                <AnimatedPressable
                  style={[styles.cancelBtn, brutalBorder(2)]}
                  onPress={() => {
                    setShowContribute(null);
                    setContributeAmount('');
                  }}
                >
                  <SText variant="callout" style={{ fontWeight: '600' }}>Cancelar</SText>
                </AnimatedPressable>
                <View style={{ flex: 1 }}>
                  <BrutalButton
                    label="Aportar"
                    onPress={() => showContribute && handleContribute(showContribute)}
                    disabled={!contributeAmount}
                    small
                  />
                </View>
              </View>
            </BrutalBox>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerAction: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, alignItems: 'flex-end' },
  headerAddBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xs },
  emptyState: { padding: spacing.xxxl, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { padding: spacing.xl },
  fieldLabel: { marginBottom: 6, marginTop: spacing.sm, textTransform: 'uppercase', fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 15,
  },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.sm },
  iconItem: {
    width: 46,
    height: 46,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorItem: { width: 36, height: 36, borderRadius: 18 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: spacing.lg, alignItems: 'center' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.ink,
    minWidth: 120,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as const } : {}),
  },
});
