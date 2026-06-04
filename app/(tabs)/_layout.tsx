import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Tabs } from 'expo-router';
import BrutalTabBar from '@/src/components/BrutalTabBar';
import { colors } from '@/src/constants/theme';

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, { damping: 12 });
  }, [focused]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
        size={20}
        color={focused ? colors.ink : colors.textMuted}
      />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BrutalTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'Historial', tabBarIcon: ({ focused }) => <TabIcon name="stats-chart" focused={focused} /> }}
      />
      <Tabs.Screen
        name="budgets"
        options={{ title: 'Presup.', tabBarIcon: ({ focused }) => <TabIcon name="wallet" focused={focused} /> }}
      />
      <Tabs.Screen name="add" options={{ href: null, title: '' }} />
      <Tabs.Screen
        name="savings"
        options={{ title: 'Ahorros', tabBarIcon: ({ focused }) => <TabIcon name="flag" focused={focused} /> }}
      />
      <Tabs.Screen
        name="compare"
        options={{ title: 'Comparar', tabBarIcon: ({ focused }) => <TabIcon name="analytics" focused={focused} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'Más', tabBarIcon: ({ focused }) => <TabIcon name="ellipsis-horizontal" focused={focused} /> }}
      />
    </Tabs>
  );
}
