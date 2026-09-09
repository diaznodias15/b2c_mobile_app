import { Text, View } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';

import { hexToRgba, type ThemeColors } from '@/theme/colors';
import type { User } from '@/store/user.store';

/**
 * Header del perfil: cover con tinte del primary + avatar circular con
 * iniciales + nombre (con badge de verificado, siempre true acá — si el
 * usuario tiene sesión es porque ya verificó su email, ver
 * `UNVERIFIED_EMAIL_MESSAGE` en login.tsx) + email + fecha de alta.
 *
 * Web de referencia (PROFILE-VIEW.md §5) usa un `linear-gradient` de dos
 * tonos del primary para el cover; acá se aproxima con un tinte sólido
 * para no sumar `expo-linear-gradient` como dependencia nativa nueva
 * solo por este detalle cosmético.
 */
export function ProfileHeader({ user, colors }: { user: User; colors: ThemeColors }) {
  const displayName = user.name || user.email || '';
  const initials = getInitials(displayName);
  const memberSince = formatMemberSince(user.created_at);

  return (
    <View
      style={{
        backgroundColor: colors.section,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ height: 80, backgroundColor: hexToRgba(colors.primary, 0.18) }} />

      <View style={{ paddingHorizontal: 28, paddingBottom: 24, alignItems: 'center' }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.section,
            marginTop: -44,
            padding: 4,
            shadowColor: colors.shadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View
            style={{
              flex: 1,
              borderRadius: 40,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.onPrimary, letterSpacing: -0.5 }}>
              {initials}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, lineHeight: 24 }}>
            {displayName || 'Usuario'}
          </Text>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.success,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="Usuario verificado"
          >
            <BadgeCheck size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
        </View>

        <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '500', marginTop: 4 }}>
          {user.email}
        </Text>

        {memberSince && (
          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '500', marginTop: 6 }}>
            Miembro desde {memberSince}
          </Text>
        )}
      </View>
    </View>
  );
}

function getInitials(source: string): string {
  const trimmed = (source ?? '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatMemberSince(isoDate: string | undefined): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
