import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useDepartmentStore } from '@/store';
import type { Department } from '@/types/whitelabel';

type Props = {
  /** Título de la sección. Si está vacío, no se renderiza el header. */
  title?: string;
};

/**
 * Grid 2 columnas de departamentos.
 *
 * NOTA: usamos un layout de `View` con flex-wrap en vez de `FlatList`
 * con `numColumns={2}` + `scrollEnabled={false}` adentro de un ScrollView.
 * La virtualización anidada en ese combo es propensa a no renderizar
 * items en web (y romper en Android con listas chicas). Como solo hay
 * 4-8 departamentos, no necesitamos virtualizar.
 */
export function DepartmentGrid({ title = 'Explora por departamento' }: Props) {
  const departments = useDepartmentStore((s) => s.departments);
  const router = useRouter();

  const handlePress = (slug: string) => {
    router.push({
      pathname: '/productos/[department]' as any,
      params: { department: slug },
    });
  };

  // Aplanamos a filas de 2 para controlar el gap.
  const rows: Department[][] = [];
  for (let i = 0; i < departments.length; i += 2) {
    rows.push(departments.slice(i, i + 2));
  }

  return (
    <View className="mt-5">
      {title ? (
        <View className="px-4 mb-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-foreground">{title}</Text>
        </View>
      ) : null}

      {departments.length === 0 ? (
        <View className="px-4">
          <Text className="text-xs text-muted text-center py-6">
            Todavía no hay departamentos cargados.
          </Text>
        </View>
      ) : (
        <View className="px-4 gap-3">
          {rows.map((row, i) => (
            <View key={`row-${i}`} className="flex-row gap-3">
              {row.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  department={dept}
                  onPress={() => handlePress(dept.tx_slug)}
                />
              ))}
              {row.length === 1 ? <View className="flex-1" /> : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

type CardProps = {
  department: Department;
  onPress: () => void;
};

function DepartmentCard({ department, onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-backgroundElement rounded-[14px] overflow-hidden"
      accessibilityRole="button"
      accessibilityLabel={`Ver ${department.nb_department}`}
    >
      <View
        className="aspect-square bg-white"
        style={{
          backgroundColor: department.col_department
            ? `${department.col_department}20`
            : undefined,
        }}
      >
        {department.tx_img_url ? (
          <Image
            source={{ uri: department.tx_img_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center px-2">
            <Text
              className="text-base font-bold text-center"
              style={{
                color: department.col_department ?? '#1A1A2E',
              }}
            >
              {department.nb_department}
            </Text>
          </View>
        )}
      </View>
      <View className="p-2">
        <Text
          className="text-sm font-bold text-foreground"
          numberOfLines={1}
        >
          {department.nb_department}
        </Text>
        {department.tx_description ? (
          <Text className="text-[11px] text-muted" numberOfLines={1}>
            {department.tx_description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
