import { Stack } from 'expo-router';

/**
 * Stack del wizard de checkout.
 * Header oculto — cada screen tiene su propio header.
 */
export default function CartLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="entrega" />
      <Stack.Screen name="pago" />
      <Stack.Screen name="confirmar" />
      <Stack.Screen name="listo" />
    </Stack>
  );
}
