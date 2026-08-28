import { Text, View } from 'react-native';

import { useConfigStore } from '@/store';

/**
 * Footer del Home: RIF + datos legales de la empresa del whitelabel.
 * Copy es-VE, sin trust-signal rows ni emojis.
 */
export function HomeFooter() {
  const name = useConfigStore((s) => s.appConfig?.tx_company_name);
  const rif = useConfigStore((s) => s.appConfig?.tx_company_rif);
  const address = useConfigStore((s) => s.appConfig?.tx_company_address);
  const description = useConfigStore(
    (s) => s.appConfig?.tx_company_description
  );

  if (!name) return null;

  return (
    <View className="mt-8 mx-4 mb-4 py-5 border-t border-border">
      <Text className="text-sm font-bold text-foreground">{name}</Text>
      {description ? (
        <Text className="text-xs text-muted mt-1 leading-5">
          {description}
        </Text>
      ) : null}
      {address ? (
        <Text className="text-xs text-muted mt-1.5">{address}</Text>
      ) : null}
      {rif ? (
        <Text className="text-[11px] text-muted mt-1.5">RIF {rif}</Text>
      ) : null}
    </View>
  );
}
