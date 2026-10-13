import { Modal, View } from 'react-native';
import { LogOut } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

import { Button } from '../ui/Button';
import { Txt } from '../ui/Txt';

/**
 * Confirmación de cerrar sesión. **Mismo contrato que `@/components/ModalLogout`** (`visible`,
 * `isLoading`, `onConfirm`, `onClose`, `colors`). Igual que el original, tocar el fondo NO lo
 * cierra: solo los botones (la web usa `closeOnClickOutside={false}`); el botón "atrás" de
 * Android sí, salvo mientras carga.
 *
 * Qué cambia: la acción destructiva usa la variante `danger` con el texto ya en el botón
 * ("Sí, cerrar sesión") y "Cancelar" es un botón de 48 dp (antes un texto de 14 px sin área
 * táctil). Los dos botones van apilados y a todo el ancho.
 */
export function ModalLogout({
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isLoading) onClose();
      }}
    >
      <View
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            gap: 16,
          }}
          accessibilityViewIsModal
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primaryOverlay,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={28} color={colors.primary} strokeWidth={1.8} />
          </View>

          <View style={{ gap: 6, alignItems: 'center' }}>
            <Txt variant="section" colors={colors} style={{ textAlign: 'center' }}>
              ¿Cerrar sesión?
            </Txt>
            <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center' }}>
              Saldrás de tu cuenta. Tu carrito se conserva.
            </Txt>
          </View>

          <View style={{ width: '100%', gap: 10 }}>
            <Button
              label="Sí, cerrar sesión"
              variant="danger"
              icon={LogOut}
              loading={isLoading}
              onPress={onConfirm}
              colors={colors}
            />
            <Button label="Cancelar" variant="ghost" disabled={isLoading} onPress={onClose} colors={colors} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
