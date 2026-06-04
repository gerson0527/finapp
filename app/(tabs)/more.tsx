import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import AnimatedPressable from '@/src/components/AnimatedPressable';
import BrutalScreen from '@/src/components/BrutalScreen';
import HighlightText from '@/src/components/HighlightText';
import BrutalBox from '@/src/components/BrutalBox';
import { colors, radii, spacing } from '@/src/constants/theme';

export default function MoreScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const menuItems = [
    { icon: 'list' as const, label: 'Categorías', route: '/categories' },
    { icon: 'download-outline' as const, label: 'Exportar datos', route: null },
  ];

  return (
    <BrutalScreen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <HighlightText variant="title1">Más opciones</HighlightText>
        </FadeInView>

        <FadeInView index={1}>
          <BrutalBox bg={colors.yellow} contentStyle={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={28} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <SText variant="headline" style={{ fontWeight: '800' }} numberOfLines={1}>
                {session?.user?.email || 'Usuario'}
              </SText>
              <SText variant="footnote" color={colors.textMuted}>Plan gratuito</SText>
            </View>
          </BrutalBox>
        </FadeInView>

        <FadeInView index={2}>
          <BrutalBox contentStyle={styles.menuCard}>
            {menuItems.map((item, index) => (
              <AnimatedPressable
                key={item.label}
                style={[styles.menuItem, index < menuItems.length - 1 && styles.menuBorder]}
                onPress={item.route ? () => router.push(item.route as any) : undefined}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={20} color={colors.ink} />
                </View>
                <SText variant="body" style={{ flex: 1, fontWeight: '600' }}>{item.label}</SText>
                <SText variant="headline">→</SText>
              </AnimatedPressable>
            ))}
          </BrutalBox>
        </FadeInView>

        <FadeInView index={3}>
          <AnimatedPressable
            onPress={async () => { await supabase.auth.signOut(); router.replace('/(auth)/login'); }}
          >
            <BrutalBox bg={colors.expenseBg} contentStyle={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={20} color={colors.expense} />
              <SText variant="headline" color={colors.expense} style={{ fontWeight: '800', textTransform: 'uppercase' }}>
                Cerrar sesión
              </SText>
            </BrutalBox>
          </AnimatedPressable>
        </FadeInView>

        <SText variant="footnote" color={colors.textMuted} style={styles.version}>FinApp v1.0.0</SText>
      </ScrollView>
    </BrutalScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 14, marginVertical: spacing.xl },
  profileAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.ink,
  },
  menuCard: { overflow: 'hidden', marginBottom: spacing.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: spacing.lg, gap: 14 },
  menuBorder: { borderBottomWidth: 2, borderBottomColor: colors.bgAlt },
  menuIcon: {
    width: 40, height: 40, borderRadius: radii.sm,
    backgroundColor: colors.bgAlt, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.ink,
  },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 10 },
  version: { textAlign: 'center', marginTop: 24, marginBottom: 120 },
});
