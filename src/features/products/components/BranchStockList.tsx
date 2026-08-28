import { Text, View } from 'react-native';
import {
  MapPin,
  Phone,
  Clock,
  AlertTriangle,
  PackageX,
  Check,
} from 'lucide-react-native';

import {
  STOCK_LABELS,
  flattenAvailability,
} from '@/features/products/utils/adapters';
import { formatPrice } from '@/utils/currency';
import { useBranchStore } from '@/store';
import type {
  AvailabilityByBranch,
  BranchAvailability,
  StockLevel,
} from '@/types/whitelabel';

type Props = {
  tree: AvailabilityByBranch[] | undefined;
};

function stockIcon(level: StockLevel, color: string, size = 13) {
  if (level === 0) return <PackageX size={size} color={color} />;
  if (level === 1) return <AlertTriangle size={size} color={color} />;
  return <Check size={size} color={color} />;
}

function stockColor(level: StockLevel): string {
  if (level === 0) return '#F87171';
  if (level === 1) return '#F5A524';
  return '#17C964';
}

/**
 * Lista de sedes con disponibilidad del producto.
 * Cada fila muestra: icono de stock + nombre + dirección + horario +
 * teléfono + precio final. La sede actualmente seleccionada va destacada.
 */
export function BranchStockList({ tree }: Props) {
  const currentBranchId = useBranchStore((s) => s.selectedBranch?.value);
  const flat = flattenAvailability(tree);

  if (flat.length === 0) {
    return (
      <View className="px-4 py-3">
        <Text className="text-xs text-muted">
          No hay información de disponibilidad por sede.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {flat.map((b) => {
        const isActive = b.branch_id === currentBranchId;
        return <BranchRow key={b.branch_id} branch={b} active={isActive} />;
      })}
    </View>
  );
}

function BranchRow({
  branch,
  active,
}: {
  branch: BranchAvailability;
  active: boolean;
}) {
  const stock = branch.availability_indicator as StockLevel;
  const color = stockColor(stock);
  return (
    <View
      className={`mx-4 rounded-[14px] p-3 border ${
        active
          ? 'bg-primary/5 border-primary/30'
          : 'bg-product-card border-border'
      }`}
    >
      <View className="flex-row items-center gap-2">
        {stockIcon(stock, color)}
        <Text
          className={
            active
              ? 'text-sm font-bold text-primary'
              : 'text-sm font-bold text-foreground'
          }
          numberOfLines={1}
        >
          {branch.label}
        </Text>
        {active ? (
          <View className="ml-auto bg-primary rounded-full px-2 py-0.5">
            <Text className="text-[10px] font-bold text-primary-foreground">
              Tu sede
            </Text>
          </View>
        ) : null}
      </View>
      <View className="mt-1.5 ml-5 gap-0.5">
        {branch.tx_address ? (
          <View className="flex-row items-center gap-1">
            <MapPin size={11} color="#60646C" />
            <Text className="text-[11px] text-muted" numberOfLines={2}>
              {branch.tx_address}
            </Text>
          </View>
        ) : null}
        {branch.tx_working_hours ? (
          <View className="flex-row items-center gap-1">
            <Clock size={11} color="#60646C" />
            <Text className="text-[11px] text-muted">
              {branch.tx_working_hours}
            </Text>
          </View>
        ) : null}
        {branch.tx_phone ? (
          <View className="flex-row items-center gap-1">
            <Phone size={11} color="#60646C" />
            <Text className="text-[11px] text-muted">{branch.tx_phone}</Text>
          </View>
        ) : null}
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-[11px] font-medium" style={{ color }}>
            {STOCK_LABELS[stock]} · {branch.qty_product} unidades
          </Text>
          <Text
            className="text-sm font-bold text-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatPrice(Number(branch.pri_product_final_price), 'USD')}
          </Text>
        </View>
      </View>
    </View>
  );
}
