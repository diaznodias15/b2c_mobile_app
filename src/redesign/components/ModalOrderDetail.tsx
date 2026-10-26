import { useEffect, useRef, useState } from 'react';
import {
  Image as RNImage,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  UIManager,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronDown, CircleAlert, CircleCheck, CircleX, RotateCcw, X } from 'lucide-react-native';

import type { PaginatedOrders } from '@/api/services/orders.services';
import { repeatOrder } from '@/api/services/cart.services';
import { getOrderDetail } from '@/api/services/orders.services';
import { Skeleton } from '@/components/Skeleton';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { hexToRgba, type ThemeColors } from '@/theme/colors';
import type { OrderDetail, OrderProductItem } from '@/types/orders';
import { formatPrice } from '@/utils/currency';
import { notifyCartBulkResult } from '@/utils/notifyCartBulkResult';
import { UNAVAILABLE_PRODUCT_IMAGE } from '@/utils/localImages.generated';
import { describeStatusRefresh, patchOrderStatusInPage } from '@/utils/orderList';
import { FULFILLMENT_LABELS, getOrderStatusConfig, PAYMENT_METHOD_LABELS } from '@/utils/orderStatus';
import { getOrderStatusStep } from '@/utils/orderStatusStep';

import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Surface } from '../ui/Surface';
import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';
import { DualCurrencyText } from './DualCurrencyText';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderStatusStepper } from './OrderStatusStepper';

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

const LINE_ITEMS: { key: keyof OrderDetail; label: string }[] = [
  { key: 'qty_subtotal_amount', label: 'Subtotal' },
  { key: 'qty_discount_amount', label: 'Descuento' },
  { key: 'qty_tax_amount', label: 'Impuesto (IVA)' },
  { key: 'qty_delivery_amount', label: 'Envío' },
  { key: 'qty_igtf_amount', label: 'IGTF' },
];

/** Hasta cuántos productos se muestran ya desplegados (más que eso, plegados). */
const OPEN_PRODUCTS_UP_TO = 3;

