import { Modal, Pressable, Text, View } from 'react-native';
import { CalendarDays, Info, ShoppingBag } from 'lucide-react-native';

import { hexToRgba, type ThemeColors } from '@/theme/colors';

/**
 * Aviso de horarios al entrar al carrito (`ModalCartWorkingHours` de la web,
 * doc 09 §4). A diferencia de la web no se cierra tocando fuera del cuadro:
 * hay que pulsar "Entendido" (el botón atrás de Android sí lo cierra, para no
 * dejar al usuario atrapado).
 */
export function ModalCartWorkingHours({
  visible,
  branchName,
  workingHours,
  onClose,
  colors,
}: {
  visible: boolean;
  branchName: string;
  workingHours: string;
  onClose: () => void;
  colors: ThemeColors;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <View style={{ backgroundColor: colors.background, borderRadius: 18, padding: 20, gap: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, textAlign: 'center' }}>
            {branchName}
          </Text>

          <View style={{ alignItems: 'center', gap: 6 }}>
            <CalendarDays size={22} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>Nuestro Horario</Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 }}>
              {workingHours}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              backgroundColor: hexToRgba(colors.warning, 0.14),
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Info size={16} color={colors.warning} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: colors.foreground }}>
              <Text style={{ fontWeight: '700' }}>Información de los Pedidos: </Text>
              los pedidos realizados fuera de horario en la{' '}
              <Text style={{ fontWeight: '700' }}>{branchName}</Text> se procesarán{' '}
              <Text style={{ fontWeight: '700' }}>al día siguiente a primera hora.</Text>
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            style={{
              height: 48,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: colors.primary,
            }}
            accessibilityRole="button"
            accessibilityLabel="Entendido, ir al carrito"
          >
            <ShoppingBag size={16} color={colors.onPrimary} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.onPrimary }}>
              Entendido, ir al carrito
            </Text>
          </Pressable>

          <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.muted, textAlign: 'center' }}>
            Gracias por confiar en nosotros.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
