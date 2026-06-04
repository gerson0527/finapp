import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SText from '@/src/components/SText';
import { colors, brutal, brutalBorder } from '@/src/constants/theme';
import { typography } from '@/src/constants/typography';

/** 3 pestañas por lado + hueco central para el + */
const LEFT_TABS = ['index', 'history', 'budgets'] as const;
const RIGHT_TABS = ['savings', 'compare', 'more'] as const;
const ADD_ROUTE = 'add';

const FAB_SIZE = 52;
const FAB_NOTCH = 72;

function AddFab({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  const floatY = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [floatY]);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.06 : 1, { damping: 14 });
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Añadir transacción">
      <Animated.View style={[styles.fabOuter, animStyle]}>
        <View style={styles.fabShadow} />
        <View style={[styles.fab, brutalBorder()]}>
          <Ionicons name="add" size={28} color={colors.ink} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

function TabSlot({
  routeName,
  state,
  descriptors,
  navigation,
}: {
  routeName: string;
  state: BottomTabBarProps['state'];
  descriptors: BottomTabBarProps['descriptors'];
  navigation: BottomTabBarProps['navigation'];
}) {
  const route = state.routes.find((r) => r.name === routeName);
  if (!route) return null;

  const index = state.routes.indexOf(route);
  const focused = state.index === index;
  const { options } = descriptors[route.key];
  const label = options.title ?? route.name;
  const icon = options.tabBarIcon?.({ focused, color: colors.ink, size: 20 });

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <Pressable onPress={onPress} style={styles.tabSlot} accessibilityRole="button" accessibilityLabel={label}>
      {icon}
      <SText
        variant="caption2"
        color={focused ? colors.ink : colors.textMuted}
        numberOfLines={1}
        style={[styles.tabLabel, focused && styles.tabLabelFocused]}
      >
        {label}
      </SText>
    </Pressable>
  );
}

export default function BrutalTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const addFocused = state.routes[state.index]?.name === ADD_ROUTE;
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);

  const openAdd = () => {
    const addRoute = state.routes.find((r) => r.name === ADD_ROUTE);
    if (!addRoute) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: addRoute.key,
      canPreventDefault: true,
    });
    if (!addFocused && !event.defaultPrevented) {
      navigation.navigate(ADD_ROUTE);
    }
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={[styles.fabLayer, { bottom: bottomPad + 38 }]} pointerEvents="box-none">
        <AddFab focused={addFocused} onPress={openAdd} />
      </View>

      <View style={[styles.bar, { paddingBottom: bottomPad }]}>
        <View style={styles.row}>
          <View style={styles.side}>
            {LEFT_TABS.map((name) => (
              <TabSlot key={name} routeName={name} state={state} descriptors={descriptors} navigation={navigation} />
            ))}
          </View>

          <View style={styles.notch} />

          <View style={styles.side}>
            {RIGHT_TABS.map((name) => (
              <TabSlot key={name} routeName={name} state={state} descriptors={descriptors} navigation={navigation} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'visible',
  },
  fabLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  fabOuter: {
    width: FAB_SIZE + brutal.shadowOffset,
    height: FAB_SIZE + brutal.shadowOffset,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  fabShadow: {
    position: 'absolute',
    top: brutal.shadowOffset,
    left: brutal.shadowOffset,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.ink,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    backgroundColor: colors.bg,
    borderTopWidth: brutal.border,
    borderTopColor: colors.ink,
    paddingTop: 10,
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  notch: {
    width: FAB_NOTCH,
    flexShrink: 0,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 1,
    gap: 3,
    minWidth: 0,
  },
  tabLabel: {
    ...typography.tabLabel,
    fontSize: 10,
    textAlign: 'center',
  },
  tabLabelFocused: {
    fontWeight: '700',
  },
});
