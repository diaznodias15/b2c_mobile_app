import { useMemo } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { hasCoords } from '@/components/BranchInventoryList';
import { STOCK_META } from '@/utils/stock';
import type { ThemeColors } from '@/theme/colors';
import type { BranchAvailability } from '@/types/whitelabel';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Mapa con Leaflet + tiles de OpenStreetMap dentro de un WebView — la
 * misma librería/proveedor que ya usa la versión web (ver
 * PRODUCT-DETAIL-VIEW.md, bloque 11), a propósito en vez de
 * `react-native-maps` + Google Maps: esa combinación pide una API key
 * de Google (que requiere tarjeta de crédito en la cuenta de Google
 * Cloud) y un rebuild nativo más pesado. Leaflet/OSM no necesita key.
 */
function buildMapHtml(branches: BranchAvailability[]): string {
  const markers = branches.filter(hasCoords).map((b) => ({
    lat: Number(b.lat),
    lng: Number(b.lng),
    label: escapeHtml(b.label ?? b.nb_branch),
    status: STOCK_META[b.availability_indicator]?.label ?? '',
    hours: b.tx_working_hours ? escapeHtml(b.tx_working_hours) : '',
    phone: b.tx_phone ? escapeHtml(b.tx_phone) : '',
    address: b.tx_address ? escapeHtml(b.tx_address) : '',
  }));

  const center = markers[0] ?? { lat: 10.65, lng: -71.6 };

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map').setView([${center.lat}, ${center.lng}], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  var markers = ${JSON.stringify(markers)};
  var markerObjs = markers.map(function (m) {
    var popup = '<b>' + m.label + '</b><br/>' + m.status + '<br/>';
    if (m.hours) popup += m.hours.replace(/\\n/g, '<br/>') + '<br/>';
    if (m.phone) popup += m.phone + '<br/>';
    if (m.address) popup += m.address;
    return L.marker([m.lat, m.lng]).addTo(map).bindPopup(popup);
  });

  if (markerObjs.length > 1) {
    map.fitBounds(L.featureGroup(markerObjs).getBounds().pad(0.2));
  } else if (markerObjs.length === 1) {
    markerObjs[0].openPopup();
  }
</script>
</body>
</html>`;
}

export function BranchMapModal({
  visible,
  onClose,
  branches,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  branches: BranchAvailability[];
  colors: ThemeColors;
}) {
  const insets = useSafeAreaInsets();
  // Solo se recalcula si cambia la lista de sedes — no en cada render
  // mientras el modal está abierto (recargaría el WebView de más).
  const html = useMemo(() => buildMapHtml(branches), [branches]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <WebView source={{ html }} style={{ flex: 1 }} originWhitelist={['*']} />

        <View
          style={{
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 20,
            backgroundColor: colors.section,
          }}
        >
          <Pressable
            onPress={onClose}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: colors.primary,
            }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar mapa"
          >
            <ChevronLeft size={18} color={colors.onPrimary} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.onPrimary }}>
              Cerrar
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
