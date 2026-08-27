import { Image, View } from 'react-native';
import { Card, Text } from 'heroui-native';
import { useConfigStore } from '@/store';

type BrandPanelProps = {
  title: string;
  subtitle?: string;
};

/**
 * Panel superior de marca para pantallas de auth.
 * Logo + headline + subtítulo. Centrado, fondo de marca.
 */
export function BrandPanel({ title, subtitle }: BrandPanelProps) {
  const appConfig = useConfigStore((s) => s.appConfig);
  const logoUrl = appConfig?.tx_company_logo_url;
  const companyName = appConfig?.tx_company_name ?? 'Farmacia El Samán';

  return (
    <View className="items-center pt-8 pb-6 px-6">
      <View className="items-center gap-3">
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={{ width: 64, height: 64 }}
            resizeMode="contain"
            accessibilityLabel={`Logo de ${companyName}`}
          />
        ) : (
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center bg-primary"
            accessibilityLabel={`Logo de ${companyName}`}
          >
            <Text className="text-primary-foreground text-2xl font-bold">
              {companyName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text className="text-lg font-semibold text-foreground">{companyName}</Text>
      </View>

      <View className="items-center gap-2 mt-6">
        <Text className="text-2xl font-bold text-foreground text-center">
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm text-muted text-center">{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
