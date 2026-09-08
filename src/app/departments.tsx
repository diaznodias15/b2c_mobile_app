import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PackageSearch, RefreshCcw } from 'lucide-react-native';

import { BottomTabs } from '@/components/bottom-tabs';
import { DepartmentCard } from '@/components/DepartmentCard';
import { bootstrapConfig } from '@/components/Providers';
import { useThemeColors } from '@/store/config.store';
import { useDepartmentStore } from '@/store/department.store';
import type { Department } from '@/types/whitelabel';

export default function DepartmentsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const departments = useDepartmentStore((s) => s.departments);
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={departments}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingHorizontal: 24,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        columnWrapperStyle={departments.length > 0 ? { gap: 12 } : undefined}
        ListHeaderComponent={
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: colors.foreground,
              marginTop: 16,
              marginBottom: 16,
            }}
          >
            Departamentos
          </Text>
        }
        ListEmptyComponent={<EmptyDepartments colors={colors} />}
        renderItem={({ item }: { item: Department }) => (
          <DepartmentCard
            department={item}
            colors={colors}
            onPress={() => router.push('/departments')}
          />
        )}
      />
      <BottomTabs />
    </View>
  );
}

function EmptyDepartments({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    await bootstrapConfig();
    setIsRetrying(false);
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 48,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryOverlaySoft,
          marginBottom: 20,
        }}
      >
        <PackageSearch size={40} color={colors.primary} strokeWidth={1.6} />
      </View>

      <Text
        style={{
          fontSize: 17,
          fontWeight: '700',
          color: colors.foreground,
          textAlign: 'center',
          marginBottom: 6,
        }}
      >
        Todavía no hay departamentos
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.muted,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: 24,
        }}
      >
        No pudimos encontrar departamentos disponibles en este momento.{'\n'}
        Probá recargar en unos segundos.
      </Text>

      <Pressable
        onPress={handleRetry}
        disabled={isRetrying}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 999,
          backgroundColor: colors.primary,
          opacity: isRetrying ? 0.7 : 1,
        }}
        accessibilityRole="button"
        accessibilityLabel="Reintentar carga de departamentos"
      >
        <RefreshCcw size={16} color={colors.onPrimary} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.onPrimary }}>
          {isRetrying ? 'Recargando…' : 'Reintentar'}
        </Text>
      </Pressable>
    </View>
  );
}
