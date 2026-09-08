import { useConfigStore } from '@/store/config.store';
import { useCurrencyStore, type DisplayCurrency } from '@/store/currency.store';

/**
 * `{ displayCurrency, exchangeRate }` — el par que casi todo lugar que
 * muestra un precio necesita para llamar `formatDisplayPrice`. Repetido
 * verbatim en ProductCard/ProductListItem/product detail/cart antes de
 * este hook. Ambos selectores son primitivos (no arman un objeto nuevo
 * en el store), así que esto es seguro sin `useMemo` — ver el
 * anti-patrón de selectors de Zustand documentado en AGENTS.md.
 */
export function useDisplayCurrency(): {
  displayCurrency: DisplayCurrency;
  exchangeRate: number | undefined;
} {
  const displayCurrency = useCurrencyStore((s) => s.displayCurrency);
  const exchangeRate = useConfigStore((s) => s.appConfig?.amt_exchange_rate);
  return { displayCurrency, exchangeRate };
}
