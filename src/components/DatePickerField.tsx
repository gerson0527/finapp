import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, View, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import SText from '@/src/components/SText';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

interface DatePickerFieldProps {
  value: Date;
  onChange: (date: Date) => void;
}

function parseDateInput(text: string): Date | null {
  if (!text) return null;
  const parsed = parseISO(text);
  return isValid(parsed) ? parsed : null;
}

export default function DatePickerField({ value, onChange }: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const dateStr = format(value, 'yyyy-MM-dd');
  const displayDate = format(value, "d 'de' MMMM, yyyy", { locale: es });

  function handleChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) onChange(selected);
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.inputWrap, brutalBorder(2)]}>
        <Ionicons name="calendar-outline" size={20} color={colors.ink} />
        <TextInput
          style={styles.webInput}
          value={dateStr}
          onChangeText={(t) => {
            const parsed = parseDateInput(t);
            if (parsed) onChange(parsed);
          }}
          {...({ type: 'date' } as object)}
        />
      </View>
    );
  }

  return (
    <>
      <AnimatedPressable onPress={() => setShowPicker(true)}>
        <View style={[styles.inputWrap, brutalBorder(2)]}>
          <Ionicons name="calendar-outline" size={20} color={colors.ink} />
          <SText variant="body" style={styles.displayText}>{displayDate}</SText>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </View>
      </AnimatedPressable>

      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent animationType="slide" visible={showPicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.iosSheet}>
              <View style={styles.iosHeader}>
                <AnimatedPressable onPress={() => setShowPicker(false)}>
                  <SText variant="callout" color={colors.pink} style={{ fontWeight: '700' }}>Listo</SText>
                </AnimatedPressable>
              </View>
              <DateTimePicker
                value={value}
                mode="date"
                display="spinner"
                locale="es-ES"
                onChange={handleChange}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: 10,
  },
  displayText: {
    flex: 1,
    fontWeight: '600',
  },
  webInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const, outlineStyle: 'none' as const } : {}),
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  iosSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: 24,
  },
  iosHeader: {
    alignItems: 'flex-end',
    padding: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: colors.bgAlt,
  },
});
