import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useDepartmentStore } from '@/store';
import type { Department } from '@/types/whitelabel';

type Props = {
  /** Título de la sección. */
  title?: string;
};

/**
 * Grid 2 columnas de departamentos.
 * Click → /productos/[department] (Fase 3, hoy stub).
 */
export function DepartmentGrid({ title = 'Explora por departamento' }: Props) {
  const departments = useDepartmentStore((s) => s.departments);
  const router = useRouter();

  if (departments.length === 0) return null;

  return (
    <View className="mt-5">
      <View className="px-4 mb-2 flex-row items-center justify-between">
        <Text className="text-base font-bold text-foreground">{title}</Text>
      </View>
      <FlatList
        data={departments}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <DepartmentCard
            department={item}
            onPress={() =>
              router.push({
                pathname: '/productos/[department]' as any,
                params: { department: item.tx_slug },
              })
            }
          />
        )}
        scrollEnabled={false}
      />
    </View>
  );
}

function keyExtractor(d: Department): string {
  return String(d.id);
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
