import { Linking, Pressable, Text, View } from 'react-native';
import { MapPin, MessageCircle } from 'lucide-react-native';

import { useBranchStore, useConfigStore } from '@/store';

/**
 * Banner "Despachamos desde tu sede" con CTA a WhatsApp.
 * Usa el numero del whitelabel (`tx_whatsapp_contact_phone`) si
 * esta disponible; si no, cae al telefono principal.
 */
export function DeliveryBanner() {
  const branchTree = useBranchStore((s) => s.branchTree);
  const selectedId = useBranchStore((s) => s.selectedBranch?.value);
  const whatsapp = useConfigStore((s) => s.appConfig?.tx_whatsapp_contact_phone);
  const companyPhone = useConfigStore((s) => s.appConfig?.tx_company_phone);

  const group = branchTree.find((g) =>
    g.items.some((it) => it.value === selectedId)
  );

  const phone = whatsapp || companyPhone || '';
  const phoneDigits = phone.replace(/[^0-9+]/g, '');

  const openWhatsApp = () => {
    if (!phoneDigits) return;
    // Mensaje predeterminado que el usuario puede editar.
    const msg = encodeURIComponent(
      `Hola, soy de ${group?.nb_city ?? 'la farmacia'} y quiero consultar disponibilidad de un producto.`
    );
    // wa.me sin "+" requiere solo el codigo de pais + numero.
    const url = `https://wa.me/${phoneDigits.replace('+', '')}?text=${msg}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View
      className="mt-6 mx-4 mb-4 rounded-[14px] p-4 border"
      style={{
        backgroundColor: '#00800014', // primaryOverlay (fallback)
        borderColor: '#00800033',
      }}
    >
      <View className="flex-row items-center gap-2 mb-1.5">
        <MapPin size={14} color="#008000" />
        <Text className="text-sm font-bold text-foreground">
          Despachamos desde tu sede
        </Text>
      </View>
      <Text className="text-xs text-muted leading-5">
        {group
          ? `${group.nb_city}, ${group.nb_state}. Hacemos entregas en la zona y retiro en tienda está disponible todo el día.`
          : 'Elegí tu sede para ver disponibilidad y tiempos de entrega.'}
      </Text>
      {phoneDigits ? (
        <Pressable
          onPress={openWhatsApp}
          className="flex-row items-center gap-2 mt-3 self-start"
          accessibilityRole="button"
          accessibilityLabel="Abrir WhatsApp para consultar"
        >
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle size={16} color="#FFFFFF" />
          </View>
          <Text className="text-xs font-semibold text-foreground">
            Consultanos por WhatsApp
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
