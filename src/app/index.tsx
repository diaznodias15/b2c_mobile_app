import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabs } from '@/components/bottom-tabs';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1 items-center justify-center pb-16">
          <Text className="text-2xl font-bold text-foreground">Hola mundo</Text>
        </View>
      </SafeAreaView>
      <View className="absolute bottom-0 left-0 right-0">
        <BottomTabs />
      </View>
    </View>
  );
}
