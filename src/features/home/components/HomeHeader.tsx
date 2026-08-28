import { Image, Pressable, Text, View } from 'react-native';
import { MapPin, ChevronDown } from 'lucide-react-native';

import { useBranchStore, useConfigStore } from '@/store';
import { BranchSelector } from '@/features/branches/components/BranchSelector';
import { ModalBranches } from '@/features/branches/components/ModalBranches';
import { useState } from 'react';

/**
 * Header sticky del Home: logo + selector de sede.
 *
 * Logo: si la config trae `tx_company_logo_url` se muestra, sino
 * fallback al nombre de la empresa en texto.
 *
 * El selector SIEMPRE es tappable:
 *  - Si hay sede: <BranchSelector /> muestra tx_alias + chevron.
 *  - Si no hay sede: placeholder gris con "Selecciona tu sede" que
 *    abre el modal (CTA claro para el primer uso).
 */
export function HomeHeader() {
  const companyName = useConfigStore((s) => s.appConfig?.tx_company_name);
  const logoUrl = useConfigStore((s) => s.appConfig?.tx_company_logo_url);
  const selectedBranch = useBranchStore((s) => s.selectedBranch);
  const [forceOpen, setForceOpen] = useState(false);

  return (
    <View className="flex-row items-center justify-between bg-background px-4 py-3 border-b border-backgroundElement">
      <View className="flex-row items-center gap-2 flex-1">
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={{ width: 36, height: 36 }}
            resizeMode="contain"
            accessibilityLabel={companyName ?? 'Logo'}
          />
        ) : (
          <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
            <Text className="text-base font-bold text-primary-foreground">
              {(companyName ?? 'F').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text
            className="text-base font-bold text-foreground"
            numberOfLines={1}
          >
            {companyName ?? 'Farmacia'}
          </Text>
          {selectedBranch ? (
            <BranchSelector />
          ) : (
            <Pressable
              onPress={() => setForceOpen(true)}
              hitSlop={8}
              className="flex-row items-center gap-1 self-start"
              accessibilityRole="button"
              accessibilityLabel="Seleccionar sede"
            >
              <MapPin size={12} color="#0f766e" />
              <Text className="text-xs font-medium text-primary">
                Selecciona tu sede
              </Text>
              <ChevronDown size={12} color="#0f766e" />
            </Pressable>
          )}
        </View>
      </View>
      <ModalBranches
        visible={forceOpen}
        onClose={() => setForceOpen(false)}
      />
    </View>
  );
}
