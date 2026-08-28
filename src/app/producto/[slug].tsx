import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Package,
  AlertTriangle,
  PackageX,
  Check,
} from 'lucide-react-native';

import { useBranchStore, useConfigStore, useUIStore } from '@/store';
import { useCartSync } from '@/features/cart/hooks/useCartSync';
import { useProductDetail } from '@/features/products/hooks/useProductDetail';
import { TopProductsCarousel } from '@/features/home/components/TopProductsCarousel';
import { BranchStockList } from '@/features/products/components/BranchStockList';
import { ProductDetailAccordion } from '@/features/products/components/ProductDetailAccordion';
import { QuantityStepper } from '@/features/products/components/QuantityStepper';
import { AddToCartCTA } from '@/features/products/components/AddToCartCTA';
import { BranchSelector } from '@/features/branches/components/BranchSelector';
import {
  STOCK_LABELS,
  hasDescription,
  hasFeatures,
  productDetailImage,
  availabilityForCurrentBranch,
} from '@/features/products/utils/adapters';
import {
  basePrice,
  discountPercent,
  finalPrice,
  hasDiscount,
} from '@/features/home/utils/adapters';
import { formatDualCurrency, formatPrice } from '@/utils/currency';
import type { StockLevel } from '@/types/whitelabel';

/** Devuelve el icono Lucide que matchea el nivel de stock. */
function stockIcon(level: StockLevel, color: string, size = 16) {
  if (level === 0) return <PackageX size={size} color={color} />;
  if (level === 1) return <AlertTriangle size={size} color={color} />;
  return <Check size={size} color={color} />;
}

/**
 * Pantalla de detalle de producto.
 *
 *  1. Header sticky: back + branch selector
 *  2. Imagen (singular, `product_img` del backend)
 *  3. Marca + nombre + precio final (con descuento tachado si aplica)
 *  4. Indicador de stock de la sede actual
 *  5. CTA inferior: quantity + "Agregar al carrito" (sticky)
 *  6. Descripción (accordion, default cerrado)
 *  7. Disponibilidad por sede (lista)
 *  8. Top products relacionados por marca
 */
