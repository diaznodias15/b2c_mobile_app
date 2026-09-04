import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabs } from '@/components/bottom-tabs';
import { useConfigStore } from '@/store/config.store';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useConfigStore((s) => s.getThemeColors());
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top,
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
          Perfil
        </Text>
      </View>
      <BottomTabs />
    </View>
  );
}
