import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId, getCurrentUserIdOrNull } from '@/lib/getCurrentUser';
import { getBudgets, type BudgetWithSpent } from '@/services/budgetService';
import { formatCOP } from '@/src/utils/currency';

const DAILY_REMINDER_ID = 'finapp-daily-reminder';
const ALERTS_STORAGE_KEY = '@finapp/budget_alerts_sent';

export interface NotificationSettings {
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  budget_alerts_enabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  daily_reminder_enabled: true,
  daily_reminder_time: '20:00',
  budget_alerts_enabled: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h || 20, minute: m || 0 };
}

async function getSentAlerts(month: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(`${ALERTS_STORAGE_KEY}_${month}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function markAlertSent(month: string, budgetId: string): Promise<void> {
  const sent = await getSentAlerts(month);
  sent.add(budgetId);
  await AsyncStorage.setItem(`${ALERTS_STORAGE_KEY}_${month}`, JSON.stringify([...sent]));
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) return DEFAULT_SETTINGS;

  const { data, error } = await supabase
    .from('notification_settings')
    .select('daily_reminder_enabled, daily_reminder_time, budget_alerts_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;

  return {
    daily_reminder_enabled: data.daily_reminder_enabled ?? true,
    daily_reminder_time: String(data.daily_reminder_time ?? '20:00').slice(0, 5),
    budget_alerts_enabled: data.budget_alerts_enabled ?? true,
  };
}

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase.from('notification_settings').upsert(
    {
      user_id: userId,
      daily_reminder_enabled: settings.daily_reminder_enabled,
      daily_reminder_time: settings.daily_reminder_time,
      budget_alerts_enabled: settings.budget_alerts_enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw new Error(error.message);
  await applyNotificationSchedule(settings);
}

export async function applyNotificationSchedule(
  settings?: NotificationSettings
): Promise<void> {
  if (Platform.OS === 'web') return;

  const cfg = settings ?? (await getNotificationSettings());

  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});

  if (!cfg.daily_reminder_enabled) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const { hour, minute } = parseTime(cfg.daily_reminder_time);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'FinApp',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'FinApp',
      body: '¿Registraste tus gastos hoy?',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

async function notifyBudgetThreshold(budget: BudgetWithSpent): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Presupuesto al 80%',
      body: `"${budget.title}" lleva ${Number(budget.percentage).toFixed(0)}% usado (${formatCOP(Number(budget.spent))} de ${formatCOP(Number(budget.limit_amount))}).`,
      sound: true,
    },
    trigger: null,
  });
}

export async function checkBudgetAlertsAfterExpense(
  month: string,
  opts: { budgetId?: string; categoryId?: string }
): Promise<void> {
  if (Platform.OS === 'web') return;

  const settings = await getNotificationSettings();
  if (!settings.budget_alerts_enabled) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const budgets = await getBudgets(month);
  const relevant = budgets.filter((b) => {
    if (opts.budgetId) return b.id === opts.budgetId;
    if (opts.categoryId) return b.category_id === opts.categoryId;
    return false;
  });

  const sent = await getSentAlerts(month);

  for (const budget of relevant) {
    if (Number(budget.percentage) < 80 || sent.has(budget.id)) continue;
    await notifyBudgetThreshold(budget);
    await markAlertSent(month, budget.id);
  }
}

export async function initNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const settings = await getNotificationSettings();
  await applyNotificationSchedule(settings);
}
