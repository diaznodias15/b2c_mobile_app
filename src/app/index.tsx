import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { HomeSearchBar } from '@/features/home/components/HomeSearchBar';

/**
 * Versión mínima del Home: solo Header + SearchBar.
 * Para aislar cuál componente causa el white screen.
 */
export default function HomeScreen() {
  console.log('[HOME-MIN] render');
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <HomeHeader />
        <HomeSearchBar />
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}
