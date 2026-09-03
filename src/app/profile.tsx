import { Text, View } from 'react-native';

import AppTabs from '@/components/app-tabs';

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-base text-foreground">Perfil (placeholder)</Text>
      <AppTabs />
    </View>
  );
}
