import { View } from 'react-native';
import { Text } from 'heroui-native';

/**
 * Placeholder de Términos y Condiciones.
 * En producción se reemplaza por el contenido legal real del backend.
 */
export default function TermsAndConditionsScreen() {
  return (
    <View className="flex-1 bg-background p-6">
      <Text className="text-xl font-bold text-foreground mb-4">
        Términos y Condiciones
      </Text>
      <Text className="text-sm text-muted">
        Aquí va el texto legal provisto por el backend o hardcoded.
        (placeholder de Fase 1)
      </Text>
    </View>
  );
}
