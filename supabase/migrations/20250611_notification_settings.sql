-- Preferencias de notificaciones locales por usuario
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_reminder_enabled BOOLEAN DEFAULT TRUE,
  daily_reminder_time TIME DEFAULT '20:00',
  budget_alerts_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_settings_own" ON notification_settings;
CREATE POLICY "notification_settings_own" ON notification_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