export default function ProductDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const branchId = useBranchStore((s) => s.selectedBranch?.value) ?? null;
  const showToast = useUIStore((s) => s.showToast);
  const exchangeRateRaw = useConfigStore(
    (s) => s.appConfig?.amt_exchange_rate
  );
  const exchangeRate = exchangeRateRaw ? Number(exchangeRateRaw) : null;
  const { addProduct } = useCartSync();
  const { data, isLoading, isError } = useProductDetail(slug, branchId);
  const [qty, setQty] = useState(1);

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-sm text-muted text-center">
          No pudimos cargar el producto.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-3 bg-primary rounded-[14px] py-2 px-4"
        >
          <Text className="text-sm font-bold text-primary-foreground">Volver</Text>
        </Pressable>
      </View>
    );
  }

  const img = productDetailImage(data);
  const showDiscount = hasDiscount({
    pri_product_price: data.pri_product_price,
    pri_product_final_price: data.pri_product_final_price,
  } as any);
  const discount = discountPercent({
    pri_product_price: data.pri_product_price,
    pri_product_final_price: data.pri_product_final_price,
  } as any);
  const finalP = finalPrice({
    pri_product_final_price: data.pri_product_final_price,
  } as any);
  const baseP = basePrice({
    pri_product_price: data.pri_product_price,
  } as any);
  const current = availabilityForCurrentBranch(
    data.availability_per_branch,
    branchId
  );
  const stock = (current?.availability_indicator ?? 0) as StockLevel;
  const outOfStock = stock === 0;

  const handleAdd = () => {
    if (!branchId) return;
    addProduct({
      tx_slug: data.tx_slug,
      product_id: data.id,
      branch_id: branchId,
      nb_product: data.nb_product,
      nb_brand: data.nb_brand,
      tx_img_url: data.product_img,
      pri_product_final_price: data.pri_product_final_price,
      qty,
    });
    showToast({
      title: 'Producto agregado',
      description: `${qty} × ${data.nb_product}`,
      type: 'success',
    });
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header sticky */}
        <View className="flex-row items-center gap-2 px-4 py-2 border-b border-backgroundElement">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-backgroundElement"
            accessibilityLabel="Volver"
          >
            <ArrowLeft size={18} color="#1A1A2E" />
          </Pressable>
          <View className="flex-1 flex-row items-center gap-1">
            <MapPin size={12} color="#60646C" />
            <BranchSelector compact />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Imagen */}
          <View className="aspect-square bg-white">
            {img ? (
              <Image
                source={{ uri: img }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-sm text-muted">Sin imagen</Text>
              </View>
            )}
          </View>

          {/* Info principal */}
          <View className="px-4 pt-4 gap-2">
            <Text className="text-[11px] text-muted uppercase tracking-wider font-semibold">
              {data.nb_brand}
            </Text>
            <Text
              className="text-lg font-bold text-foreground"
              numberOfLines={3}
              style={{ lineHeight: 24 }}
            >
              {data.nb_product}
            </Text>
            <View className="mt-1">
              {showDiscount ? (
                <Text
                  className="text-xs text-muted line-through"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatPrice(baseP, 'USD')}
                </Text>
              ) : null}
              <View className="flex-row items-baseline gap-2">
                <Text
                  className="text-2xl font-bold text-foreground"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatPrice(finalP, 'USD')}
                </Text>
                {showDiscount ? (
                  <View
                    className="rounded-md px-1.5 py-0.5"
                    style={{ backgroundColor: '#F5A524' }}
                  >
                    <Text className="text-[10px] font-bold text-foreground">
                      -{discount}%
                    </Text>
                  </View>
                ) : null}
              </View>
              {(() => {
                const dual = formatDualCurrency(finalP, exchangeRate);
                return dual.bs ? (
                  <Text className="text-xs text-muted mt-0.5">
                    o {dual.bs} al cambio de hoy
                  </Text>
                ) : null;
              })()}
            </View>
            <View
              className="flex-row items-center gap-1.5 mt-2 self-start px-2.5 py-1 rounded-full"
              style={{
                backgroundColor:
                  outOfStock ? '#F8717115' : '#17C96415',
              }}
            >
              {stockIcon(
                stock,
                outOfStock ? '#F87171' : '#17C964',
                14
              )}
              <Text
                className={
                  outOfStock
                    ? 'text-xs font-semibold text-danger'
                    : 'text-xs font-semibold text-success'
                }
              >
                {STOCK_LABELS[stock]}
                {current && !outOfStock
                  ? ` · ${current.qty_product} disponibles`
                  : ''}
              </Text>
            </View>
          </View>

          {/* Acordeón de descripción */}
          {hasDescription(data) ? (
            <ProductDetailAccordion title="Descripción">
              <Text className="text-sm text-foreground leading-5">
                {data.tx_description}
              </Text>
            </ProductDetailAccordion>
          ) : null}

          {/* Acordeón de features */}
          {hasFeatures(data) ? (
            <ProductDetailAccordion title="Características">
              <View className="gap-1">
                {data.product_features!.map((f, i) => (
                  <View key={i} className="flex-row items-baseline gap-1">
                    <Text className="text-xs text-muted">•</Text>
                    <Text className="text-sm text-foreground">
                      {f.nb_feature ? `${f.nb_feature}: ` : ''}
                      {f.tx_value}
                    </Text>
                  </View>
                ))}
              </View>
            </ProductDetailAccordion>
          ) : null}

          {/* Disponibilidad por sede */}
          <View className="mt-3">
            <Text className="text-sm font-bold text-foreground px-4 mb-2">
              Disponibilidad por sede
            </Text>
            <BranchStockList tree={data.availability_per_branch} />
          </View>

          {/* Top products relacionados por marca */}
          {data.brand_slug ? (
            <View className="mt-3">
              <TopProductsCarousel
                title={`Otros de ${data.nb_brand}`}
              />
            </View>
          ) : null}
        </ScrollView>

        {/* CTA inferior sticky */}
        <View className="absolute bottom-0 left-0 right-0">
          <View className="flex-row items-center gap-2 bg-background border-t border-backgroundElement px-4 pt-3 pb-1">
            <Text className="text-xs text-muted">Cantidad</Text>
            <QuantityStepper
              value={qty}
              onChange={setQty}
              disabled={outOfStock}
            />
          </View>
          <AddToCartCTA
            disabled={outOfStock}
            priceText={formatPrice(finalP * qty, 'USD')}
            onPress={handleAdd}
            label={outOfStock ? 'Sin stock' : 'Agregar al carrito'}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
