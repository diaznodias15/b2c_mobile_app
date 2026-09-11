import { useState } from 'react';
import { Dimensions, Image as RNImage, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useSharedValue } from 'react-native-reanimated';
import { Carousel, Pagination } from 'react-native-reanimated-carousel';
import { Check, ChevronLeft } from 'lucide-react-native';

import { BranchInventoryList } from '@/components/BranchInventoryList';
import { DiscountBadge } from '@/components/DiscountBadge';
import { ProductDetailSkeleton } from '@/components/ProductDetailSkeleton';
import { QuantityStepper } from '@/components/QuantityStepper';
import { TopProducts } from '@/components/TopProducts';
import { getProductDetail } from '@/api/services/products.services';
import { useAddToCartFlight } from '@/hooks/useAddToCartFlight';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useBranchStore, selectEffectiveBranchId } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { formatDisplayPrice } from '@/utils/currency';
import { getProductPricing } from '@/utils/pricing';
import { STOCK_META } from '@/utils/stock';
import { UNAVAILABLE_PRODUCT_IMAGE } from '@/utils/localImages.generated';
import type { ThemeColors } from '@/theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_HEIGHT = SCREEN_WIDTH;

/**
 * Mismo fallback que `ProductCard`/`ProductListItem`. Data URI base64
 * embebido (ver el comentario largo en `ProductCard.tsx`).
 */
const PLACEHOLDER_IMAGE = { uri: UNAVAILABLE_PRODUCT_IMAGE };

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
  const showToast = useToastStore((s) => s.show);
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  const [quantity, setQuantity] = useState(1);
  const { imageRef, isAdding, trigger } = useAddToCartFlight();

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
  const { basePrice, finalPrice, hasDiscount } = getProductPricing(product);
  const maxQty = Math.max(1, Number(product.qty_product) || 1);
  const canAddToCart = finalPrice > 0 && Number(product.qty_product) > 0;
  const availability = STOCK_META[product.availability_indicator];

  const handleAddToCart = () => {
    if (branchId === null || !canAddToCart) return;
    const started = trigger(images.length > 0 ? { uri: images[0] } : PLACEHOLDER_IMAGE);
    if (!started) return;

    addProduct({
      tx_slug: product.tx_slug,
      product_id: product.id,
      branch_id: branchId,
      nb_product: product.nb_product,
      nb_brand: product.nb_brand,
      tx_img_url: images[0] ?? null,
      pri_product_final_price: product.pri_product_final_price,
      pri_product_price: product.pri_product_price,
      qty_discount: product.qty_discount,
      qty_tax: product.qty_tax,
      qty: quantity,
    });
    showToast('Producto agregado al carrito');
    setQuantity(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          ref={imageRef}
          style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT, backgroundColor: colors.section }}
        >
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
            <RNImage
              source={PLACEHOLDER_IMAGE}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          {hasDiscount && (
            <View style={{ marginBottom: 12 }}>
              <DiscountBadge
                percent={product.qty_discount as number | string}
                colors={colors}
                size="lg"
                suffix="% de descuento"
              />
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
              disabled={!canAddToCart || isAdding}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: canAddToCart ? colors.primary : colors.border,
                opacity: isAdding ? 0.7 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="Agregar al carrito"
            >
              {isAdding && <Check size={16} color={colors.onPrimary} strokeWidth={2.5} />}
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: canAddToCart ? colors.onPrimary : colors.muted,
                }}
              >
                {!canAddToCart ? 'Sin stock' : isAdding ? 'Agregado' : 'Agregar al carrito'}
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

        {product.brand_slug && (
          <TopProducts
            colors={colors}
            title={`Productos de la marca ${product.nb_brand}`}
            subtitle="Descubre los productos más populares entre nuestros clientes."
            brand={product.brand_slug}
            excludeSlug={product.tx_slug}
          />
        )}

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
