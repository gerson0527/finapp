import { Stack } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800' },
      }}
    />
  );
}
