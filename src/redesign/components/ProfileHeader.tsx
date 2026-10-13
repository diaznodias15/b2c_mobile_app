import { View } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';

import type { User } from '@/store/user.store';
import type { ThemeColors } from '@/theme/colors';

import { Surface } from '../ui/Surface';
import { Txt } from '../ui/Txt';

/**
 * Cabecera del perfil. **Mismo contrato que `@/components/ProfileHeader`** (`user`, `colors`).
 *
 * Qué cambia: pasa de una tarjeta alta (franja de color + avatar centrado de 88 px + 4 líneas
 * centradas) a una fila compacta: avatar de 64 con iniciales a la izquierda y nombre, correo y
 * "Miembro desde" a la derecha. Gana ~110 px para el contenido útil y el correo (que puede ser
 * largo) ya no queda en 13 px centrado. El "verificado" se anuncia con texto accesible.
 */
export function ProfileHeader({ user, colors }: { user: User; colors: ThemeColors }) {
  const displayName = user.name || user.email || '';
  const initials = getInitials(displayName);
  const memberSince = formatMemberSince(user.created_at);

  return (
    <Surface colors={colors} padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Txt variant="section" colors={colors} style={{ color: colors.onPrimary, fontSize: 22, fontWeight: '800' }}>
          {initials}
        </Txt>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ flexShrink: 1 }}>
            <Txt variant="section" colors={colors} numberOfLines={1}>
              {displayName || 'Usuario'}
            </Txt>
          </View>
          <View accessible accessibilityLabel="Usuario verificado">
            <BadgeCheck size={20} color={colors.success} strokeWidth={2.4} />
          </View>
        </View>
        <Txt variant="label" color="muted" colors={colors} numberOfLines={1} style={{ fontWeight: '500' }}>
          {user.email}
        </Txt>
        {memberSince ? (
          <Txt variant="caption" color="muted" colors={colors}>
            Miembro desde {memberSince}
          </Txt>
        ) : null}
      </View>
    </Surface>
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
