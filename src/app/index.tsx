import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabs } from '@/components/bottom-tabs';
import { SOFT_COLORS } from '@/theme/colors';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: SOFT_COLORS.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insets.top,
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: SOFT_COLORS.foreground,
          }}
        >
          Hola mundo
        </Text>
      </View>
      <BottomTabs />
    </View>
  );
}
