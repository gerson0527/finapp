import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SText from '@/src/components/SText';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import { useTheme } from '@/src/context/ThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { radii, brutalBorder } from '@/src/constants/theme';

interface CategoryChipProps {
  name: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}

export default function CategoryChip({ name, icon, selected, onPress }: CategoryChipProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      chip: {
        width: '31%',
        minHeight: 92,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        paddingHorizontal: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
      },
      chipSelected: {
        backgroundColor: colors.pink,
      },
      iconWrap: {
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
      },
      label: {
        textAlign: 'center',
        width: '100%',
      },
    })
  );

  return (
    <AnimatedPressable
      style={[styles.chip, brutalBorder(2, colors), selected && styles.chipSelected]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon as any} size={22} color={colors.ink} />
      </View>
      <SText
        variant="micro"
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={styles.label}
      >
        {name}
      </SText>
    </AnimatedPressable>
  );
}
