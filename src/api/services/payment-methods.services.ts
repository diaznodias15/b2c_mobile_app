import { axiosRequest } from '../axiosRequest';
import type { PaymentMethod } from '@/types/cart';
import type { Envelope } from '@/types/whitelabel';

const ENDPOINT = '/api/config/payment-methods';

/**
 * Trae los métodos de pago activos (transfer, Zelle, Binance, efectivo, etc).
 * Se cachea por 5 minutos — los métodos no cambian frecuente.
 */
export async function getPaymentMethods(options?: {
  signal?: AbortSignal;
}): Promise<PaymentMethod[]> {
  const envelope = await axiosRequest<Envelope<PaymentMethod[]>>({
    method: 'GET',
    url: ENDPOINT,
    signal: options?.signal,
  });
  return envelope.data ?? [];
}
