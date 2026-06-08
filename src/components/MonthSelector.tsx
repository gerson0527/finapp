import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useApp } from '@/src/context/AppContext';
import SText from '@/src/components/SText';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import BrutalBox from '@/src/components/BrutalBox';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { radii } from '@/src/constants/theme';

export default function MonthSelector() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { selectedMonth, setSelectedMonth } = useApp();
  const [visible, setVisible] = useState(false);

  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      selector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 6,
      },
      overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 20 },
      dropdownWrap: { marginBottom: 20 },
      dropdown: { padding: 20, maxHeight: 400 },
      item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
      selectedItem: { backgroundColor: colors.pinkLight, marginHorizontal: -12, paddingHorizontal: 12, borderRadius: radii.sm },
      radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 3,
        borderColor: colors.ink,
        justifyContent: 'center',
        alignItems: 'center',
      },
      radioActive: { backgroundColor: colors.pink },
      radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink },
    })
  );

  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: es }),
    });
  }

  const d = parse(`${selectedMonth}-01`, 'yyyy-MM-dd', new Date());
  const currentLabel = format(d, "MMM ''yy", { locale: es });

  return (
    <View>
      <AnimatedPressable onPress={() => setVisible(true)}>
        <BrutalBox bg={colors.yellow} radius={radii.pill} shadow={3} contentStyle={styles.selector}>
          <Ionicons name="calendar" size={14} color={colors.ink} />
          <SText variant="caption1" style={{ fontWeight: '600', letterSpacing: 0.2 }}>{currentLabel}</SText>
        </BrutalBox>
      </AnimatedPressable>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            style={[styles.dropdownWrap, { marginBottom: Math.max(insets.bottom, 20) }]}
          >
            <BrutalBox bg={colors.surface} radius={radii.xl} contentStyle={styles.dropdown}>
              <SText variant="headline" style={{ fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 }}>
                Mes
              </SText>
              <FlatList
                data={months}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => {
                  const selected = item.value === selectedMonth;
                  return (
                    <AnimatedPressable
                      style={[styles.item, selected && styles.selectedItem]}
                      onPress={() => { setSelectedMonth(item.value); setVisible(false); }}
                    >
                      <View style={[styles.radio, selected && styles.radioActive]}>
                        {selected && <View style={styles.radioDot} />}
                      </View>
                      <SText variant="body" style={{ fontWeight: selected ? '800' : '400' }}>{item.label}</SText>
                    </AnimatedPressable>
                  );
                }}
              />
            </BrutalBox>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
