import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { colors } from '@/src/constants/theme';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { AppProvider } from '@/src/context/AppContext';
import MonthlyBalanceGate from '@/src/components/MonthlyBalanceGate';
import { initNotifications } from '@/services/notificationService';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading, onboardingComplete, pendingWelcome } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    if (session && onboardingComplete === null) return;

    SplashScreen.hideAsync();

    const inAuth = segments[0] === '(auth)';
    const onOnboarding = segments[0] === 'onboarding';
    const onWelcome = segments[0] === 'welcome';

    if (!session && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }

    if (session && onboardingComplete === false && !onOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (session && onboardingComplete && pendingWelcome && !onWelcome) {
      router.replace('/welcome');
      return;
    }

    if (session && onboardingComplete && !pendingWelcome && (inAuth || onOnboarding || onWelcome)) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, onboardingComplete, pendingWelcome, segments]);

  if (isLoading || (session && onboardingComplete === null)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="savings" options={{ headerShown: true, headerTitle: 'Metas de Ahorro', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerShadowVisible: false }} />
      <Stack.Screen name="categories" options={{ headerShown: true, headerTitle: 'Categorías', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerShadowVisible: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="analytics" options={{ headerShown: true, headerTitle: 'Analytics', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerShadowVisible: false }} />
      <Stack.Screen name="accounts" options={{ headerShown: true, headerTitle: 'Cuentas', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerShadowVisible: false }} />
      <Stack.Screen name="recurring" options={{ headerShown: true, headerTitle: 'Gastos recurrentes', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerShadowVisible: false }} />
      <Stack.Screen name="notifications-settings" options={{ headerShown: true, headerTitle: 'Notificaciones', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerShadowVisible: false }} />
      <Stack.Screen name="transaction/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    initNotifications().catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <MonthlyBalanceGate>
          <RootNavigator />
        </MonthlyBalanceGate>
      </AppProvider>
    </AuthProvider>
  );
}
