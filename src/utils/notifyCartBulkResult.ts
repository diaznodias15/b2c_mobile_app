import { Alert } from 'react-native';

import type { CartBulkResult } from '@/api/services/cart.services';
import { useToastStore } from '@/store/toast.store';

import { summarizeBulkResult } from './cartBulkResult';

/**
 * Avisa el resultado de "repetir pedido" / "agregar todos los favoritos": un toast si todo entró
 * completo; si algo se recortó u omitió (o no entró nada), un diálogo que lista cada producto
 * afectado con su motivo. Devuelve si se agregó al menos un producto.
 */
export function notifyCartBulkResult(result: CartBulkResult): boolean {
  const summary = summarizeBulkResult(result);
  if (summary.hasIssues || !summary.anyAdded) {
    Alert.alert(summary.title, summary.lines.join('\n') || undefined);
  } else {
    useToastStore.getState().show(summary.title);
  }
  return summary.anyAdded;
}
