import { useState } from 'react';
import { Pressable, TextInput, View, Text } from 'react-native';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';

/**
 * Search bar del Home. Al tocarlo abre la pantalla `/search`
 * (Fase 3). Mientras tanto, navega aunque la pantalla destino
 * sea un stub.
 */
export function HomeSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const q = value.trim();
    if (q.length === 0) {
      router.push('/search');
      return;
    }
    router.push({ pathname: '/search', params: { q } });
  };

  return (
    <Pressable
      onPress={() => router.push('/search')}
      className="mx-4 my-2"
      accessibilityRole="button"
      accessibilityLabel="Buscar productos"
    >
      <View className="flex-row items-center gap-2 bg-backgroundElement rounded-[14px] px-3 py-2.5">
        <Search size={18} color="#60646C" />
        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          placeholder="Busca por producto, marca o categoría"
          placeholderTextColor="#60646C"
          className="flex-1 text-sm text-foreground"
          editable={false}
          pointerEvents="none"
        />
      </View>
      {value.length > 0 ? (
        <Text className="text-[10px] text-muted mt-1 ml-1">
          Tocá para escribir tu búsqueda
        </Text>
      ) : null}
    </Pressable>
  );
}
