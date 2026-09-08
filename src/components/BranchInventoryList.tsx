import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { MapPin, Store } from 'lucide-react-native';

import { useBranchStore } from '@/store/branch.store';
import { haversineDistanceKm } from '@/utils/geo';
import { STOCK_META } from '@/utils/stock';
import type { ThemeColors } from '@/theme/colors';
import type { AvailabilityByBranch, BranchAvailability } from '@/types/whitelabel';

const MAX_LIST_HEIGHT = 340;

/**
 * Igual criterio que `hasValidCoordinates` de `utils/geo.ts`, pero para
 * `BranchAvailability` (lat/lng vienen `number | string` acá, a
 * diferencia de `BranchItem`). El backend usa `0, 0` ("null island")
 * para "sin coordenadas cargadas", no `null`.
 */
function hasCoords(branch: { lat?: number | string; lng?: number | string }): boolean {
  const lat = Number(branch.lat);
  const lng = Number(branch.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
}

/**
 * "Inventario por sede": lista de todas las sedes con stock del
 * producto actual. Tocar una sede la vuelve la sede activa
 * (`setSelectedBranch`) — el detalle re-fetchea solo porque su query
 * key incluye `branchId` (ver `product/[slug].tsx`), no hace falta
 * ningún callback extra acá. Distancia calculada con Haversine desde
 * la sede actualmente activa (no la ubicación del dispositivo — eso es
 * `BranchSelectorModal`, un caso distinto).
 */
export function BranchInventoryList({
  availabilityPerBranch,
  currentBranchId,
  colors,
}: {
  availabilityPerBranch: AvailabilityByBranch[];
  currentBranchId: number | null;
  colors: ThemeColors;
}) {
  const setSelectedBranch = useBranchStore((s) => s.setSelectedBranch);

  const branches = availabilityPerBranch.flatMap((state) =>
    state.cities.flatMap((city) => city.branches)
  );

  if (branches.length === 0) return null;

  const globalStock = branches.reduce((acc, b) => acc + Number(b.qty_product || 0), 0);
  const currentBranch = branches.find((b) => b.branch_id === currentBranchId);

  function handleSelect(branch: BranchAvailability) {
    if (branch.branch_id === currentBranchId) return;
    setSelectedBranch({
      value: branch.branch_id,
      label: branch.label,
      nb_branch: branch.nb_branch,
      tx_alias: branch.label,
      tx_address: branch.tx_address,
      tx_phone: branch.tx_phone,
      tx_working_hours: branch.tx_working_hours,
      lat: typeof branch.lat === 'string' ? Number(branch.lat) : branch.lat,
      lng: typeof branch.lng === 'string' ? Number(branch.lng) : branch.lng,
    });
  }

  return (
    <View style={{ marginTop: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primaryOverlaySoft,
          }}
        >
          <Store size={15} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>
          Inventario por sede
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 12, color: colors.muted }}>
          {branches.length} {branches.length === 1 ? 'sede consultada' : 'sedes consultadas'}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>
          Stock total <Text style={{ fontWeight: '700', color: colors.foreground }}>{globalStock} und.</Text>
        </Text>
      </View>

      <ScrollView
        style={{ maxHeight: MAX_LIST_HEIGHT }}
        nestedScrollEnabled={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 8 }}>
          {branches.map((branch) => {
            const isCurrent = branch.branch_id === currentBranchId;
            const meta = STOCK_META[branch.availability_indicator];
            const distanceKm =
              currentBranch && hasCoords(currentBranch) && hasCoords(branch)
                ? haversineDistanceKm(
                    Number(currentBranch.lat),
                    Number(currentBranch.lng),
                    Number(branch.lat),
                    Number(branch.lng)
                  )
                : null;

            return (
              <Pressable
                key={branch.branch_id}
                onPress={() => handleSelect(branch)}
                disabled={isCurrent}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  backgroundColor: colors.section,
                  borderRadius: 12,
                  padding: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: isCurrent
                    ? colors.primary
                    : (colors[meta.colorKey] as string),
                }}
                accessibilityRole="button"
                accessibilityLabel={isCurrent ? `${branch.label}, tu sede actual` : `Cambiar a ${branch.label}`}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                      style={{ fontSize: 13.5, fontWeight: '700', color: colors.foreground, flexShrink: 1 }}
                      numberOfLines={1}
                    >
                      {branch.label}
                    </Text>
                    {isCurrent && (
                      <View
                        style={{
                          backgroundColor: colors.primaryOverlaySoft,
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>
                          Tu sede
                        </Text>
                      </View>
                    )}
                  </View>
                  {branch.tx_address && (
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}
                    >
                      {branch.tx_address}
                    </Text>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors[meta.colorKey] as string,
                      }}
                    />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
                      {meta.label}
                    </Text>
                  </View>
                </View>

                {distanceKm != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <MapPin size={11} color={colors.muted} />
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      {distanceKm < 1
                        ? `${Math.round(distanceKm * 1000)} m`
                        : `${distanceKm.toFixed(1).replace('.', ',')} km`}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
