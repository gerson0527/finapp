import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack } from 'expo-router';
import {
  getNotificationSettings,
  requestNotificationPermissions,
  saveNotificationSettings,
  type NotificationSettings,
} from '@/services/notificationService';
import BrutalScreen from '@/src/components/BrutalScreen';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import AuthFeedback from '@/src/components/AuthFeedback';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

function timeToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 20, m || 0, 0, 0);
  return d;
}

function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function NotificationsSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    daily_reminder_enabled: true,
    daily_reminder_time: '20:00',
    budget_alerts_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    getNotificationSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      if (Platform.OS !== 'web') {
        const granted = await requestNotificationPermissions();
        if (!granted && (settings.daily_reminder_enabled || settings.budget_alerts_enabled)) {
          setFeedback({
            type: 'error',
            message: 'Activa los permisos de notificación en ajustes del dispositivo.',
          });
          setSaving(false);
          return;
        }
      }
      await saveNotificationSettings(settings);
      setFeedback({ type: 'success', message: 'Preferencias guardadas.' });
    } catch (e: unknown) {
      setFeedback({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Notificaciones' }} />
      <BrutalScreen showDecor={false} skipTopInset>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeInView>
            <SText variant="body" color={colors.textSecondary} style={styles.intro}>
              Recibe avisos cuando un presupuesto supere el 80 % y un recordatorio diario para registrar tus gastos.
            </SText>
          </FadeInView>

          {feedback ? <AuthFeedback type={feedback.type} message={feedback.message} /> : null}

          <FadeInView index={1}>
            <BrutalBox shadow={4} contentStyle={styles.row}>
              <View style={{ flex: 1 }}>
                <SText variant="headline" style={{ fontWeight: '800' }}>Alertas de presupuesto</SText>
                <SText variant="caption2" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Aviso al superar el 80 % al registrar un gasto
                </SText>
              </View>
              <Switch
                value={settings.budget_alerts_enabled}
                onValueChange={(v) => setSettings((s) => ({ ...s, budget_alerts_enabled: v }))}
                trackColor={{ false: colors.surfaceAlt, true: colors.pink }}
                thumbColor={colors.surface}
                disabled={loading}
              />
            </BrutalBox>

            <BrutalBox shadow={4} contentStyle={styles.row}>
              <View style={{ flex: 1 }}>
                <SText variant="headline" style={{ fontWeight: '800' }}>Recordatorio diario</SText>
                <SText variant="caption2" color={colors.textMuted} style={{ marginTop: 4 }}>
                  ¿Registraste tus gastos hoy?
                </SText>
              </View>
              <Switch
                value={settings.daily_reminder_enabled}
                onValueChange={(v) => setSettings((s) => ({ ...s, daily_reminder_enabled: v }))}
                trackColor={{ false: colors.surfaceAlt, true: colors.pink }}
                thumbColor={colors.surface}
                disabled={loading}
              />
            </BrutalBox>

            {settings.daily_reminder_enabled ? (
              <AnimatedPressable
                style={[styles.timeBtn, brutalBorder()]}
                onPress={() => setShowPicker(true)}
              >
                <SText variant="footnote" style={{ fontWeight: '800' }}>Hora del recordatorio</SText>
                <SText variant="title3" style={{ fontWeight: '900' }}>{settings.daily_reminder_time}</SText>
              </AnimatedPressable>
            ) : null}

            {showPicker ? (
              <DateTimePicker
                value={timeToDate(settings.daily_reminder_time)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  if (Platform.OS !== 'ios') setShowPicker(false);
                  if (date) setSettings((s) => ({ ...s, daily_reminder_time: dateToTime(date) }));
                }}
              />
            ) : null}

            {Platform.OS === 'web' ? (
              <BrutalBox bg={colors.surfaceAlt} contentStyle={{ padding: spacing.lg, marginTop: spacing.md }}>
                <SText variant="footnote" color={colors.textSecondary}>
                  Las notificaciones locales solo están disponibles en iOS y Android.
                </SText>
              </BrutalBox>
            ) : null}
          </FadeInView>

          <FadeInView index={2}>
            <BrutalButton
              label={saving ? 'Guardando...' : 'Guardar preferencias'}
              onPress={handleSave}
              disabled={saving || loading}
            />
          </FadeInView>
        </ScrollView>
      </BrutalScreen>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: 120, gap: spacing.lg },
  intro: { lineHeight: 22, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  timeBtn: {
    backgroundColor: colors.yellow,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
});
