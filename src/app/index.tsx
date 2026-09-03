import { Text, View } from 'react-native';

import AppTabs from '@/components/app-tabs';

/**
 * Home placeholder. Punto de partida limpio para sumar features
 * uno a uno y validar en cada paso.
 */
export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-2xl font-bold text-foreground">Hola mundo</Text>
      <AppTabs />
    </View>
  );
}
