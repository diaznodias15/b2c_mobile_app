import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { useThemeColors } from '@/store/config.store';
import { hexToRgba, isLightColor } from '@/theme/colors';
import { LOGO_DARK as LOGO_DARK_URI, LOGO_LIGHT as LOGO_LIGHT_URI } from '@/utils/localImages.generated';

import { IconButton } from '../ui/IconButton';
import { Txt } from '../ui/Txt';

const LOGO_LIGHT = { uri: LOGO_LIGHT_URI };
const LOGO_DARK = { uri: LOGO_DARK_URI };

/**
 * Cabecera de marca de las pantallas de acceso (login y registro): banda tintada con el primario del
 * whitelabel (`primaryOverlay`, así el logo a color se lee con cualquier paleta), botón de volver de
 * 48 dp, logo, título y subtítulo, con formas decorativas ocultas para el lector de pantalla.
 *
 * La banda termina con esquinas redondeadas y deja `overlap` px de relleno inferior: el contenido que
 * viene después (una tarjeta) se superpone con un `marginTop` negativo de ese mismo valor.
 */
export function AuthHeader({
  title,
  subtitle,
  onBack,
  overlap = 32,
  logoWidth = 150,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  /** Cuánto se superpone la primera tarjeta; la banda reserva `overlap + 24` de relleno inferior. */
  overlap?: number;
  logoWidth?: number;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: colors.primaryOverlay,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: overlap + 24,
        overflow: 'hidden',
      }}
    >
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <View
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            top: -70,
            right: -60,
            backgroundColor: hexToRgba(colors.primary, 0.1),
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: 140,
            height: 140,
            borderRadius: 70,
            bottom: -30,
            left: -40,
            backgroundColor: hexToRgba(colors.primary, 0.08),
          }}
        />
      </View>

      <View style={{ alignSelf: 'flex-start' }}>
        <IconButton icon={ChevronLeft} label="Volver" onPress={onBack} colors={colors} />
      </View>

      <View style={{ alignItems: 'center', gap: 6, marginTop: 4 }}>
        <Image
          source={isLightColor(colors.background) ? LOGO_LIGHT : LOGO_DARK}
          style={{ width: logoWidth, height: logoWidth * 0.31 }}
          resizeMode="contain"
          accessibilityLabel="Logo de la tienda"
        />
        <Txt variant="title" colors={colors} style={{ fontSize: 28, lineHeight: 34, marginTop: 14, textAlign: 'center' }}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center' }} numberOfLines={2}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}
