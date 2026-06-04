import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { colors } from '@/src/constants/theme';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { AppProvider } from '@/src/context/AppContext';
import MonthlyBalanceGate from '@/src/components/MonthlyBalanceGate';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading, onboardingComplete } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    if (session && onboardingComplete === null) return;

    SplashScreen.hideAsync();

    const inAuth = segments[0] === '(auth)';
    const onOnboarding = segments[1] === 'onboarding';

    if (!session && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }

    if (session && onboardingComplete === false && !onOnboarding) {
      router.replace('/(auth)/onboarding');
      return;
    }

    if (session && onboardingComplete && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, onboardingComplete, segments]);

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
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="savings" options={{ headerShown: true, headerTitle: 'Metas de Ahorro', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerShadowVisible: false }} />
      <Stack.Screen name="categories" options={{ headerShown: true, headerTitle: 'Categorías', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink, headerShadowVisible: false }} />
      <Stack.Screen name="transaction/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
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
