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

/**
 * Preferencia de moneda del usuario (`useCurrencyStore`): `Bs.`
 * (bolívares) o `REF` (precio referencial en USD, la base que manda el
 * backend). Vive acá porque es la misma unión que usa `formatDisplayPrice`
 * para decidir cómo formatear — `currency.store.ts` la re-exporta.
 */
export type DisplayCurrency = 'Bs.' | 'REF';

export function roundTo(value: number, decimals = 2): number {
  // Pequeño epsilon para evitar el bug clásico de floating point
  // (e.g. 1.005 * 100 = 100.49999… → 1.00 en vez de 1.01).
  const f = 10 ** decimals;
  const epsilon = Number.EPSILON * Math.abs(value) * f;
  return Math.round(value * f + Math.sign(value) * epsilon) / f;
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

export function formatPrice(amount: number, currencyLabel: string): string {
  const formatted = roundTo(amount).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencyLabel} ${formatted}`;
}

/** Formato compacto sin decimales para badges (e.g. "Bs. 4.205"). */
export function formatPriceCompact(amount: number, currencyLabel: string): string {
  const formatted = roundTo(amount).toLocaleString('es-VE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${currencyLabel} ${formatted}`;
}

/**
 * Devuelve Bs. y USD a partir de un precio en USD y la tasa.
 * Si no hay rate (>0) o el precio es 0, devuelve la conversion como `null`
 * para que el caller oculte la linea secundaria.
 */
export function formatDualCurrency(
  usdAmount: number,
  exchangeRate: number | null | undefined
): { usd: string; bs: string | null } {
  const usd = formatPrice(usdAmount, 'USD');
  if (!exchangeRate || exchangeRate <= 0 || usdAmount <= 0) {
    return { usd, bs: null };
  }
  const bsAmount = convertPrice(usdAmount, 'USD', 'Bs.', exchangeRate);
  return { usd, bs: formatPriceCompact(bsAmount, 'Bs.') };
}

/**
 * Precio formateado según la preferencia de moneda del usuario
 * (`useCurrencyStore`). `usdAmount` siempre es el precio base en USD
 * (así vienen `pri_product_price`/`pri_product_final_price` del
 * backend). Si el usuario eligió `Bs.` pero no hay `exchangeRate` válido
 * todavía (config aún cargando), cae a `REF` — nunca muestra un
 * "Bs. 0.00" engañoso por falta de tasa.
 */
export function formatDisplayPrice(
  usdAmount: number,
  exchangeRate: number | null | undefined,
  displayCurrency: DisplayCurrency
): string {
  if (displayCurrency === 'Bs.' && exchangeRate && exchangeRate > 0) {
    return formatPrice(convertPrice(usdAmount, 'USD', 'Bs.', exchangeRate), 'Bs.');
  }
  return formatPrice(usdAmount, 'REF');
}
