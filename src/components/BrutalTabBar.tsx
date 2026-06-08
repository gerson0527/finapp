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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SText from '@/src/components/SText';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { brutal, brutalBorder } from '@/src/constants/theme';
import { typography } from '@/src/constants/typography';

type TabRoute = { key: string; name: string };

type BrutalTabBarProps = {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<
    string,
    {
      options: {
        title?: string;
        tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
      };
    }
  >;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

const LEFT_TABS = ['index', 'history', 'budgets'] as const;
const RIGHT_TABS = ['savings', 'compare', 'more'] as const;
const ADD_ROUTE = 'add';

const FAB_SIZE = 52;
const FAB_NOTCH = 72;

function AddFab({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  const { colors } = useTheme();
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
        <View style={[styles.fabShadow, { backgroundColor: colors.shadow }]} />
        <View style={[styles.fab, brutalBorder(brutal.border, colors), { backgroundColor: colors.yellow }]}>
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
  state: BrutalTabBarProps['state'];
  descriptors: BrutalTabBarProps['descriptors'];
  navigation: BrutalTabBarProps['navigation'];
}) {
  const { colors } = useTheme();
  const route = state.routes.find((r: TabRoute) => r.name === routeName);
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

export default function BrutalTabBar({ state, descriptors, navigation }: BrutalTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const barStyles = useThemedStyles((c) =>
    StyleSheet.create({
      bar: {
        backgroundColor: c.bg,
        borderTopWidth: brutal.border,
        borderTopColor: c.ink,
        paddingTop: 10,
        overflow: 'visible',
      },
    })
  );

  const addFocused = state.routes[state.index]?.name === ADD_ROUTE;
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);

  const openAdd = () => {
    const addRoute = state.routes.find((r: TabRoute) => r.name === ADD_ROUTE);
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

      <View style={[barStyles.bar, { paddingBottom: bottomPad }]}>
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
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
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
