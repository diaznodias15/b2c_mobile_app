import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useConfigStore } from '@/store/config.store';
import { isLightColor, type ThemeColors } from '@/theme/colors';

const FULLTECH_LOGO = require('../../assets/images/logo-fulltech360.webp');
const LOGO_LIGHT = require('../../assets/images/logo-light.webp');
const LOGO_DARK = require('../../assets/images/logo-dark.webp');

export function Footer({ colors }: { colors: ThemeColors }) {
  const description = useConfigStore((s) => s.appConfig?.tx_company_description);
  const rif = useConfigStore((s) => s.appConfig?.tx_company_rif);
  const logoSource = isLightColor(colors.footer) ? LOGO_LIGHT : LOGO_DARK;

  return (
    <View style={{ backgroundColor: colors.footer, marginTop: 24 }}>
      <View style={{ height: 1, backgroundColor: colors.border }} />

      <View style={{ alignItems: 'center', paddingVertical: 18, paddingHorizontal: 24, gap: 6 }}>
        <Image source={logoSource} style={{ width: 130, height: 40 }} contentFit="contain" />

        {description && (
          <Text style={{ fontSize: 13, color: colors.foreground, textAlign: 'center' }}>
            {description}
          </Text>
        )}

        {rif && (
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              fontStyle: 'italic',
              color: colors.foreground,
            }}
          >
            RIF: {rif}
          </Text>
        )}
      </View>

      <View style={{ height: 1, backgroundColor: colors.border }} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          paddingHorizontal: 24,
        }}
      >
        <Image source={FULLTECH_LOGO} style={{ width: 22, height: 22, borderRadius: 11 }} contentFit="contain" />
        <Text style={{ fontSize: 12, color: colors.muted }}>
          Desarrollado y administrado por{' '}
          <Text style={{ fontWeight: '700', color: colors.foreground }}>Fulltech360 C.A.</Text>
        </Text>
      </View>
    </View>
  );
}
