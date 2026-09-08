import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useSharedValue } from 'react-native-reanimated';
import { Carousel, Pagination } from 'react-native-reanimated-carousel';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';

import { BranchInventoryList } from '@/components/BranchInventoryList';
import { ProductDetailSkeleton } from '@/components/ProductDetailSkeleton';
import { getProductDetail } from '@/api/services/products.services';
import { useBranchStore, selectEffectiveBranchId } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useConfigStore, useThemeColors } from '@/store/config.store';
import { useCurrencyStore } from '@/store/currency.store';
import { formatDisplayPrice } from '@/utils/currency';
import { STOCK_META } from '@/utils/stock';
import type { ThemeColors } from '@/theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_HEIGHT = SCREEN_WIDTH;

/** Mismo fallback que `ProductCard`/`ProductListItem`. */
const PLACEHOLDER_IMAGE = require('../../../assets/images/unavailable-product-image.webp');

/**
 * `qty_tax`/`qty_discount` son los únicos campos de impuesto que
 * realmente devuelve esta API hoy — NO existen `pri_product_price_with_tax`,
 * `qty_tax_amount`, etc. que sugiere la doc de referencia de la web
 * (confirmado contra la API real, 2026-09-08). Por eso el breakdown de
 * IVA de la web (bloque 5.2) no se portea: solo mostramos precio final +
 * tachado si hay descuento, igual que ProductCard/ProductListItem.
 */

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const carouselProgress = useSharedValue(0);

  const branchId = useBranchStore(selectEffectiveBranchId);
  const addProduct = useCartStore((s) => s.addProduct);
  const displayCurrency = useCurrencyStore((s) => s.displayCurrency);
  const exchangeRate = useConfigStore((s) => s.appConfig?.amt_exchange_rate);

  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', slug, branchId],
    queryFn: () => getProductDetail(slug as string, { branch: branchId as number }),
    enabled: Boolean(slug) && branchId !== null,
  });

  if (isLoading || !product) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <BackButton onPress={() => router.back()} insets={insets} colors={colors} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <ProductDetailSkeleton colors={colors} />
        </ScrollView>
      </View>
    );
  }

  const images = product.product_img?.map((img) => img.tx_img_url) ?? [];
  const finalPrice = Number(product.pri_product_final_price);
  const basePrice = Number(product.pri_product_price);
  const hasDiscount = Boolean(product.qty_discount) && basePrice > finalPrice;
  const maxQty = Math.max(1, Number(product.qty_product) || 1);
  const canAddToCart = finalPrice > 0 && Number(product.qty_product) > 0;
  const availability = STOCK_META[product.availability_indicator];

  const handleAddToCart = () => {
    if (branchId === null || !canAddToCart) return;
    addProduct({
      tx_slug: product.tx_slug,
      product_id: product.id,
      branch_id: branchId,
      nb_product: product.nb_product,
      nb_brand: product.nb_brand,
      tx_img_url: images[0] ?? null,
      pri_product_final_price: product.pri_product_final_price,
      qty: quantity,
    });
    setQuantity(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT, backgroundColor: colors.section }}>
          {images.length > 0 ? (
            <>
              <Carousel
                style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
                data={images}
                loop={images.length > 1}
                onProgressChange={(p) => {
                  carouselProgress.value = p;
                }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                  />
                )}
              />
              {images.length > 1 && (
                <Pagination
                  count={images.length}
                  progress={carouselProgress}
                  containerStyle={{
                    position: 'absolute',
                    bottom: 12,
                    left: 0,
                    right: 0,
                    gap: 6,
                  }}
                  dotStyle={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border }}
                  activeDotStyle={{ backgroundColor: colors.primary }}
                />
              )}
            </>
          ) : (
            <Image
              source={PLACEHOLDER_IMAGE}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
            />
          )}
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          {hasDiscount && (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: colors.danger,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                -{product.qty_discount}% de descuento
              </Text>
            </View>
          )}

          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 4 }}>
            {product.nb_brand}
          </Text>
          <Text style={{ fontSize: 21, fontWeight: '700', color: colors.foreground, lineHeight: 27 }}>
            {product.nb_product}
          </Text>
          {product.tx_description && (
            <Text
              numberOfLines={3}
              style={{ fontSize: 14, color: colors.muted, marginTop: 8, lineHeight: 20 }}
            >
              {product.tx_description}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors[availability.colorKey] as string,
              }}
            />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
              {availability.label}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 12 }}>
            {hasDiscount && (
              <Text
                style={{ fontSize: 14, color: colors.muted, textDecorationLine: 'line-through' }}
              >
                {formatDisplayPrice(basePrice, exchangeRate, displayCurrency)}
              </Text>
            )}
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
              {formatDisplayPrice(finalPrice, exchangeRate, displayCurrency)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 }}>
            <QuantityStepper
              value={quantity}
              max={maxQty}
              onChange={setQuantity}
              colors={colors}
              disabled={!canAddToCart}
            />
            <Pressable
              onPress={handleAddToCart}
              disabled={!canAddToCart}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: canAddToCart ? colors.primary : colors.border,
              }}
              accessibilityRole="button"
              accessibilityLabel="Agregar al carrito"
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: canAddToCart ? colors.onPrimary : colors.muted,
                }}
              >
                {canAddToCart ? 'Agregar al carrito' : 'Sin stock'}
              </Text>
            </Pressable>
          </View>

          {product.product_features && product.product_features.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground, marginBottom: 10 }}>
                Características
              </Text>
              <View
                style={{
                  backgroundColor: colors.section,
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                {product.product_features.map((feature, index) => (
                  <View
                    key={`${feature.tx_label}-${index}`}
                    style={{
                      flexDirection: 'row',
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Text style={{ width: 140, fontSize: 13, color: colors.muted }}>
                      {feature.tx_label}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 13, color: colors.foreground }}>
                      {feature.tx_description}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {product.availability_per_branch && (
            <BranchInventoryList
              availabilityPerBranch={product.availability_per_branch}
              currentBranchId={branchId}
              colors={colors}
            />
          )}
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>

      <BackButton onPress={() => router.back()} insets={insets} colors={colors} />
    </View>
  );
}

function BackButton({
  onPress,
  insets,
  colors,
}: {
  onPress: () => void;
  insets: { top: number };
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        top: insets.top + 10,
        left: 16,
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
      }}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      hitSlop={8}
    >
      <ChevronLeft size={22} color="#FFFFFF" />
    </Pressable>
  );
}

function QuantityStepper({
  value,
  max,
  onChange,
  colors,
  disabled,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  colors: ThemeColors;
  disabled: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: colors.section,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 46,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Pressable
        onPress={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        accessibilityRole="button"
        accessibilityLabel="Restar cantidad"
        hitSlop={8}
      >
        <Minus size={16} color={colors.foreground} />
      </Pressable>
      <Text
        style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, minWidth: 20, textAlign: 'center' }}
        accessibilityLiveRegion="polite"
      >
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        accessibilityRole="button"
        accessibilityLabel="Sumar cantidad"
        hitSlop={8}
      >
        <Plus size={16} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
