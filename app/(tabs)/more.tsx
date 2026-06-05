import React, { useMemo, useState } from 'react';
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
import ExportModal from '@/src/components/ExportModal';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  route: string | null;
  iconBg: string;
};

function getInitials(name?: string, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (!email) return '?';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || '?';
}

function MenuRow({
  item,
  onPress,
  disabled,
}: {
  item: MenuItem;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <AnimatedPressable
      style={[styles.menuItem, disabled && styles.menuItemDisabled]}
      onPress={disabled ? undefined : onPress}
    >
      <View style={[styles.menuIcon, brutalBorder(2), { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={20} color={colors.ink} />
      </View>
      <View style={styles.menuText}>
        <SText variant="body" style={{ fontWeight: '800' }}>{item.label}</SText>
        <SText variant="caption2" color={colors.textMuted} style={{ marginTop: 2 }}>
          {item.subtitle}
        </SText>
      </View>
      {disabled ? (
        <View style={[styles.soonBadge, brutalBorder(2)]}>
          <SText variant="caption2" style={{ fontWeight: '800' }}>Pronto</SText>
        </View>
      ) : (
        <View style={[styles.chevron, brutalBorder(2)]}>
          <Ionicons name="chevron-forward" size={16} color={colors.ink} />
        </View>
      )}
    </AnimatedPressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [exportVisible, setExportVisible] = useState(false);

  const email = session?.user?.email ?? 'Usuario';
  const displayName = String(session?.user?.user_metadata?.display_name ?? '').trim();
  const initials = useMemo(
    () => getInitials(displayName, session?.user?.email),
    [displayName, session?.user?.email]
  );

  const accountItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Sobre mí',
      subtitle: 'Nombre, bio y datos de tu cuenta',
      route: '/settings/profile',
      iconBg: colors.yellow,
    },
    {
      icon: 'mail-outline',
      label: 'Correo electrónico',
      subtitle: 'Cambiar tu correo de acceso',
      route: '/settings/email',
      iconBg: colors.surfaceAlt,
    },
    {
      icon: 'lock-closed-outline',
      label: 'Contraseña',
      subtitle: 'Actualizar tu clave de acceso',
      route: '/settings/password',
      iconBg: colors.expenseBg,
    },
    {
      icon: 'wallet-outline',
      label: 'Ingreso mensual',
      subtitle: 'Tu referencia para planear el mes',
      route: '/settings/income',
      iconBg: colors.incomeBg,
    },
  ];

  const menuItems: MenuItem[] = [
    {
      icon: 'analytics-outline',
      label: 'Analytics',
      subtitle: 'Gastos por mes y categorías',
      route: '/analytics',
      iconBg: colors.pink,
    },
    {
      icon: 'wallet-outline',
      label: 'Cuentas',
      subtitle: 'Todas tus cuentas y balances',
      route: '/accounts',
      iconBg: colors.yellow,
    },
    {
      icon: 'grid-outline',
      label: 'Categorías',
      subtitle: 'Organiza ingresos y gastos',
      route: '/categories',
      iconBg: colors.yellow,
    },
    {
      icon: 'pie-chart-outline',
      label: 'Presupuestos',
      subtitle: 'Límites de gym, Netflix y más',
      route: '/(tabs)/budgets',
      iconBg: colors.pink,
    },
    {
      icon: 'download-outline',
      label: 'Exportar datos',
      subtitle: 'CSV o PDF de tu historial',
      route: 'export',
      iconBg: colors.incomeBg,
    },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  return (
    <BrutalScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <HighlightText variant="title2">Más opciones</HighlightText>
              <SText variant="footnote" color={colors.textMuted} style={{ marginTop: 6 }}>
                Cuenta, ajustes y herramientas
              </SText>
            </View>
          </View>
        </FadeInView>

        <FadeInView index={1}>
          <AnimatedPressable onPress={() => router.push('/settings/profile' as any)}>
            <BrutalBox bg={colors.yellow} shadow={4} contentStyle={styles.profileCard}>
              <View style={[styles.profileAvatar, brutalBorder(2)]}>
                <SText variant="title3" style={{ fontWeight: '900' }}>{initials}</SText>
              </View>
              <View style={styles.profileInfo}>
                <SText variant="headline" style={{ fontWeight: '800' }} numberOfLines={1}>
                  {displayName || email}
                </SText>
                {displayName ? (
                  <SText variant="caption2" color={colors.textSecondary} numberOfLines={1}>
                    {email}
                  </SText>
                ) : null}
                <View style={[styles.planBadge, brutalBorder(2)]}>
                  <Ionicons name="sparkles" size={12} color={colors.ink} />
                  <SText variant="caption2" style={{ fontWeight: '800' }}>Plan gratuito</SText>
                </View>
              </View>
              <View style={[styles.chevron, brutalBorder(2)]}>
                <Ionicons name="chevron-forward" size={16} color={colors.ink} />
              </View>
            </BrutalBox>
          </AnimatedPressable>
        </FadeInView>

        <FadeInView index={2}>
          <View style={styles.sectionHeader}>
            <SText variant="caption1" color={colors.textMuted} style={styles.sectionLabel}>
              MI CUENTA
            </SText>
          </View>
          <BrutalBox shadow={4} contentStyle={styles.menuCard}>
            {accountItems.map((item, index) => (
              <View key={item.label}>
                <MenuRow
                  item={item}
                  onPress={() => router.push(item.route as any)}
                />
                {index < accountItems.length - 1 ? <View style={styles.menuDivider} /> : null}
              </View>
            ))}
          </BrutalBox>
        </FadeInView>

        <FadeInView index={3}>
          <View style={styles.sectionHeader}>
            <SText variant="caption1" color={colors.textMuted} style={styles.sectionLabel}>
              CONFIGURACIÓN
            </SText>
          </View>
          <BrutalBox shadow={4} contentStyle={styles.menuCard}>
            {menuItems.map((item, index) => (
              <View key={item.label}>
                <MenuRow
                  item={item}
                  disabled={!item.route}
                  onPress={
                    item.route === 'export'
                      ? () => setExportVisible(true)
                      : item.route
                        ? () => router.push(item.route as any)
                        : undefined
                  }
                />
                {index < menuItems.length - 1 ? <View style={styles.menuDivider} /> : null}
              </View>
            ))}
          </BrutalBox>
        </FadeInView>

        <FadeInView index={4}>
          <View style={styles.sectionHeader}>
            <SText variant="caption1" color={colors.textMuted} style={styles.sectionLabel}>
              SESIÓN
            </SText>
          </View>
          <AnimatedPressable onPress={handleLogout}>
            <BrutalBox bg={colors.expenseBg} shadow={4} contentStyle={styles.logoutBtn}>
              <View style={[styles.logoutIcon, brutalBorder(2)]}>
                <Ionicons name="log-out-outline" size={20} color={colors.expense} />
              </View>
              <SText variant="headline" color={colors.expense} style={styles.logoutLabel}>
                Cerrar sesión
              </SText>
            </BrutalBox>
          </AnimatedPressable>
        </FadeInView>

        <FadeInView index={5}>
          <BrutalBox
            bg={colors.bgAlt}
            radius={radii.pill}
            shadow={3}
            style={styles.versionBox}
            contentStyle={styles.versionContent}
          >
            <Ionicons name="wallet-outline" size={14} color={colors.textMuted} />
            <SText variant="caption2" color={colors.textMuted} style={{ fontWeight: '600' }}>
              FinApp v1.0.0
            </SText>
          </BrutalBox>
        </FadeInView>
      </ScrollView>
      <ExportModal visible={exportVisible} onClose={() => setExportVisible(false)} />
    </BrutalScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: 14,
    marginBottom: spacing.xxl,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  planBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  menuCard: {
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: 14,
  },
  menuItemDisabled: {
    opacity: 0.85,
  },
  menuDivider: {
    height: 2,
    backgroundColor: colors.bgAlt,
    marginHorizontal: spacing.lg,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.bgAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soonBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: 10,
    marginBottom: spacing.xxl,
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutLabel: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  versionBox: {
    alignSelf: 'center',
  },
  versionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
