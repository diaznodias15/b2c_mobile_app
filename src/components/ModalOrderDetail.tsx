import { useState } from 'react';
import {
  Image as RNImage,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  CircleX,
  DollarSign,
  X,
} from 'lucide-react-native';

import { DualCurrencyText } from '@/components/DualCurrencyText';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { OrderStatusStepper } from '@/components/OrderStatusStepper';
import { Skeleton } from '@/components/Skeleton';
import { getOrderDetail } from '@/api/services/orders.services';
import { hexToRgba, type ThemeColors } from '@/theme/colors';
import { formatPrice } from '@/utils/currency';
import { FULFILLMENT_LABELS, PAYMENT_METHOD_LABELS } from '@/utils/orderStatus';
import { UNAVAILABLE_PRODUCT_IMAGE } from '@/utils/localImages.generated';
import type { OrderDetail, OrderProductItem } from '@/types/orders';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const COLLAPSE_ANIMATION = LayoutAnimation.create(
  200,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity
);

/** Data URI base64 embebido (ver el comentario largo en `ProductCard.tsx`). */
const PLACEHOLDER_IMAGE = { uri: UNAVAILABLE_PRODUCT_IMAGE };

const LINE_ITEMS: Array<{ key: keyof OrderDetail; label: string }> = [
  { key: 'qty_subtotal_amount', label: 'Subtotal' },
  { key: 'qty_discount_amount', label: 'Descuento' },
  { key: 'qty_tax_amount', label: 'Impuesto (IVA)' },
  { key: 'qty_delivery_amount', label: 'Envío' },
  { key: 'qty_igtf_amount', label: 'IGTF' },
];

/**
 * Modal full-screen de detalle de una orden (MY-ORDERS-MODULE.md §13).
 * Se abre al tocar una `OrderRow`. Trae el detalle recién al abrirse
 * (`enabled: visible && !!txOrderNumber`), no antes.
 */
