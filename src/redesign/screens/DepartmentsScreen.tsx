import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PackageSearch, RefreshCcw } from 'lucide-react-native';

import { bootstrapConfig } from '@/components/Providers';
import { Skeleton } from '@/components/Skeleton';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { useSafePush } from '@/hooks/useSafePush';
import { useThemeColors } from '@/store/config.store';
import { useDepartmentStore } from '@/store/department.store';
import type { ThemeColors } from '@/theme/colors';
import type { Department } from '@/types/whitelabel';

import { BottomTabs } from '../components/bottom-tabs';
import { DEPARTMENT_CARD_HEIGHT, DEPARTMENT_CARD_WIDTH, DepartmentCard } from '../components/DepartmentCard';
import { Button } from '../ui/Button';
import { Txt } from '../ui/Txt';

/**
 * Departamentos (pestaña) del rediseño. Misma lógica que `departments.tsx` (lista desde
 * `useDepartmentStore`, pull-to-refresh compartido, "Reintentar" que vuelve a pedir la config con
 * `bootstrapConfig`) con otra presentación:
 *
 *  - Título y una línea de contexto ("N departamentos") con margen de 16.
 *  - Cada tarjeta lleva al listado del departamento (`/products/<slug>`, con `useSafePush`).
 *  - Estado vacío con el botón "Reintentar" de 48 dp y la cuadrícula en esqueleto mientras reintenta.
 */
export default function DepartmentsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const departments = useDepartmentStore((s) => s.departments);
  const push = useSafePush();
  const refreshControl = useRefreshControl();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={departments}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        style={{ flex: 1 }}
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        columnWrapperStyle={departments.length > 0 ? { gap: 12 } : undefined}
        ListHeaderComponent={
          <View style={{ marginBottom: 16, gap: 2 }}>
            <Txt variant="title" colors={colors}>
              Departamentos
            </Txt>
            {departments.length > 0 ? (
              <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '400' }}>
                {departments.length} {departments.length === 1 ? 'departamento' : 'departamentos'} para explorar
              </Txt>
            ) : null}
          </View>
        }
        ListEmptyComponent={<EmptyDepartments colors={colors} />}
        renderItem={({ item }: { item: Department }) => (
          <DepartmentCard department={item} colors={colors} onPress={() => push(`/products/${item.tx_slug}`)} />
        )}
      />
      <BottomTabs />
    </View>
  );
}

function EmptyDepartments({ colors }: { colors: ThemeColors }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    await bootstrapConfig();
    setIsRetrying(false);
  };

  if (isRetrying) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 32 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} width={DEPARTMENT_CARD_WIDTH} height={DEPARTMENT_CARD_HEIGHT} borderRadius={16} colors={colors} />
        ))}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 16 }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryOverlay,
          marginBottom: 20,
        }}
      >
        <PackageSearch size={42} color={colors.primary} strokeWidth={1.6} />
      </View>
      <Txt variant="section" colors={colors} style={{ textAlign: 'center', marginBottom: 6 }}>
        Todavía no hay departamentos
      </Txt>
      <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center', marginBottom: 20 }}>
        No pudimos encontrar departamentos disponibles en este momento. Prueba a recargar en unos segundos.
      </Txt>
      <Button label="Reintentar" icon={RefreshCcw} fullWidth={false} onPress={handleRetry} colors={colors} />
    </View>
  );
}
