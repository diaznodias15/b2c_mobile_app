import { Pressable, Text, View } from 'react-native';
import { CircleAlert, MapPinOff, PackageX, RefreshCw, type LucideIcon } from 'lucide-react-native';

import { hexToRgba, type ThemeColors } from '@/theme/colors';

export type ProductDetailMessageKind = 'error' | 'slow' | 'no-branch' | 'not-found';

const CONTENT: Record<
  ProductDetailMessageKind,
  { icon: LucideIcon; title: string; message: string; retry: boolean }
> = {
  error: {
    icon: CircleAlert,
    title: 'No pudimos cargar el producto',
    message: 'Revisa tu conexión e inténtalo de nuevo.',
    retry: true,
  },
  slow: {
    icon: CircleAlert,
    title: 'Está tardando más de lo normal',
    message: 'La conexión está lenta. Puedes seguir esperando o intentarlo de nuevo.',
    retry: true,
  },
  'no-branch': {
    icon: MapPinOff,
    title: 'Elige una sede',
    message: 'Necesitamos saber en qué sede quieres ver este producto.',
    retry: false,
  },
  'not-found': {
    icon: PackageX,
    title: 'Producto no disponible',
    message: 'No encontramos este producto. Puede que ya no esté en el catálogo.',
    retry: false,
  },
};

/**
 * Mensaje centrado del detalle de producto cuando no hay nada que mostrar
 * (error, tarda demasiado, sin sede o producto inexistente), con "Reintentar"
 * donde tiene sentido y siempre una salida ("Volver"). `detail` es el mensaje
 * técnico del error, en pequeño, para poder reportarlo.
 */
export function ProductDetailMessage({
  kind,
  detail,
  onRetry,
  onBack,
  colors,
  compact = false,
}: {
  kind: ProductDetailMessageKind;
  detail?: string;
  onRetry?: () => void;
  onBack: () => void;
  colors: ThemeColors;
  /** `true`: sin ocupar la pantalla entera (se muestra bajo el esqueleto). */
  compact?: boolean;
}) {
  const { icon: Icon, title, message, retry } = CONTENT[kind];
  const accent = kind === 'error' ? colors.danger : colors.muted;

  return (
    <View
      style={{
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: compact ? 20 : 0,
        flex: compact ? undefined : 1,
        justifyContent: 'center',
        gap: 6,
      }}
      accessibilityRole="alert"
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: hexToRgba(accent, 0.12),
          marginBottom: 8,
        }}
      >
        <Icon size={28} color={accent} />
      </View>
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>{message}</Text>
      {detail ? (
        <Text style={{ fontSize: 11, color: colors.muted, textAlign: 'center', opacity: 0.7 }} numberOfLines={2}>
          {detail}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        {retry && onRetry && (
          <Pressable
            onPress={onRetry}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              paddingVertical: 11,
              paddingHorizontal: 20,
              borderRadius: 999,
              backgroundColor: colors.primary,
            }}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
          >
            <RefreshCw size={15} color={colors.onPrimary} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onPrimary }}>Reintentar</Text>
          </Pressable>
        )}
        {!compact && (
          <Pressable
            onPress={onBack}
            style={{
              paddingVertical: 11,
              paddingHorizontal: 20,
              borderRadius: 999,
              backgroundColor: colors.section,
            }}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Volver</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
