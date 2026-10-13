import { ScrollView } from 'react-native';

import { useSafePush } from '@/hooks/useSafePush';
import { useDepartmentStore } from '@/store/department.store';
import type { ThemeColors } from '@/theme/colors';

import { Chip } from '../ui/Chip';

/**
 * Fila de accesos rápidos a los departamentos (se desliza con el dedo). Es un atajo de un toque
 * al listado de cada departamento desde el Home, antes de tener que bajar hasta la cuadrícula.
 * No renderiza nada si aún no hay departamentos cargados.
 */
export function DepartmentChips({ colors }: { colors: ThemeColors }) {
  const departments = useDepartmentStore((s) => s.departments);
  const push = useSafePush();

  if (departments.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4, gap: 8 }}
      accessibilityLabel="Departamentos"
    >
      {departments.map((department) => (
        <Chip
          key={department.id}
          label={department.nb_department}
          onPress={() => push(`/products/${department.tx_slug}`)}
          colors={colors}
        />
      ))}
    </ScrollView>
  );
}