/**
 * Detalle de una orden en un modal de pantalla completa. **Mismo contrato que
 * `@/components/ModalOrderDetail`** (`visible`, `txOrderNumber`, `onClose`, `colors`) y misma
 * lógica: el detalle se pide al abrirse (`enabled: visible && !!txOrderNumber`); el
 * pull-to-refresh salta el anti-duplicados (`fresh`), dice si el estado cambió o sigue igual y
 * actualiza la insignia de la lista de fondo; el aviso va DENTRO del modal porque el `Toast`
 * global queda tapado por el `Modal` nativo; una recarga fallida no borra un detalle ya visto.
 *
 * Qué cambia (solo presentación):
 *  - Cabecera con el número de orden y un botón de cerrar de 48 dp, respetando el área segura
 *    (el original fijaba 50 px de relleno).
 *  - Tarjeta de estado con el progreso grande (ver `OrderStatusStepper`).
 *  - Sede, método de pago y tipo de envío como filas etiquetadas (eran una frase de 13 px).
 *  - Productos ya desplegados cuando son pocos (hasta 3), con imagen de 56.
 *  - "Monto total" en Bs. y REF con el desglose plegable en una fila de 48 dp.
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const branchId = useBranchStore(selectEffectiveBranchId);
  const [repeating, setRepeating] = useState(false);
  // `true` solo durante una recarga voluntaria: salta el anti-duplicados de `axiosRequest`.
  const freshRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  // Aviso del resultado de la recarga, ligado a la orden para no mostrarse en otra al cambiar.
  const [note, setNote] = useState<{ order: string; text: string; failed: boolean } | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (noteTimer.current) clearTimeout(noteTimer.current);
    },
    []
  );
  const showNote = (order: string, text: string, failed = false) => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    setNote({ order, text, failed });
    noteTimer.current = setTimeout(() => setNote(null), 5000);
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['order-detail', txOrderNumber],
    queryFn: () => getOrderDetail(txOrderNumber as string, undefined, { fresh: freshRef.current }),
    enabled: visible && !!txOrderNumber,
  });

  /**
   * Pull-to-refresh del detalle: para verificar cambios de estado. El backend cachea el detalle
   * (24 h) pero invalida esa caché en cada cambio de estado, así que una recarga trae el estado
   * real. Dice si cambió o sigue igual y pone al día la insignia de la lista sin volver a pedirla.
   */
  const handleRefresh = async () => {
    if (refreshing || !txOrderNumber) return;
    const previous = data?.tx_status;
    setRefreshing(true);
    freshRef.current = true;
    try {
      const result = await refetch();
      const next = result.data?.tx_status;
      if (result.isError || !next) {
        showNote(txOrderNumber, 'No se pudo actualizar. Revisa tu conexión.', true);
        return;
      }
      queryClient.setQueriesData<PaginatedOrders>({ queryKey: ['my-orders'] }, (page) =>
        page ? patchOrderStatusInPage(page, txOrderNumber, next) : page
      );
      showNote(
        txOrderNumber,
        describeStatusRefresh(previous, next, (status) => getOrderStatusConfig(status, colors)?.label ?? status)
      );
    } finally {
      freshRef.current = false;
      setRefreshing(false);
    }
  };

  /**
   * "Repetir pedido": suma al carrito de la sede ACTUAL los productos de esta orden. El backend
   * recorta al stock y usa los precios vigentes, así que se avisa qué quedó incompleto y se repone
   * el carrito local desde el servidor antes de abrirlo.
   */
  const handleRepeat = async () => {
    if (repeating || !txOrderNumber || branchId === null) return;
    setRepeating(true);
    try {
      const { data: result } = await repeatOrder(txOrderNumber, branchId);
      const added = notifyCartBulkResult(result);
      await useCartStore.getState().refreshFromServer(branchId);
      if (added) {
        onClose();
        router.replace('/cart');
      }
    } catch (err) {
      showNote(
        txOrderNumber,
        err instanceof Error && err.message ? err.message : 'No se pudo repetir el pedido. Inténtalo de nuevo.',
        true
      );
    } finally {
      setRepeating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: insets.top + 8,
            paddingBottom: 8,
            backgroundColor: colors.productCard,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Txt variant="caption" color="muted" colors={colors}>
              Orden
            </Txt>
            <Txt variant="section" colors={colors} numberOfLines={1}>
              #{txOrderNumber}
            </Txt>
          </View>
          <IconButton icon={X} label="Cerrar" onPress={onClose} variant="plain" colors={colors} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              colors={[colors.primary]}
              tintColor={colors.primary}
              progressBackgroundColor={colors.background}
            />
          }
        >
          {note && note.order === txOrderNumber && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: hexToRgba(note.failed ? colors.danger : colors.primary, 0.12),
              }}
              accessibilityRole="alert"
            >
              {note.failed ? (
                <CircleAlert size={18} color={colors.danger} />
              ) : (
                <CircleCheck size={18} color={colors.primary} />
              )}
              <View style={{ flex: 1 }}>
                <Txt variant="label" colors={colors}>
                  {note.text}
                </Txt>
              </View>
            </View>
          )}

          {isLoading && <OrderDetailSkeleton colors={colors} />}

          {/* Solo se reemplaza el detalle por el error si NO hay datos: una recarga fallida no
              debe borrar un detalle que ya se estaba viendo. */}
          {!isLoading && isError && !data && (
            <View style={{ paddingVertical: 40, gap: 12, alignItems: 'center' }}>
              <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center' }}>
                Lo sentimos... ocurrió un error al intentar obtener el detalle de la orden.
              </Txt>
              <Txt variant="caption" color="muted" colors={colors} style={{ textAlign: 'center' }}>
                Desliza hacia abajo para intentarlo de nuevo.
              </Txt>
            </View>
          )}

          {!isLoading && data && (
            <>
              <Surface colors={colors} padding={14} style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Txt variant="label" color="muted" colors={colors}>
                    Estado
                  </Txt>
                  <OrderStatusBadge status={data.tx_status} colors={colors} />
                </View>

                {data.tx_status === 'CANCELED' ? (
                  <View
                    style={{ backgroundColor: hexToRgba(colors.danger, 0.1), borderRadius: 12, padding: 12, gap: 4 }}
                    accessibilityRole="alert"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CircleX size={18} color={colors.danger} />
                      <Txt variant="label" color="danger" colors={colors} style={{ fontWeight: '800' }}>
                        Pedido cancelado
                      </Txt>
                    </View>
                    {data.tx_canceled_note ? (
                      <Txt variant="label" colors={colors} style={{ fontWeight: '500' }}>
                        {data.tx_canceled_note}
                      </Txt>
                    ) : null}
                  </View>
                ) : (
                  <OrderStatusStepper active={getOrderStatusStep(data.tx_status)} colors={colors} />
                )}
              </Surface>

              <Surface colors={colors} padding={0} style={{ overflow: 'hidden' }}>
                <InfoRow label="Sede" value={data.tx_branch_alias} colors={colors} />
                <InfoRow
                  label="Método de pago"
                  value={PAYMENT_METHOD_LABELS[data.tx_payment_method] ?? 'No identificado'}
                  colors={colors}
                  bordered
                />
                <InfoRow
                  label="Tipo de envío"
                  value={FULFILLMENT_LABELS[data.fulfillment_type]}
                  colors={colors}
                  bordered
                />
              </Surface>

              <OrderProductsList items={data.product_items} colors={colors} />

              <OrderTotals data={data} colors={colors} />

              <Button
                label="Repetir pedido"
                icon={RotateCcw}
                onPress={() => void handleRepeat()}
                loading={repeating}
                disabled={branchId === null}
                colors={colors}
              />
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function InfoRow({
  label,
  value,
  colors,
  bordered,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
  bordered?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderTopWidth: bordered ? 1 : 0,
        borderTopColor: colors.border,
      }}
    >
      <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '500' }}>
        {label}
      </Txt>
      <View style={{ flex: 1 }}>
        <Txt variant="label" colors={colors} style={{ textAlign: 'right' }}>
          {value}
        </Txt>
      </View>
    </View>
  );
}

