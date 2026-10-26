import { Alert } from 'react-native';

import type { CartBulkResult } from '@/api/services/cart.services';
import { useToastStore } from '@/store/toast.store';

import { summarizeBulkResult } from './cartBulkResult';

/**
 * Avisa el resultado de "repetir pedido" / "agregar todos los favoritos": un toast si todo entró
 * completo; si algo se recortó u omitió (o no entró nada), un diálogo que lista cada producto
 * afectado con su motivo. Devuelve si se agregó al menos un producto.
 */
export function notifyCartBulkResult(
  result: CartBulkResult,
  texts: { message?: string | null; emptyMessage?: string } = {}
): boolean {
  const summary = summarizeBulkResult(result, texts);
  if (summary.hasIssues || !summary.anyAdded) {
    const body = [summary.detail, ...summary.lines].filter(Boolean).join('\n');
    Alert.alert(summary.title, body || undefined);
  } else {
    useToastStore.getState().show(summary.title);
  }
  return summary.anyAdded;
}
