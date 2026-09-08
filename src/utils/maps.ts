import { Linking, Platform } from 'react-native';

/**
 * Abre la app de mapas nativa del teléfono (Apple Maps en iOS, cualquier
 * app que maneje `geo:` en Android — normalmente Google Maps) apuntando
 * a `lat`/`lng`. No usamos `Linking.canOpenURL` para decidir: en iOS
 * requeriría declarar el scheme `maps` en `LSApplicationQueriesSchemes`
 * (no configurado en este proyecto) y devolvería `false` aunque Apple
 * Maps sí pueda abrir la URL — simplemente intentamos abrir el esquema
 * nativo y, si falla, caemos a la URL web de Google Maps (siempre abre,
 * en cualquier navegador).
 */
export async function openInMaps(lat: number, lng: number, label?: string): Promise<void> {
  const query = label ? encodeURIComponent(label) : `${lat},${lng}`;
  const nativeUrl = Platform.select({
    ios: `maps://?ll=${lat},${lng}&q=${query}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${query})`,
  });
  const webFallback = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  if (nativeUrl) {
    try {
      await Linking.openURL(nativeUrl);
      return;
    } catch {
      // Sin app de mapas nativa disponible — cae al fallback web.
    }
  }

  await Linking.openURL(webFallback);
}
