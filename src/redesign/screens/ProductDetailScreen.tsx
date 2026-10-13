import { useState } from 'react';
import { Dimensions, Image as RNImage, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useSharedValue } from 'react-native-reanimated';
import { Carousel, Pagination } from 'react-native-reanimated-carousel';
import { Check, ChevronLeft, ShoppingCart } from 'lucide-react-native';

import { getProductDetail } from '@/api/services/products.services';
import { BranchInventoryList } from '@/components/BranchInventoryList';
import { ProductDetailMessage } from '@/components/ProductDetailMessage';
import { useAddToCartFlight } from '@/hooks/useAddToCartFlight';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { useSlowLoading } from '@/hooks/useSlowLoading';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { toAvailability } from '@/utils/cartStock';
import { formatDisplayPrice } from '@/utils/currency';
import { UNAVAILABLE_PRODUCT_IMAGE } from '@/utils/localImages.generated';
import { getProductPricing } from '@/utils/pricing';
import { getProductDetailView } from '@/utils/productDetailState';

import { ProductDetailSkeleton, PRODUCT_DETAIL_IMAGE_HEIGHT } from '../components/ProductDetailSkeleton';
import { QuantityStepper } from '../components/QuantityStepper';
import { TopProducts } from '../components/TopProducts';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PriceBlock } from '../ui/PriceBlock';
import { StockPill } from '../ui/StockPill';
import { Surface } from '../ui/Surface';
import { Txt } from '../ui/Txt';
import { LOW_STOCK_THRESHOLD } from '../ui/stockLevel';
import { MIN_TOUCH } from '../ui/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;

/** Mismo fallback que las cards (data URI embebido, ver `ProductCard`). */
const PLACEHOLDER_IMAGE = { uri: UNAVAILABLE_PRODUCT_IMAGE };

