import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabs } from '@/components/bottom-tabs';
import { useThemeColors } from '@/store/config.store';

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
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
          Ayuda
        </Text>
      </View>
      <BottomTabs />
    </View>
  );
}
