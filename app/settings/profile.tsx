import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { getProfile } from '@/services/profileService';
import { updateUserMetadata } from '@/services/accountSettingsService';
import BrutalScreen from '@/src/components/BrutalScreen';
import BrutalBox from '@/src/components/BrutalBox';
import BrutalButton from '@/src/components/BrutalButton';
import SettingsField from '@/src/components/SettingsField';
import AuthFeedback from '@/src/components/AuthFeedback';
import SText from '@/src/components/SText';
import FadeInView from '@/src/components/FadeInView';
import { formatCOP } from '@/src/utils/currency';
import { colors, radii, spacing, brutalBorder } from '@/src/constants/theme';

function getInitials(name?: string, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (!email) return '?';
  const local = email.split('@')[0] ?? '';
  return local.slice(0, 2).toUpperCase() || '?';
}

export default function ProfileSettingsScreen() {
  const { session } = useAuth();
  const meta = session?.user?.user_metadata ?? {};

  const [displayName, setDisplayName] = useState(String(meta.display_name ?? ''));
  const [bio, setBio] = useState(String(meta.bio ?? ''));
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const email = session?.user?.email ?? '';
  const createdAt = session?.user?.created_at;
  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : null;

  const initials = useMemo(() => getInitials(displayName, email), [displayName, email]);

  useEffect(() => {
    getProfile()
      .then((p) => {
        if (p?.monthly_income != null) setMonthlyIncome(Number(p.monthly_income));
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      await updateUserMetadata({
        display_name: displayName.trim(),
        bio: bio.trim(),
      });
      setFeedback({ type: 'success', message: 'Tu perfil se actualizó correctamente.' });
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'No se pudo guardar el perfil.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Sobre mí' }} />
      <BrutalScreen showDecor={false} skipTopInset>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeInView>
            <BrutalBox bg={colors.yellow} shadow={4} contentStyle={styles.hero}>
              <View style={[styles.avatar, brutalBorder(2)]}>
                <SText variant="title2" style={{ fontWeight: '900' }}>{initials}</SText>
              </View>
              <View style={{ flex: 1 }}>
                <SText variant="headline" style={{ fontWeight: '800' }} numberOfLines={1}>
                  {displayName.trim() || email}
                </SText>
                <SText variant="caption2" color={colors.textSecondary} style={{ marginTop: 4 }}>
                  {email}
                </SText>
                {memberSince ? (
                  <SText variant="caption2" color={colors.textMuted} style={{ marginTop: 6 }}>
                    Miembro desde {memberSince}
                  </SText>
                ) : null}
              </View>
            </BrutalBox>
          </FadeInView>

          {feedback ? (
            <View style={{ marginBottom: spacing.lg }}>
              <AuthFeedback type={feedback.type} message={feedback.message} />
            </View>
          ) : null}

          <FadeInView index={1}>
            <SettingsField
              label="Nombre"
              placeholder="Cómo te llamamos en la app"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            <SettingsField
              label="Sobre mí"
              placeholder="Ej. Estudiante, ahorro para un viaje..."
              value={bio}
              onChangeText={setBio}
              multiline
              style={{ minHeight: 96, textAlignVertical: 'top' }}
            />
          </FadeInView>

          <FadeInView index={2}>
            <SText variant="caption1" color={colors.textMuted} style={styles.sectionLabel}>
              RESUMEN
            </SText>
            <BrutalBox bg={colors.surfaceAlt} radius={radii.md} shadow={3} contentStyle={styles.summary}>
              <View style={styles.summaryRow}>
                <Ionicons name="mail-outline" size={18} color={colors.ink} />
                <View style={{ flex: 1 }}>
                  <SText variant="caption2" color={colors.textMuted}>Correo</SText>
                  <SText variant="footnote" style={{ fontWeight: '700' }}>{email}</SText>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Ionicons name="cash-outline" size={18} color={colors.ink} />
                <View style={{ flex: 1 }}>
                  <SText variant="caption2" color={colors.textMuted}>Ingreso mensual de referencia</SText>
                  <SText variant="footnote" style={{ fontWeight: '700' }}>
                    {monthlyIncome != null ? formatCOP(monthlyIncome) : 'Sin configurar'}
                  </SText>
                </View>
              </View>
            </BrutalBox>
          </FadeInView>

          <FadeInView index={3}>
            <BrutalButton
              label={saving ? 'Guardando...' : 'Guardar perfil'}
              onPress={handleSave}
              disabled={saving}
            />
          </FadeInView>
        </ScrollView>
      </BrutalScreen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 120,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  summary: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  summaryDivider: {
    height: 2,
    backgroundColor: colors.bgAlt,
    marginVertical: spacing.md,
  },
});
