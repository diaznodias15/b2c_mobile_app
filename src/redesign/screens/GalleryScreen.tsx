import { useCallback, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Heart, ListFilter, Search, ShoppingCart } from 'lucide-react-native';

import { getTopProducts } from '@/api/services/products.services';
import { ProductCard as ProductCardV1 } from '@/components/ProductCard';
import { useListAddToCart } from '@/hooks/useListAddToCart';
import { useSafePush } from '@/hooks/useSafePush';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useThemeColors } from '@/store/config.store';
import type { Product } from '@/types/whitelabel';

import { ProductCard as ProductCardV2 } from '../components/ProductCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { IconButton } from '../ui/IconButton';
import { PriceBlock } from '../ui/PriceBlock';
import { StockPill } from '../ui/StockPill';
import { Surface } from '../ui/Surface';
import { Txt } from '../ui/Txt';
import { TYPE, type TypeVariant } from '../ui/tokens';

/**
 * Galería interna del rediseño (paso 0.3): muestra las primitivas y compara el
 * `ProductCard` actual contra el v2 con productos reales y casos límite (descuento,
 * sin stock, sin precio, nombre largo). Solo existe en desarrollo; se abre con el
 * deep link `maraplusmobileapp://redesign-gallery`.
 */
export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const push = useSafePush();
  const colors = useThemeColors();
  const branchId = useBranchStore(selectEffectiveBranchId);
  const handleAddToCart = useListAddToCart();

  const { data } = useQuery({
    queryKey: ['top-products', branchId, null],
    queryFn: () => getTopProducts(branchId as number),
    enabled: branchId !== null,
  });

  // Casos límite derivados de un producto real (no se inventan datos de catálogo).
  const samples = useMemo<{ label: string; product: Product }[]>(() => {
    const base = data?.find((p) => Number(p.pri_product_price) > 0 && p.tx_img_url) ?? data?.[0];
    if (!base) return [];
    const price = Number(base.pri_product_price);
    return [
      { label: 'Normal', product: base },
      {
        label: 'Con descuento',
        product: {
          ...base,
          id: -1,
          qty_discount: 20,
          pri_product_price: String(price),
          pri_product_final_price: String(price * 0.8),
        },
      },
      { label: 'Pocas unidades', product: { ...base, id: -2, qty_product: 2 } },
      { label: 'Sin stock', product: { ...base, id: -3, qty_product: 0 } },
      { label: 'Sin precio', product: { ...base, id: -4, pri_product_price: '0', pri_product_final_price: '0' } },
      {
        label: 'Nombre largo y precio grande',
        product: {
          ...base,
          id: -5,
          nb_product: 'SUPLEMENTO VITAMINICO MULTIPLE CON MINERALES Y ANTIOXIDANTES X 120 CAPSULAS BLANDAS',
          pri_product_price: '1761911.72',
          pri_product_final_price: '1761911.72',
        },
      },
    ];
  }, [data]);

  const handlePress = useCallback((product: Product) => push(`/product/${product.tx_slug}`), [push]);

  if (!__DEV__) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 16,
        gap: 28,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconButton icon={ChevronLeft} label="Volver" onPress={() => router.back()} colors={colors} />
        <Txt variant="title" colors={colors}>
          Galería del rediseño
        </Txt>
      </View>

      <Section title="Tipografía (mín. 12 px)">
        <Surface colors={colors} style={{ gap: 6 }}>
          {(Object.keys(TYPE) as TypeVariant[]).map((variant) => (
            <Txt key={variant} variant={variant} colors={colors}>
              {variant} · {TYPE[variant].fontSize}/{TYPE[variant].lineHeight}
            </Txt>
          ))}
        </Surface>
      </Section>

      <Section title="Botones">
        <Button label="Agregar al carrito" icon={ShoppingCart} onPress={() => {}} colors={colors} />
        <Button label="Ver detalle" variant="secondary" onPress={() => {}} colors={colors} />
        <Button label="Cancelar" variant="ghost" onPress={() => {}} colors={colors} />
        <Button label="Cargando" loading onPress={() => {}} colors={colors} />
        <Button label="Deshabilitado" disabled onPress={() => {}} colors={colors} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton icon={Search} label="Buscar" onPress={() => {}} colors={colors} />
          <IconButton icon={Heart} label="Favorito" variant="filled" onPress={() => {}} colors={colors} />
          <IconButton icon={ListFilter} label="Filtros" variant="plain" onPress={() => {}} colors={colors} />
        </View>
      </Section>

      <Section title="Chips y badges">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="Todos" selected onPress={() => {}} colors={colors} />
          <Chip label="Ofertas" onPress={() => {}} colors={colors} />
          <Chip label="Filtros" icon={ListFilter} count={2} onPress={() => {}} colors={colors} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Badge label="-20%" colors={colors} />
          <Badge label="Nuevo" tone="success" colors={colors} />
          <Badge label="Destacado" tone="primary" colors={colors} />
        </View>
      </Section>

      <Section title="Stock y precio">
        <View style={{ flexDirection: 'row', gap: 20 }}>
          <StockPill level={2} colors={colors} />
          <StockPill level={1} colors={colors} />
          <StockPill level={0} colors={colors} />
        </View>
        {samples[1] && <PriceBlock product={samples[1].product} size="lg" colors={colors} />}
      </Section>

      <Section title="ProductCard · actual (izquierda) vs v2 (derecha)">
        {samples.length === 0 ? (
          <Txt variant="body" color="muted" colors={colors}>
            Cargando productos de la sede…
          </Txt>
        ) : (
          samples.map(({ label, product }) => (
            <View key={label} style={{ gap: 8 }}>
              <Txt variant="label" color="muted" colors={colors}>
                {label}
              </Txt>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                <ProductCardV1
                  product={product}
                  colors={colors}
                  onPress={handlePress}
                  onAddToCart={handleAddToCart}
                />
                <ProductCardV2
                  product={product}
                  colors={colors}
                  onPress={handlePress}
                  onAddToCart={handleAddToCart}
                />
              </ScrollView>
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={{ gap: 12 }}>
      <Txt variant="section" colors={colors}>
        {title}
      </Txt>
      {children}
    </View>
  );
}