export function ModalOrderDetail({
  visible,
  txOrderNumber,
  onClose,
  colors,
}: {
  visible: boolean;
  txOrderNumber: string | null;
  onClose: () => void;
  colors: ThemeColors;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['order-detail', txOrderNumber],
    queryFn: () => getOrderDetail(txOrderNumber as string),
    enabled: visible && !!txOrderNumber,
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 50,
            paddingBottom: 16,
            backgroundColor: colors.section,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
            <Text style={{ color: colors.muted, fontWeight: '400' }}>Orden </Text>
            #{txOrderNumber}
          </Text>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cerrar">
            <X size={22} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {isLoading && <OrderDetailSkeleton colors={colors} />}

          {!isLoading && isError && (
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 40 }}>
              Lo sentimos... ocurrió un error al intentar obtener el detalle de la orden.
            </Text>
          )}

          {!isLoading && !isError && data && (
            <>
              {data.tx_status !== 'CANCELED' && (
                <OrderStatusStepper active={data.in_status} colors={colors} />
              )}

              {data.tx_status === 'CANCELED' && (
                <View
                  style={{
                    backgroundColor: hexToRgba(colors.danger, 0.1),
                    borderRadius: 12,
                    padding: 14,
                    gap: 4,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <CircleX size={16} color={colors.danger} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger }}>
                      Pedido cancelado
                    </Text>
                  </View>
                  {data.tx_canceled_note && (
                    <Text style={{ fontSize: 13, color: colors.foreground }}>
                      {data.tx_canceled_note}
                    </Text>
                  )}
                </View>
              )}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  backgroundColor: colors.section,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <Text style={{ fontSize: 13, color: colors.muted }}>Estado.</Text>
                <OrderStatusBadge status={data.tx_status} colors={colors} />
                <View style={{ width: 1, height: 16, backgroundColor: colors.border }} />
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  Sede. <Text style={{ fontWeight: '600', color: colors.foreground }}>{data.tx_branch_alias}</Text>
                </Text>
              </View>

              <OrderProductsList items={data.product_items} colors={colors} />

              <OrderTotals data={data} colors={colors} />

              <Text style={{ fontSize: 13, color: colors.muted }}>
                Método de pago:{' '}
                <Text style={{ fontWeight: '600', color: colors.foreground }}>
                  {PAYMENT_METHOD_LABELS[data.tx_payment_method] ?? 'No identificado'}
                </Text>
                {'  ·  '}
                Tipo de envío:{' '}
                <Text style={{ fontWeight: '600', color: colors.foreground }}>
                  {FULFILLMENT_LABELS[data.fulfillment_type]}
                </Text>
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function OrderProductsList({
  items,
  colors,
}: {
  items: OrderProductItem[];
  colors: ThemeColors;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(COLLAPSE_ANIMATION);
    setIsOpen((v) => !v);
  };

  return (
    <View style={{ backgroundColor: colors.section, borderRadius: 12, padding: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
          <Text style={{ color: colors.muted, fontWeight: '400' }}>Productos. </Text>
          {items.length}
        </Text>
        <Pressable
          onPress={toggle}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: hexToRgba(colors.primary, 0.1),
          }}
          accessibilityRole="button"
          accessibilityLabel={isOpen ? 'Ocultar productos' : 'Ver productos'}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
            {isOpen ? 'Ocultar productos' : 'Ver productos'}
          </Text>
        </Pressable>
      </View>

      {isOpen && (
        <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
          {items.map((item, index) => (
            <OrderProductRow key={`${item.cod_barcode}-${index}`} item={item} colors={colors} />
          ))}
        </View>
      )}
    </View>
  );
}

function OrderProductRow({ item, colors }: { item: OrderProductItem; colors: ThemeColors }) {
  const [imageFailed, setImageFailed] = useState(false);
  const qty = Number(item.qty_product) || 0;
  const unitPrice = Number(item.pri_product_final_price) || 0;

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {!item.tx_img_url || imageFailed ? (
        <RNImage
          source={PLACEHOLDER_IMAGE}
          style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: colors.background }}
          resizeMode="contain"
        />
      ) : (
        <Image
          source={{ uri: item.tx_img_url }}
          onError={() => setImageFailed(true)}
          style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: colors.background }}
          contentFit="contain"
        />
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        {item.nb_brand && (
          <Text style={{ fontSize: 10, color: colors.muted, textTransform: 'uppercase' }} numberOfLines={1}>
            {item.nb_brand}
          </Text>
        )}
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }} numberOfLines={2}>
          {item.nb_product}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
          {qty} × {formatPrice(unitPrice, 'Bs.')}
        </Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>
        {formatPrice(qty * unitPrice, 'Bs.')}
      </Text>
    </View>
  );
}

function OrderTotals({ data, colors }: { data: OrderDetail; colors: ThemeColors }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(COLLAPSE_ANIMATION);
    setIsOpen((v) => !v);
  };

  return (
    <View style={{ backgroundColor: colors.section, borderRadius: 12, padding: 14, gap: 10 }}>
      <Pressable
        onPress={toggle}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
        accessibilityRole="button"
        accessibilityLabel={isOpen ? 'Ocultar totales' : 'Ver totales'}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: hexToRgba(colors.primary, 0.12),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DollarSign size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Monto total</Text>
          <DualCurrencyText
            value={data.qty_total_amount}
            amtExchangeRate={data.amt_exchange_rate}
            colors={colors}
          />
        </View>
        <ChevronDown
          size={18}
          color={colors.muted}
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {isOpen && (
        <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
          {LINE_ITEMS.map(({ key, label }) => (
            <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>{label}</Text>
              <DualCurrencyText
                value={data[key] as number}
                amtExchangeRate={data.amt_exchange_rate}
                colors={colors}
                size={12}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function OrderDetailSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ backgroundColor: colors.section, borderRadius: 12, padding: 14, gap: 10 }}>
        <Skeleton width={150} height={18} colors={colors} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Skeleton width={80} height={18} colors={colors} />
          <Skeleton width={80} height={18} colors={colors} />
        </View>
      </View>
      <View style={{ backgroundColor: colors.section, borderRadius: 12, padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Skeleton width={100} height={18} colors={colors} />
          <Skeleton width={80} height={18} colors={colors} />
        </View>
        <Skeleton width="100%" height={40} colors={colors} />
        <Skeleton width="100%" height={40} colors={colors} />
      </View>
    </View>
  );
}
