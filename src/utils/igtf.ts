/**
 * IGTF (Impuesto a las Grandes Transacciones Financieras) — 3% que la
 * ley venezolana aplica a pagos en divisas (CHECKOUT-FLOW.md §19.7).
 * Solo aplica cuando el cliente paga en USD (Zelle, o Efectivo si elige
 * moneda USD). La web tiene `1.03` hardcodeado en 2 lugares distintos
 * (bug conocido, §20.8) — acá vive en un solo lugar.
 */
export const IGTF_RATE = 0.03;

/**
 * Convierte un monto en Bs. al monto en USD que el cliente debe pagar,
 * incluyendo el recargo del IGTF. `exchangeRate` es la tasa vigente
 * (`appConfig.amt_exchange_rate`).
 */
export function calculateAmountWithIgtf(amountBs: number, exchangeRate: number): number {
  if (!exchangeRate || exchangeRate <= 0) return 0;
  return (amountBs * (1 + IGTF_RATE)) / exchangeRate;
}
