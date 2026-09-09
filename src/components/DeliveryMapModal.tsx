import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ChevronLeft, MapPin, Navigation, Search } from 'lucide-react-native';

import { getLocations, type LocationSuggestion } from '@/api/services/utilities.services';
import type { ThemeColors } from '@/theme/colors';

const MAP_HTML = `<!DOCTYPE html>
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
  var map = L.map('map').setView([10.65, -71.6], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  var marker = null;

  function post(lat, lng) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
  }

  function placeMarker(lat, lng) {
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on('dragend', function () {
        var pos = marker.getLatLng();
        post(pos.lat, pos.lng);
      });
    }
  }

  // Llamado desde React Native (injectJavaScript) para mover el pin sin
  // esperar un tap del usuario: resultado de búsqueda o "Mi ubicación".
  window.setMarker = function (lat, lng, zoom) {
    placeMarker(lat, lng);
    map.setView([lat, lng], zoom || 16);
  };

  map.on('click', function (e) {
    placeMarker(e.latlng.lat, e.latlng.lng);
    post(e.latlng.lat, e.latlng.lng);
  });
</script>
</body>
</html>`;

/**
 * Picker de ubicación de entrega — mismo motor que `BranchMapModal`
 * (Leaflet + OpenStreetMap en un WebView, sin API key ni rebuild nativo),
 * pero interactivo: tap/drag del pin + búsqueda con autocomplete real
 * (`/api/utilities/get-locations`, verificado contra el backend).
 *
 * Devuelve `{ lat, lng, label }` al confirmar — quien lo use decide qué
 * hacer con eso (guardar en `deliveryAddress`, cotizar el envío, etc).
 * No calcula el costo de envío acá adentro a propósito: eso requiere
 * sincronizar el carrito local con el backend primero (`mergeLocalCart`),
 * que es responsabilidad de quien abre el modal, no del picker en sí.
 */
export function DeliveryMapModal({
  visible,
  onClose,
  onConfirm,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (position: { lat: number; lng: number; label?: string }) => void;
  colors: ThemeColors;
}) {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);
  const html = useMemo(() => MAP_HTML, []);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(text: string) {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await getLocations(text.trim());
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 700);
  }

  function selectSuggestion(item: LocationSuggestion) {
    const lat = Number(item.lat);
    const lng = Number(item.lng);
    setPosition({ lat, lng, label: item.display_name });
    setQuery(item.display_name);
    setSuggestions([]);
    webviewRef.current?.injectJavaScript(`window.setMarker(${lat}, ${lng}); true;`);
  }

  function handleMapMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { lat: number; lng: number };
      setPosition({ lat: data.lat, lng: data.lng });
    } catch {
      // Mensaje inesperado del WebView — se ignora, el usuario puede reintentar el tap.
    }
  }

  async function useMyLocation() {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert('Ubicación no disponible', 'No pudimos acceder a tu ubicación.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setPosition({ lat, lng });
      webviewRef.current?.injectJavaScript(`window.setMarker(${lat}, ${lng}); true;`);
    } catch {
      Alert.alert('Ubicación no disponible', 'No pudimos obtener tu ubicación en este momento.');
    } finally {
      setIsLocating(false);
    }
  }

  function handleConfirm() {
    if (!position) return;
    onConfirm(position);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingBottom: 12,
            paddingHorizontal: 16,
            backgroundColor: colors.section,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cerrar mapa">
              <ChevronLeft size={22} color={colors.foreground} />
            </Pressable>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.background,
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 42,
              }}
            >
              <Search size={16} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={handleQueryChange}
                placeholder="Buscar dirección..."
                placeholderTextColor={colors.muted}
                style={{ flex: 1, fontSize: 14, color: colors.foreground }}
              />
              {isSearching && <ActivityIndicator size="small" color={colors.muted} />}
            </View>
          </View>

          {suggestions.length > 0 && (
            <View style={{ backgroundColor: colors.background, borderRadius: 10, overflow: 'hidden' }}>
              {suggestions.map((item, index) => (
                <Pressable
                  key={`${item.lat}-${item.lng}-${index}`}
                  onPress={() => selectSuggestion(item)}
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    alignItems: 'flex-start',
                    padding: 12,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.display_name}
                >
                  <MapPin size={14} color={colors.muted} style={{ marginTop: 2 }} />
                  <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <WebView
          ref={webviewRef}
          source={{ html }}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          onMessage={handleMapMessage}
        />

        <View
          style={{
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 20,
            backgroundColor: colors.section,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>
            Tocá el mapa o arrastrá el pin para ajustar el punto de entrega.
          </Text>

          <Pressable
            onPress={useMyLocation}
            disabled={isLocating}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: isLocating ? 0.7 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel="Usar mi ubicación"
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Navigation size={16} color={colors.primary} />
            )}
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
              {isLocating ? 'Buscando tu ubicación…' : 'Usar mi ubicación'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleConfirm}
            disabled={!position}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: position ? colors.primary : colors.border,
            }}
            accessibilityRole="button"
            accessibilityLabel="Confirmar dirección"
          >
            <Text
              style={{ fontSize: 15, fontWeight: '700', color: position ? colors.onPrimary : colors.muted }}
            >
              Confirmar dirección
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