/**
 * Detalle de producto del rediseño. Reutiliza TODA la lógica de `product/[slug].tsx`
 * (consulta por slug + sede, estados `getProductDetailView`, agregar con
 * `useAddToCartFlight`, toast, reset de cantidad) y cambia presentación e interacción:
 *
 *  - **Barra de compra fija abajo** con el stepper y el CTA: en el original había que
 *    hacer scroll hasta el final del bloque de precio para poder agregar.
 *  - Tarjeta de precio: precio final grande, tachado, `-N%`, ahorro y stock juntos.
 *  - Total de la cantidad elegida visible en la barra.
 *  - Galería algo menos alta (90 % del ancho) para ver el precio sin scroll.
 *  - Botón de volver de 48 dp sobre un círculo claro (era de 38 sobre un velo oscuro).
 *  - Descripción plegable (antes se cortaba a 3 líneas sin forma de leerla completa).
 *
 * Sigue sin desglose de IVA: la API real solo manda `qty_tax`/`qty_discount` (ver AGENTS.md).
 * El inventario por sede y los estados de error/lento reutilizan los componentes actuales.
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
  const refreshControl = useRefreshControl();

  const [quantity, setQuantity] = useState(1);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const { imageRef, isAdding, isSubmitting, addWithFlight } = useAddToCartFlight();

  const [retryCount, setRetryCount] = useState(0);
  const {
    data: product,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product-detail', slug, branchId],
    queryFn: () => getProductDetail(slug as string, { branch: branchId as number }),
    enabled: Boolean(slug) && branchId !== null,
  });

  const isSlow = useSlowLoading(isFetching && !product, retryCount);
  const view = getProductDetailView({
    hasSlug: Boolean(slug),
    hasBranch: branchId !== null,
    hasData: Boolean(product),
    isFetching,
    isError,
    isSlow,
  });
  const handleRetry = () => {
    setRetryCount((count) => count + 1);
    void refetch();
  };

  // Cada caso sin datos tiene su pantalla (ver `utils/productDetailState.ts`).
  if (view !== 'ready' || !product) {
    const showSkeleton = view === 'loading' || view === 'slow';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <BackButton onPress={() => router.back()} top={insets.top} />
        {showSkeleton ? (
          <>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ProductDetailSkeleton colors={colors} />
            </ScrollView>
            {view === 'slow' && (
              <View
                style={{
                  position: 'absolute',
                  left: 16,
                  right: 16,
                  bottom: insets.bottom + 16,
                  backgroundColor: colors.background,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <ProductDetailMessage
                  kind="slow"
                  compact
                  onRetry={handleRetry}
                  onBack={() => router.back()}
                  colors={colors}
                />
              </View>
            )}
          </>
        ) : (
          <ProductDetailMessage
            kind={view === 'error' || view === 'no-branch' ? view : 'not-found'}
            detail={view === 'error' ? error?.message : undefined}
            onRetry={handleRetry}
            onBack={() => router.back()}
            colors={colors}
          />
        )}
      </View>
    );
  }

  const images = product.product_img?.map((img) => img.tx_img_url) ?? [];
  const { basePrice, finalPrice, hasDiscount } = getProductPricing(product);
  const unitsAvailable = Number(product.qty_product) || 0;
  const maxQty = Math.max(1, unitsAvailable);
  const hasPrice = finalPrice > 0;
  const canAddToCart = hasPrice && unitsAvailable > 0;
  const atMax = canAddToCart && quantity >= maxQty;
  const savings = hasDiscount ? basePrice - finalPrice : 0;

  const handleAddToCart = () => {
    if (branchId === null || !canAddToCart) return;
    void addWithFlight(images.length > 0 ? { uri: images[0] } : PLACEHOLDER_IMAGE, async () => {
      const added = await addProduct({
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
        qty_availability: toAvailability(product.qty_product),
        qty: quantity,
      });
      // Con sesión espera a la API; toast y animación solo si el servidor aceptó.
      if (added) {
        showToast('Producto agregado al carrito');
        setQuantity(1);
      }
      return added;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <View
          ref={imageRef}
          style={{
            width: SCREEN_WIDTH,
            height: PRODUCT_DETAIL_IMAGE_HEIGHT,
            backgroundColor: colors.section,
          }}
        >
          {images.length > 0 ? (
            <>
              <Carousel
                style={{ width: SCREEN_WIDTH, height: PRODUCT_DETAIL_IMAGE_HEIGHT }}
                data={images}
                loop={images.length > 1}
                onProgressChange={(p) => {
                  carouselProgress.value = p;
                }}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                )}
              />
              {images.length > 1 && (
                <Pagination
                  count={images.length}
                  progress={carouselProgress}
                  containerStyle={{ position: 'absolute', bottom: 12, left: 0, right: 0, gap: 6 }}
                  dotStyle={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border }}
                  activeDotStyle={{ backgroundColor: colors.primary }}
                />
              )}
            </>
          ) : (
            <RNImage source={PLACEHOLDER_IMAGE} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          )}
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }}>
          <View>
            <Txt variant="caption" color="muted" colors={colors}>
              {product.nb_brand}
            </Txt>
            <Txt variant="title" colors={colors} style={{ marginTop: 2 }}>
              {product.nb_product}
            </Txt>
          </View>

          <Surface colors={colors} padding={16} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flexShrink: 1 }}>
                <PriceBlock product={product} size="lg" colors={colors} />
              </View>
              {hasDiscount && <Badge label={`-${Number(product.qty_discount)}%`} colors={colors} />}
            </View>
            {savings > 0 && (
              <Txt variant="caption" color="success" colors={colors} style={{ fontWeight: '700', color: colors.success }}>
                Ahorras {formatDisplayPrice(savings, exchangeRate, displayCurrency)}
              </Txt>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <StockPill level={product.availability_indicator} colors={colors} />
              {canAddToCart && unitsAvailable <= LOW_STOCK_THRESHOLD && (
                <Txt variant="caption" color="warning" colors={colors} style={{ color: colors.foreground, fontWeight: '700' }}>
                  Quedan {unitsAvailable} {unitsAvailable === 1 ? 'unidad' : 'unidades'}
                </Txt>
              )}
            </View>
          </Surface>

          {product.tx_description ? (
            <View>
              <Txt variant="section" colors={colors} style={{ marginBottom: 6 }}>
                Descripción
              </Txt>
              <Txt variant="body" color="muted" colors={colors} numberOfLines={descriptionOpen ? undefined : 3}>
                {product.tx_description}
              </Txt>
              <Pressable
                onPress={() => setDescriptionOpen((open) => !open)}
                accessibilityRole="button"
                accessibilityLabel={descriptionOpen ? 'Ver menos descripción' : 'Ver toda la descripción'}
                style={{ minHeight: MIN_TOUCH, justifyContent: 'center', alignSelf: 'flex-start' }}
              >
                <Txt variant="label" color="primary" colors={colors}>
                  {descriptionOpen ? 'Ver menos' : 'Ver más'}
                </Txt>
              </Pressable>
            </View>
          ) : null}

          {product.product_features && product.product_features.length > 0 && (
            <View>
              <Txt variant="section" colors={colors} style={{ marginBottom: 8 }}>
                Características
              </Txt>
              <Surface colors={colors} padding={0} style={{ overflow: 'hidden' }}>
                {product.product_features.map((feature, index) => (
                  <View
                    key={`${feature.tx_label}-${index}`}
                    style={{
                      flexDirection: 'row',
                      gap: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Txt variant="caption" color="muted" colors={colors} style={{ width: 120 }}>
                      {feature.tx_label}
                    </Txt>
                    <Txt variant="label" colors={colors} style={{ flex: 1, fontWeight: '500' }}>
                      {feature.tx_description}
                    </Txt>
                  </View>
                ))}
              </Surface>
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

        <View style={{ height: 24 }} />
      </ScrollView>

      <BackButton onPress={() => router.back()} top={insets.top} />

      <View
        style={{
          backgroundColor: colors.productCard,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: insets.bottom + 10,
          gap: 8,
        }}
      >
        {canAddToCart && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt variant="caption" color={atMax ? 'warning' : 'muted'} colors={colors} style={atMax ? { color: colors.foreground, fontWeight: '700' } : undefined}>
              {atMax ? 'Cantidad máxima disponible' : 'Total'}
            </Txt>
            <Txt variant="label" colors={colors} style={{ fontWeight: '800' }}>
              {formatDisplayPrice(finalPrice * quantity, exchangeRate, displayCurrency)}
            </Txt>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <QuantityStepper
            value={quantity}
            max={maxQty}
            onChange={setQuantity}
            colors={colors}
            disabled={!canAddToCart || isSubmitting}
          />
          <View style={{ flex: 1 }}>
            <Button
              label={
                !hasPrice
                  ? 'No disponible'
                  : !canAddToCart
                    ? 'Sin stock'
                    : isSubmitting
                      ? 'Agregando…'
                      : isAdding
                        ? 'Agregado'
                        : 'Agregar al carrito'
              }
              icon={canAddToCart ? (isAdding ? Check : ShoppingCart) : undefined}
              onPress={handleAddToCart}
              loading={isSubmitting}
              disabled={!canAddToCart}
              accessibilityLabel={canAddToCart ? 'Agregar al carrito' : undefined}
              colors={colors}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Volver: círculo claro de 44 dp (+`hitSlop` hasta 48+) sobre la galería. */
function BackButton({ onPress, top }: { onPress: () => void; top: number }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      style={({ pressed }) => ({
        position: 'absolute',
        top: top + 8,
        left: 12,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <ChevronLeft size={24} color="#1A1A2E" />
    </Pressable>
  );
}
