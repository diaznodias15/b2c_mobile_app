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
 * Devuelve Bs. y USD a partir de un precio en Bs. (la base real que
 * manda el backend, ver el comentario de `formatDisplayPrice`) y la
 * tasa. Si no hay rate (>0) o el precio es 0, devuelve la conversion
 * como `null` para que el caller oculte la linea secundaria.
 */
export function formatDualCurrency(
  bsAmount: number,
  exchangeRate: number | null | undefined
): { bs: string; usd: string | null } {
  const bs = formatPrice(bsAmount, 'Bs.');
  if (!exchangeRate || exchangeRate <= 0 || bsAmount <= 0) {
    return { bs, usd: null };
  }
  const usdAmount = convertPrice(bsAmount, 'Bs.', 'USD', exchangeRate);
  return { bs, usd: formatPriceCompact(usdAmount, 'USD') };
}

/**
 * Precio formateado según la preferencia de moneda del usuario
 * (`useCurrencyStore`). `baseAmount` siempre es el precio base en Bs.
 * (así vienen `pri_product_price`/`pri_product_final_price` del
 * backend — a pesar de lo que sugiere el nombre del campo o el tipo
 * `Product`, NO son USD; confirmado contra la API real: un precio como
 * "5499.160" solo tiene sentido como Bs. — /814.69 ≈ $6.75, un huevo
 * a $5499 USD sería absurdo). `REF` es el precio referencial en USD,
 * calculado DIVIDIENDO por la tasa. Si el usuario eligió `REF` pero no
 * hay `exchangeRate` válido todavía (config aún cargando), cae a `Bs.`
 * — nunca muestra un "REF 0.00" engañoso por falta de tasa.
 */
export function formatDisplayPrice(
  baseAmount: number,
  exchangeRate: number | null | undefined,
  displayCurrency: DisplayCurrency
): string {
  if (displayCurrency === 'REF' && exchangeRate && exchangeRate > 0) {
    return formatPrice(convertPrice(baseAmount, 'Bs.', 'USD', exchangeRate), 'REF');
  }
  return formatPrice(baseAmount, 'Bs.');
}
