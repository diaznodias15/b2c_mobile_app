import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { CircleAlert, Trash2 } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

/**
 * Confirmación de "Vaciar carrito". Mismo diseño que `ModalLogout`: no se cierra
 * tocando el fondo, solo con "Cancelar" o el botón atrás de Android. Mientras el
 * servidor responde (`isLoading`) los botones quedan bloqueados.
 */
export function ModalClearCart({
  visible,
  isLoading,
  onConfirm,
  onClose,
  colors,
}: {
  visible: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
  colors: ThemeColors;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={isLoading ? undefined : onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            gap: 20,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: colors.primaryOverlay,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircleAlert size={32} color={colors.primary} strokeWidth={1.8} />
          </View>

          <Text style={{ fontSize: 16, color: colors.foreground, textAlign: 'center', lineHeight: 22 }}>
            ¿Estás seguro de que quieres{' '}
            <Text style={{ fontWeight: '700' }}>eliminar todos los productos</Text> de tu carrito?
          </Text>

          <Pressable
            onPress={onConfirm}
            disabled={isLoading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 48,
              borderRadius: 12,
              backgroundColor: colors.danger,
              width: '100%',
              opacity: isLoading ? 0.8 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel="Sí, vaciar carrito"
            accessibilityState={{ busy: isLoading }}
          >
            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Trash2 size={18} color="#FFFFFF" />}
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Sí, vaciar carrito</Text>
          </Pressable>

          <Pressable onPress={onClose} disabled={isLoading} accessibilityRole="button" accessibilityLabel="Cancelar">
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted }}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
