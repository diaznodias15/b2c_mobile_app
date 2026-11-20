# Historial de cambios

Resumen por hitos de `developer` (el detalle exacto está en `git log`). Formato: lo más reciente primero.

## 2026-10-26 — Paridad con la web (novedades sept–oct)

- **Favoritos**: `FavoriteButton` en cards, filas y detalle; pantalla "Mis favoritos" (desde Perfil) y
  "Agregar todos" al carrito. No es optimista: el corazón cambia cuando confirma el backend.
- **Repetir pedido** desde el detalle de la orden, con resumen por línea (agregado / ajustado / omitido).
- **Variantes de producto**: selector en el detalle, "+N opciones" en cards y etiqueta en carrito.
  Probado con datos reales de producción.
- **Escáner de código de barras** (`expo-camera`, requiere rebuild) con entrada manual.
- **Búsqueda aproximada**: aviso de productos similares y soporte de `exact=1`.
- **Banners** del Home con `tx_img_url_web` (el backend ya no manda la versión mobile).
- **Contraseñas**: símbolos válidos = ASCII imprimible.
- **Carrito**: validación del merge al iniciar sesión; **sede** recordada resuelta contra las vigentes.
- **Error 429**: reintento de GET con `Retry-After` y un solo toast por ventana de 5 s.
- **Checkout Lite** ya funciona con `fulfillment_type: TBD` (confirmado por el backend).

## 2026-10-13/14 — Rediseño UI/UX e-commerce

- Fases 0 a 3 completas: primitivas (`src/redesign/ui/`), Home, Departamentos, listado, Buscar, detalle,
  carrito, checkout (Lite y Full), Mis órdenes, login/registro con presencia de marca, Perfil y Ayuda.
- Toda la UI vive en `src/redesign/`; `src/app/` solo reexporta pantallas. Retiro de los componentes
  antiguos.
- Pantalla de Ayuda con contacto leído del backend; `wa.me` con número internacional corregido.
- Sede actual y cambio de sede en "Ver más". Preparación de `app.json`/`eas.json` para tiendas
  (`com.maraplus.app`).

## 2026-10-08/09 — Robustez y limpieza

- Carrito sincronizado con el servidor (se espera la API antes de cambiar; el backend arma la orden con
  su propio carrito), timer de reserva, modal de horarios, validación de stock.
- Checkout Lite (teléfono en 3 partes) y Full (entrega/pago, mapa de entrega con Leaflet).
- Listado por departamento con filtros de precio y scroll infinito; "Mis órdenes" con detalle.
- Perfil revalidado con `/auth/me`; cambio de contraseña validado; tuteo unificado.
- Dependencias sin uso retiradas; endurecimiento de seguridad (sin cleartext, SRI en Leaflet).
- Documentadas las trampas de build en Windows.

## 2026-09 — Base

- Proyecto Expo SDK 57 + Expo Router; whitelabel desde `/api/config/get`.
- Se retiró HeroUI Native: Uniwind solo para tokens, estilos inline en componentes.
- Rebrand de "Farmacia El Samán de Perijá" a **Grupo Maraplus**.
