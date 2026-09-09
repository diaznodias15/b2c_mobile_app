/**
 * Tipos del checkout Full (CHECKOUT-FLOW.md). El checkout Lite no usa
 * nada de acá — solo pide datos de contacto (`ContactInfo` en
 * `types/cart.ts`).
 */

/**
 * Forma real de `GET /api/config/payment-methods` — NO es un array
 * plano como se había asumido antes de tener CHECKOUT-FLOW.md. Cada
 * clave es la lista de "receptores" configurados para ese método (el
 * admin puede cargar más de un banco/cuenta por método), y `banks` es
 * el catálogo de bancos venezolanos para el selector "Banco de origen"
 * (PAGOMOVIL/TRANSFERENCIA). Cualquier clave ausente en la respuesta
 * se normaliza a `[]` en `getPaymentMethods()`.
 */
export type PaymentMethodsConfig = {
  pago_movil: PagoMovilReceiver[];
  transferencia_bancaria: TransferenciaReceiver[];
  zelle: ZelleReceiver[];
  banks: BankOption[];
};

export type PagoMovilReceiver = {
  cod_rif: string;
  tx_bank_description: string;
  tx_phone: string;
  tx_img_url?: string | null;
};

export type TransferenciaReceiver = {
  cod_bank_account: string;
  cod_rif: string;
  tx_bank_description: string;
  tx_img_url?: string | null;
};

export type ZelleReceiver = {
  tx_email: string;
  tx_phone: string;
  tx_bank_description: string;
  tx_img_url?: string | null;
};

export type BankOption = {
  value: string;
  label: string;
};
