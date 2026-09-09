import { axiosRequest } from '../axiosRequest';
import type { PaymentMethodsConfig } from '@/types/checkout';
import type { Envelope } from '@/types/whitelabel';

const ENDPOINT = '/api/config/payment-methods';

/**
 * Trae los receptores configurados por método de pago (Pago Móvil,
 * Transferencia, Zelle) + el catálogo de bancos (CHECKOUT-FLOW.md §9).
 * Cualquier clave que la API no incluya se normaliza a `[]` — el admin
 * puede no tener configurado, por ejemplo, Zelle.
 */
export async function getPaymentMethods(options?: {
  signal?: AbortSignal;
}): Promise<PaymentMethodsConfig> {
  const envelope = await axiosRequest<Envelope<Partial<PaymentMethodsConfig>>>({
    method: 'GET',
    url: ENDPOINT,
    signal: options?.signal,
  });
  return {
    pago_movil: envelope.data?.pago_movil ?? [],
    transferencia_bancaria: envelope.data?.transferencia_bancaria ?? [],
    zelle: envelope.data?.zelle ?? [],
    banks: envelope.data?.banks ?? [],
  };
}
