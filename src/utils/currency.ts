/**
 * Helpers de moneda para Venezuela (Bs. / USD).
 * Equivalente a la lógica de `formatPrice` de la web.
 */

export type Currency = {
  id: number;
  nb_currency: string;
  tx_symbol: string;
  alias: string;
  qty_exchange_rate?: number;
};

export function roundTo(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/**
 * Convierte un precio USD → Bs. o viceversa según el rate configurado.
 * Si `currencyValue` es 'USD' y el precio base está en Bs., divide.
 * Si es 'Bs.' y el base está en USD, multiplica.
 */
export function convertPrice(
  basePrice: number,
  baseCurrencyAlias: 'Bs.' | 'USD',
  targetCurrencyAlias: 'Bs.' | 'USD',
  exchangeRate: number
): number {
  if (baseCurrencyAlias === targetCurrencyAlias) return basePrice;
  if (baseCurrencyAlias === 'Bs.' && targetCurrencyAlias === 'USD') {
    return roundTo(basePrice / exchangeRate);
  }
  return roundTo(basePrice * exchangeRate);
}

export function formatPrice(
  amount: number,
  currencyAlias: 'Bs.' | 'USD'
): string {
  const formatted = roundTo(amount).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencyAlias} ${formatted}`;
}
