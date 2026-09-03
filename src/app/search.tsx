import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabs } from '@/components/bottom-tabs';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top, paddingBottom: 60 + insets.bottom }}
      >
        <Text className="text-3xl font-bold text-foreground">Buscar</Text>
      </View>
      <BottomTabs />
    </View>
  );
}