function OrderProductsList({ items, colors }: { items: OrderProductItem[]; colors: ThemeColors }) {
  const [isOpen, setIsOpen] = useState(items.length <= OPEN_PRODUCTS_UP_TO);

  const toggle = () => {
    LayoutAnimation.configureNext(COLLAPSE_ANIMATION);
    setIsOpen((v) => !v);
  };

  return (
    <Surface colors={colors} padding={0} style={{ overflow: 'hidden' }}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={isOpen ? 'Ocultar productos' : 'Ver productos'}
        accessibilityState={{ expanded: isOpen }}
        style={{
          minHeight: MIN_TOUCH,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
        }}
      >
        <Txt variant="label" colors={colors}>
          Productos{' '}
          <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '500' }}>
            ({items.length})
          </Txt>
        </Txt>
        <ChevronDown
          size={20}
          color={colors.muted}
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {isOpen && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          {items.map((item, index) => (
            <OrderProductRow
              key={`${item.cod_barcode}-${index}`}
              item={item}
              colors={colors}
              bordered={index > 0}
            />
          ))}
        </View>
      )}
    </Surface>
  );
}

function OrderProductRow({
  item,
  colors,
  bordered,
}: {
  item: OrderProductItem;
  colors: ThemeColors;
  bordered: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const qty = Number(item.qty_product) || 0;
  const unitPrice = Number(item.pri_product_final_price) || 0;
  const imageStyle = { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.section };

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 14,
        borderTopWidth: bordered ? 1 : 0,
        borderTopColor: colors.border,
      }}
    >
      {!item.tx_img_url || imageFailed ? (
        <RNImage source={PLACEHOLDER_IMAGE} style={imageStyle} resizeMode="contain" />
      ) : (
        <Image
          source={{ uri: item.tx_img_url }}
          onError={() => setImageFailed(true)}
          style={imageStyle}
          contentFit="contain"
        />
      )}
      <View style={{ flex: 1 }}>
        {item.nb_brand ? (
          <Txt variant="caption" color="muted" colors={colors} numberOfLines={1}>
            {item.nb_brand}
          </Txt>
        ) : null}
        <Txt variant="label" colors={colors} numberOfLines={2}>
          {item.nb_product}
        </Txt>
        <Txt variant="caption" color="muted" colors={colors} style={{ marginTop: 2 }}>
          {qty} × {formatPrice(unitPrice, 'Bs.')}
        </Txt>
      </View>
      <Txt variant="label" colors={colors} style={{ fontWeight: '800' }}>
        {formatPrice(qty * unitPrice, 'Bs.')}
      </Txt>
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
    <Surface colors={colors} padding={0} style={{ overflow: 'hidden' }}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={isOpen ? 'Ocultar el desglose del total' : 'Ver el desglose del total'}
        accessibilityState={{ expanded: isOpen }}
        style={{
          minHeight: MIN_TOUCH + 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color="muted" colors={colors}>
            Monto total
          </Txt>
          <DualCurrencyText
            value={data.qty_total_amount}
            amtExchangeRate={data.amt_exchange_rate}
            colors={colors}
            size={16}
          />
        </View>
        <ChevronDown
          size={20}
          color={colors.muted}
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {isOpen && (
        <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: colors.border, padding: 14 }}>
          {LINE_ITEMS.map(({ key, label }) => (
            <View
              key={key}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
            >
              <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '500' }}>
                {label}
              </Txt>
              <DualCurrencyText
                value={data[key] as number}
                amtExchangeRate={data.amt_exchange_rate}
                colors={colors}
                size={13}
              />
            </View>
          ))}
        </View>
      )}
    </Surface>
  );
}

function OrderDetailSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View style={{ gap: 12 }}>
      <Surface colors={colors} padding={14} style={{ gap: 12 }}>
        <Skeleton width="100%" height={6} borderRadius={3} colors={colors} />
        <Skeleton width="45%" height={18} colors={colors} />
      </Surface>
      <Surface colors={colors} padding={14} style={{ gap: 12 }}>
        <Skeleton width="100%" height={16} colors={colors} />
        <Skeleton width="100%" height={16} colors={colors} />
        <Skeleton width="100%" height={16} colors={colors} />
      </Surface>
      <Surface colors={colors} padding={14} style={{ gap: 10 }}>
        <Skeleton width="100%" height={56} colors={colors} />
        <Skeleton width="100%" height={56} colors={colors} />
      </Surface>
    </View>
  );
}
