import { Text, View } from 'react-native';

import AppTabs from '@/components/app-tabs';

export default function SearchScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-base text-foreground">Buscar (placeholder)</Text>
      <AppTabs />
    </View>
  );
}
