import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';

import { useDepartmentStore } from '@/store';
import type { Department } from '@/types/whitelabel';

type Props = {
  title?: string;
  subtitle?: string;
};

/**
 * Bento grid de departamentos: el primero va destacado (más grande),
 * el resto en grilla 2x2 con aspect ratio ligeramente distinto para
 * romper la monotonía visual.
 *
 * Cards usan el `col_department` del whitelabel como color de acento,
 * con un inner shadow sutil via border + opacidad.
 */
export function DepartmentBento({
  title = 'Explora el catálogo',
  subtitle,
}: Props) {
  const departments = useDepartmentStore((s) => s.departments);
  const router = useRouter();

  if (departments.length === 0) {
    return (
      <View className="px-4 mt-6">
        <Text className="text-sm text-muted text-center py-6">
          Todavía no hay departamentos cargados.
        </Text>
      </View>
    );
  }

  const [first, ...rest] = departments;

  return (
    <View className="mt-6 px-4">
      <View className="mb-3">
        <Text className="text-lg font-bold text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="text-xs text-muted mt-0.5">{subtitle}</Text>
        ) : null}
      </View>

      {/* Featured: card grande, full width, aspect 16:10 */}
      {first ? (
        <BentoCard
          department={first}
          variant="featured"
          onPress={() =>
            router.push({
              pathname: '/productos/[department]' as any,
              params: { department: first.tx_slug },
            })
          }
        />
      ) : null}

      {/* Rest: 2 columns, aspect 4:5, slight gap variation */}
      {rest.length > 0 ? (
        <View className="flex-row flex-wrap mt-3 gap-3">
          {rest.map((d) => (
            <View key={d.id} className="basis-[calc(50%-6px)]">
              <BentoCard
                department={d}
                variant="compact"
                onPress={() =>
                  router.push({
                    pathname: '/productos/[department]' as any,
                    params: { department: d.tx_slug },
                  })
                }
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

type Variant = 'featured' | 'compact';

function BentoCard({
  department,
  variant,
  onPress,
}: {
  department: Department;
  variant: Variant;
  onPress: () => void;
}) {
  const isFeatured = variant === 'featured';
  const accent = department.col_department ?? '#0f766e';
  return (
    <Pressable
      onPress={onPress}
      className="bg-product-card rounded-[14px] overflow-hidden border border-border"
      style={{
        aspectRatio: isFeatured ? 16 / 10 : 4 / 5,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${department.nb_department}`}
    >
      {/* Background tinted with accent at 8% */}
      <View
        className="flex-1"
        style={{ backgroundColor: accent + '14' }}
      >
        {department.tx_img_url ? (
          <Image
            source={{ uri: department.tx_img_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center px-3">
            <Text
              className="text-xl font-bold text-center"
              style={{ color: accent }}
              numberOfLines={2}
            >
              {department.nb_department}
            </Text>
          </View>
        )}

        {/* Overlay gradient (cheap: just a translucent dark band at bottom) */}
        <View
          className="absolute left-0 right-0 bottom-0 px-3 py-2"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-2">
              <Text
                className="text-white font-bold"
                numberOfLines={1}
                style={{ fontSize: isFeatured ? 16 : 14 }}
              >
                {department.nb_department}
              </Text>
              {isFeatured && department.tx_description ? (
                <Text
                  className="text-white opacity-80 mt-0.5"
                  numberOfLines={1}
                  style={{ fontSize: 11 }}
                >
                  {department.tx_description}
                </Text>
              ) : null}
            </View>
            <View
              className="h-7 w-7 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.20)' }}
            >
              <ArrowUpRight size={14} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
