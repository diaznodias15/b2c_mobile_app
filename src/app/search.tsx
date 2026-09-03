import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabs, TAB_BAR_HEIGHT } from '@/components/bottom-tabs';
import { SOFT_COLORS } from '@/theme/colors';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: SOFT_COLORS.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top,
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: SOFT_COLORS.foreground,
          }}
        >
          Buscar
        </Text>
      </View>
      <BottomTabs />
    </View>
  );
}
