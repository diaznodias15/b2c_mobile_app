# Plan de implementación gradual

Cada paso es independiente, deja la app funcionando y se puede revertir. No se
pasa al siguiente hasta cerrar el checklist del paso (§Checklist por paso).

## Mecánica del cambio

| Tipo | Archivo nuevo | Cómo se activa | Cómo se revierte |
|---|---|---|---|
| Componente | `src/redesign/components/X.tsx` (mismo nombre y props) | Cambiar el `import` en quien lo usa (`@/components/X` → `@/redesign/components/X`) | Restaurar el `import` |
| Vista | `src/redesign/screens/XScreen.tsx` | El archivo de ruta en `src/app/` hace `export { default } from '@/redesign/screens/XScreen'` | Restaurar el cuerpo original del archivo de ruta (está en git) |
| Primitiva | `src/redesign/ui/X.tsx` | Solo la usan archivos de `redesign/` | Borrar el archivo |

Mientras una pieza no se active, no afecta a la app.

## Inventario y orden

Prioridad según impacto en conversión y riesgo. "Mejora" son hallazgos
verificados en el código actual; el resto se confirma al diseñar cada pieza.

### Fase 0 — Cimientos (sin cambio visible)

| # | Entregable | Notas |
|---|---|---|
| 0.1 | `ui/Txt`, `ui/Surface`, `ui/Button`, `ui/IconButton`, `ui/Chip` | Escala y tokens de `DESIGN-SYSTEM.md`; con tests de lógica donde aplique |
| 0.2 | `ui/PriceBlock`, `ui/StockPill` | Reusan `getProductPricing`, `formatDisplayPrice` y `STOCK_META` |
| 0.3 | Pantalla de pruebas interna (galería de componentes) | Solo en desarrollo, para comparar viejo/nuevo en el emulador |

### Fase 1 — Descubrir (Home, catálogo, búsqueda)

| # | Componente / vista actual | Archivo nuevo | Mejora prevista |
|---|---|---|---|
| 1.1 | `ProductCard` | `components/ProductCard` | Botón "+" de 28 px → ≥48 con `hitSlop`; textos de 10–10.5 px → ≥12; estado de stock visible; precio como jerarquía principal |
| 1.2 | `ProductListItem` | `components/ProductListItem` | Misma jerarquía que 1.1 en formato fila; stock y descuento legibles |
| 1.3 | `ProductCardSkeleton`, `ProductListItemSkeleton` | ídem | Igualar las nuevas dimensiones (sin saltos de layout) |
| 1.4 | `DepartmentCard` | `components/DepartmentCard` | Mantener foto + scrim; mejor contraste del texto y objetivo táctil completo |
| 1.5 | `HomeNavbar` | `components/HomeNavbar` | Buscador visible en la cabecera (atajo a Buscar), selector de sede más claro |
| 1.6 | `SectionHeader`, `TopProducts`, `WhyChooseUs`, `DeliveryBanner`, `BrandsMarquee` | ídem | Ritmo de espaciado único; `reduced-motion` en el marquee |
| 1.7 | **Vista** `index.tsx` | `screens/HomeScreen` | Orden de secciones orientado a compra |
| 1.8 | **Vista** `departments.tsx` y `products/[department].tsx` | `screens/DepartmentsScreen`, `screens/DepartmentProductsScreen` | Filtros como chips visibles (hoy solo un botón), conteo de resultados, ordenamiento si el backend lo permite |
| 1.9 | **Vista** `search.tsx` | `screens/SearchScreen` | Estado inicial útil (recientes/sugeridos en vez de solo texto), resultados con jerarquía de 1.2 |
| 1.10 | `bottom-tabs` | `components/bottom-tabs` | Etiquetas más cortas, badge del carrito accesible, indicador activo claro |

### Fase 2 — Decidir y comprar (detalle, carrito, checkout)

| # | Componente / vista actual | Archivo nuevo | Mejora prevista |
|---|---|---|---|
| 2.1 | `product/[slug].tsx` + `BranchInventoryList`, `QuantityStepper`, `DiscountBadge` | `screens/ProductDetailScreen` + componentes | Precio y stock arriba, **CTA fijo inferior** con stepper, inventario por sede plegable |
| 2.2 | `cart.tsx` + `CartSummaryCard`, `CartTimer`, `ModalClearCart` | `screens/CartScreen` + componentes | Resumen y **CTA fijo** de pago, timer de reserva menos intrusivo, líneas con total claro |
| 2.3 | `checkout.tsx` + `CheckoutEntregaStep`, `CheckoutPagoStep`, `CheckoutPrimitives`, `PaymentMethodCard`, `PhoneContactFields` | `screens/CheckoutScreen` + componentes | Indicador de pasos, campos con etiqueta visible y error junto al campo, resumen colapsable |
| 2.4 | `ModalOrderDetail`, `OrderRow`, `OrderStatusStepper`, `orders.tsx` | `screens/OrdersScreen` + componentes | Estados con color + texto; detalle más escaneable |

### Fase 3 — Cuenta y soporte

| # | Componente / vista actual | Archivo nuevo |
|---|---|---|
| 3.1 | `login.tsx`, `register.tsx` | `screens/LoginScreen`, `screens/RegisterScreen` |
| 3.2 | `profile.tsx`, `ProfileHeader`, `ProfileActionCard`, `ModalResetPassword`, `ModalLogout` | `screens/ProfileScreen` + componentes |
| 3.3 | `help.tsx` (hoy placeholder) | `screens/HelpScreen` (contacto por WhatsApp, horarios, legales; ver docs 17 de la web) |

### Fase 4 — Pulido (opcional)

- Fuentes Plus Jakarta Sans / Inter con `expo-font` (paso aislado, ver `DESIGN-SYSTEM.md` §3).
- Modo oscuro si el producto lo decide (`is_allow_dark_mode`).
- Animaciones de entrada con `reduced-motion`.

## Procedimiento por paso

1. **Leer** el componente/vista actual completo y sus usos (`grep` del import).
2. **Diseñar** la variante: boceto en el emulador con datos reales (la tienda
   tiene catálogo real en `api-maraplus.icommerce360.com`).
3. **Crear** el archivo nuevo en `src/redesign/` con el mismo contrato de props.
4. **Verificar sin activar**: la galería (0.3) o una ruta temporal de pruebas.
5. **Activar** cambiando el `import`/reexport en un solo lugar.
6. **Probar** en el emulador y en un dispositivo real (checklist de abajo).
7. **Commit** propio: `feat(redesign): <pieza>` (un commit por paso, fácil de revertir).
8. **Documentar** en este archivo: marcar el paso como hecho y anotar
   cualquier desviación.

## Checklist por paso

Plantilla de aceptación: se aplica a cada paso al cerrarlo (no se marca aquí;
el resultado de cada paso queda en §Seguimiento, incluido lo que quedó sin
probar).

- [ ] `npm run typecheck`, `npm run lint` (archivos tocados) y `npm test` en verde.
- [ ] Mismas props que el original; ningún llamador necesita otro cambio.
- [ ] Objetivos táctiles ≥48 dp; ningún texto <12 px.
- [ ] Contraste ≥4.5:1 con los colores del whitelabel real y con el fallback `SOFT_COLORS`.
- [ ] Estados cubiertos: cargando (skeleton), vacío, error con reintento, deshabilitado.
- [ ] Probado a 375 px de ancho, con texto del sistema al 130 % y con "reducir movimiento".
- [ ] Safe areas correctas (barras fijas no tapadas por el gesto de inicio).
- [ ] Sin `className` en `<Text>`/`<View>`; colores solo desde `useThemeColors()`.
- [ ] Probado en **Android real** (no solo emulador/web), como pide `AGENTS.md`.
- [ ] Textos en tuteo (`utils/uiCopy.test.ts` pasa).

## Seguimiento

| Paso | Estado | Commit | Notas |
|---|---|---|---|
| 0.1 – 0.3 | hecho | ver git log | Primitivas en `src/redesign/ui/` (`Txt`, `Surface`, `Button`, `IconButton`, `Chip`, `Badge`, `PriceBlock`, `StockPill`) + `stockLevel` (con test). Galería: deep link `maraplus_mobile_app://redesign-gallery` (solo `__DEV__`). `Badge` se añadió porque el `DiscountBadge` actual usa 10 px. |
| 1.1 – 1.3 | hecho y **activado** | ver git log | `ProductCard`, `ProductListItem`, `ProductCardSkeleton` y `ProductListItemSkeleton` v2 en `src/redesign/components/`, todos con el contrato del original. **Activados** (2026-10-13) en `TopProducts.tsx`, `Providers.tsx`, `search.tsx` y `products/[department].tsx` cambiando solo el import; probado en emulador (agregar, toast y badge del carrito OK). Regla para el futuro: activar **juntos card + su skeleton** (el card v2 mide 164 de ancho, el original 148). Para volver atrás, restaurar los imports. `IconButton` ganó la prop `loading`. |
| 1.4 – 1.5 | hecho y **activado** | ver git log | `DepartmentCard` v2 (nombre en panel propio bajo la foto, ya no sobre un degradado) y `HomeNavbar` v2 (sede como pastilla de 48 dp + buscador que lleva a Buscar). Activados en `index.tsx` y `departments.tsx` (solo el import). El atajo de búsqueda ya abre Buscar con el campo enfocado (resuelto en 1.9). La navbar creció ~100 px y baja el contenido del Home: se compensó con los chips de departamento, pero el banner 1:1 sigue ocupando casi toda la primera pantalla. |
| 1.10 | hecho y **activado** | ver git log | `bottom-tabs` v2 (siete imports: `cart`, `departments`, `help`, `index`, `profile`, `search` y `ModuleMaintenance`). Píldora de estado activo, etiquetas de 12 px, iconos de 24, badge del carrito de 20 px anunciado al lector de pantalla, tabs inactivas en `muted` (el `secondary` del whitelabel tenía poco contraste), hoja "Ver más" con filas de 56 dp, selector de moneda de 48 dp y tasa vigente. **Decisión de copy a confirmar:** la tab "Departamentos" se muestra como "Categorías" porque a 12 px no cabe en un quinto de 360 dp (el lector de pantalla sigue diciendo "Departamentos"); la constante `NAV_TABS` es el único lugar a cambiar. Se mantuvo intacta la lógica del carrito (medición del icono para la animación de vuelo y rebote). Sin los 9 errores de lint del original (`useRef(...).current` en render). Sin probar aún: la animación de vuelo hacia el nuevo icono. |
| 1.6 – 1.9 | hecho y **activado** | ver git log | **Componentes (1.6):** `SectionHeader` (alineado a la izquierda, con acción "Ver todos" opcional), `TopProducts` (usa `useListAddToCart` en vez de repetir el bloque), `WhyChooseUs` (una columna con descripciones de 14 px), `DeliveryBanner` (color del whitelabel en vez del azul fijo `#4C4FE0`; **texto corregido**: el original repetía el estado, "Maracaibo (Zulia), Edo. Zulia"), `BrandsMarquee` (respeta *reducir movimiento*: sin animación muestra una fila deslizable; logos con nombre accesible; nueva `ui/useReduceMotion`) y `DepartmentChips` (nuevo). **Pantallas:** `HomeScreen` (1.7: chips de departamento bajo la navbar, margen de 16, "Ver todos" en Departamentos), `DepartmentsScreen` y `DepartmentProductsScreen` (1.8: los filtros activos se ven como chips quitables y "Limpiar todo"), `SearchScreen` (1.9: **búsquedas recientes** persistidas, "Explora por categoría", contador "N resultados", sugerencias sin resultados y **enfoque automático** al llegar desde la navbar con `?focus=1`). Nuevos: `utils/searchHistory` (con tests) y `store/searchHistory.store`. `DepartmentCard` pasa al margen de 16. Rutas `index`, `departments`, `search` y `products/[department]` reexportan las pantallas v2. **Probado en emulador:** Home completo, Departamentos, Buscar (descubrir, buscar "gasa", historial que sobrevive a reiniciar la app) y el listado con filtro de precio. **Sin probar:** la sección de marcas (el backend manda `brands: []`, queda oculta como en el original), el modo *reducir movimiento*, y los estados de error/vacío de Departamentos y del listado. |
| 2.1 | hecho y **activado** | ver git log | `ProductDetailScreen` v2 (`src/redesign/screens/`), activada reexportándola desde `src/app/product/[slug].tsx` (el cuerpo anterior está en el historial de git: para volver atrás, `git checkout <commit-previo> -- "src/app/product/[slug].tsx"`). Barra de compra fija con stepper, total y CTA; tarjeta de precio con ahorro, `-N%` y stock; "Quedan N unidades" con stock bajo; descripción plegable; galería al 90 % del ancho; volver de 48 dp. También `QuantityStepper` v2 (44×48 por botón, mismo contrato; aún sin activar en el carrito) y `ProductDetailSkeleton` v2. Reutiliza sin cambios `BranchInventoryList`, `ProductDetailMessage` y `TopProducts`. Probado en emulador: stock normal, sin stock (botón deshabilitado), cantidad y total, agregar + toast. Pendiente: el toast cae sobre la fila "Total" de la barra durante ~2 s; `BranchInventoryList` v2; probar un producto con descuento (el catálogo actual no tenía ninguno con stock). |
| 2.2 | hecho y **activado** | ver git log | `CartScreen` v2 (reexportada desde `src/app/cart.tsx`; el cuerpo anterior está en git) + `CartLineItem`/`StockAlert`, `CartSummaryCard` y `CartTimer` v2. La lógica (sede activa, `refreshFromServer`, bloqueo por operaciones en vuelo y por stock, timer solo enfocado, horarios, vaciado) se copió sin cambios. Barra de pago fija con **Total** grande y desglose plegable (`collapsible`), líneas con stepper de 48 dp y "quitar" aparte solo con cantidad > 1 (con 1 el "−" ya es la papelera), botones "Seguir comprando"/"Vaciar" de 48 dp. `CartSummaryCard` v2 también sirve al checkout (sin `collapsible` muestra el desglose siempre). **Probado en emulador (invitado):** lista, total y desglose, aviso de horarios, líneas con 1 y 3 unidades. **Sin probar:** sesión iniciada (sync con servidor), alerta de stock excedido, vaciar carrito, timer de reserva, estado vacío. El checkout sigue usando `CartSummaryCard`/`CartTimer` v1 hasta el paso 2.3. |
| 2.3 | hecho y **activado** (solo modo Lite) | ver git log | `CheckoutScreen` v2 (reexportada desde `src/app/checkout.tsx`; el cuerpo anterior está en git) + `PhoneContactFields` v2. La lógica (timer, `refreshFromServer`, payload Lite `buildLiteOrderPayload`, `createOrder`, `handleFinish`, `clearBranchLocal`, estados sin sesión / stock / carrito vacío) se copió sin cambios. **Lite** (el activo en producción): resumen "Tu pedido" con las líneas antes de confirmar, operadora con **chips** (un toque, en vez de un modal), campo de 48 dp con error en 14 px, checkbox de 48 dp, barra inferior con Total y desglose plegable, y un aviso de qué falta cuando el botón está deshabilitado. Éxito con botones de 48 dp y copy en tuteo ("Escríbenos", el original decía "Escribinos"). **Modo Full: SIN rediseñar (2.3b)** — `CheckoutEntregaStep`, `CheckoutPagoStep` (con `DeliveryMapModal`, `PaymentMethodCard`, etc.) siguen siendo los de v1, solo cambia el envoltorio. **Probado en emulador:** estado sin sesión, y el formulario Lite con un parche temporal local que forzaba la sesión (ya retirado): chips, formato del número, checkbox y habilitación del botón. **Sin probar:** enviar el pedido, la pantalla de éxito, errores del backend y el timer en el checkout (no se crean pedidos reales contra producción). Corregido de paso: `Button` sin ancho completo ahora se centra. |
| 2.3b | hecho y **activado** | ver git log | `CheckoutEntregaStep` y `CheckoutPagoStep` v2 (con `CheckoutStepHeader`, `PaymentMethodCard` y la primitiva `ui/SelectField`), usados por `CheckoutScreen` en modo Full. Toda la lógica se copió sin cambios: cotización de envío (`mergeLocalCart` + `calculate-delivery`, atajo de envío gratis por umbral, `null` = "se coordina por WhatsApp", nunca "gratis"), mapa `DeliveryMapModal` (sin tocar), métodos de pago por tipo de entrega, monto autocalculado con IGTF para divisas, referencia obligatoria de 5-6 caracteres, validaciones por método. **Cambia solo la presentación:** cabecera "Paso N de 2" con progreso, Retiro/Delivery como tarjetas, campos con `TextField`, banco de origen con hoja de búsqueda y filas de 56 dp, moneda del efectivo con chips, datos del receptor legibles, barra inferior fija con Total y el motivo cuando el botón está deshabilitado. **Mejoras de comportamiento:** el campo de monto ya no se reformatea en cada tecla (el original mostraba `toFixed(2)` mientras se escribía). **Copy:** tuteo ("¿Cómo prefieres pagar?", "Recuerda"; el original decía "preferís" y "Recordá"). **Probado en emulador** (parche temporal local que forzaba modo Full y sesión, ya retirado; no se envió ningún pedido): ambos pasos, Delivery con su formulario, Retiro → Pago, Efectivo en Bs. y USD (monto con IGTF y aviso) y el botón habilitándose. **Con datos de muestra en la galería:** tarjetas de Pago móvil/Zelle/Transferencia, datos del receptor y el selector de banco. **Sin probar:** el mapa y la cotización real, los formularios reales de Pago móvil/Transferencia/Zelle (los métodos requieren sesión: `/api/config/payment-methods` responde "Usuario no autorizado") y enviar el pedido. |
| 2.4 | hecho y **activado** | ver git log | `OrdersScreen` v2 (reexportada desde `src/app/orders.tsx`; el cuerpo anterior está en git) + `OrderRow`/`OrderRowSkeleton`, `OrderStatusBadge`, `OrderStatusStepper`, `DualCurrencyText`, `OrdersPagination` y `ModalOrderDetail` v2. La lógica del detalle (consulta al abrir, recarga con `fresh`, aviso dentro del modal, patch de la insignia en la lista, una recarga fallida no borra el detalle) se copió sin cambios. Cada orden es una tarjeta con #, fecha, estado, resumen y total; el progreso pasó de 5 etiquetas de 10 px a una barra de 5 segmentos + "Procesando · Paso 3 de 5 · Sigue: Procesado"; paginación con botones de 48 dp; detalle con filas etiquetadas (sede, pago, envío), productos ya desplegados si son ≤3 y desglose plegable; el estado de error de la lista ahora tiene "Reintentar". **Probado en emulador:** la pantalla real como invitado (estado de error + reintentar) y todos los componentes con datos sintéticos en la galería (`redesign-gallery`). **Sin probar con datos reales:** la lista, el detalle y su recarga (requieren sesión; no se usan credenciales contra producción). |
| 3.1 | hecho y **activado** | ver git log | `LoginScreen` y `RegisterScreen` v2 (reexportadas desde `src/app/login.tsx` y `register.tsx`; los cuerpos anteriores están en git) + primitiva `ui/TextField` (etiqueta visible, 48 dp, error junto al campo, icono, mostrar/ocultar de 48 dp, autocompletado) y `PasswordStrengthMeter` v2. La lógica (validaciones de `utils/validations.ts`, `login`/`signIn`, reenvío del email de verificación, payload de `register`, el registro NO autentica) se copió sin cambios. Registro en tres bloques con chips para documento/género/operadora, errores en línea por campo y un aviso de qué falta bajo el botón; documento y teléfono aceptan solo dígitos; Enter en la contraseña envía el login. Corrige un voseo ("Repetí" → "Repite"). **Probado en emulador** (sin enviar nada): ambos formularios, chips, error en línea del correo y el aviso de requisitos. **Sin probar:** enviar login/registro, "Te enviamos un email" y el reenvío (no se usan credenciales ni se crean cuentas contra producción). |
| 3.1b | hecho y **activado** | ver git log | **Login y registro con más presencia de marca** (la cabecera y el sello de confianza son componentes compartidos: `AuthHeader` y `AuthTrustStrip`; el registro usa además tarjetas por sección, el enlace a login como botón y una pantalla "Revisa tu correo" alineada (muestra el correo al que se envió, tres pasos numerados, "Ya verifiqué" como acción principal y "¿No te llegó? Reenviar email"; verificada solo con un parche local que forzaba el estado, ya retirado); `ui/LinkButton` nuevo) (a partir de la skill `ui-ux-pro-max`: patrón "conversión + confianza" para farmacias). Cabecera tintada con el primario del whitelabel (`primaryOverlay`, así el logo a color siempre se lee) con formas decorativas ocultas al lector de pantalla, saludo y la descripción de la empresa (`tx_company_description`) si el backend la manda; formulario en una tarjeta que se superpone a la cabecera, con entrada suave (desactivada con *reducir movimiento*); sello de confianza con las promesas que ya comunica el Home ("Compra segura", "Stock real", "Atención personalizada"); salidas claras: **"Crear cuenta" como botón**, **"Seguir explorando sin cuenta"** (se puede comprar como invitado hasta el checkout) y **"Necesito ayuda para ingresar"** (lleva a Ayuda: la app aún no tiene recuperación de contraseña). La lógica no cambia. **Probado en emulador:** pantalla completa y comportamiento con el teclado. **Sin probar:** enviar el login. |
| 3.2 | hecho y **activado** | ver git log | `ProfileScreen` v2 (reexportada desde `src/app/profile.tsx`) + `ProfileHeader`, `ModalLogout` y `ModalResetPassword` v2. Lógica copiada sin cambios (revalidación con `refreshUser`, cierre de sesión local pase lo que pase con el backend, política de contraseña con `getPasswordChangeIssues`, `is_show_user`). Cabecera compacta; los 3 botones-tarjeta (uno no hacía nada) pasan a una lista de filas de 64 dp ("Mis órdenes", "Cambiar contraseña"); información personal como lista etiquetada; "Cerrar sesión" como botón propio al final; modal de logout con acción `danger` y "Cancelar" de 48 dp; el modal de contraseña usa `TextField` y conserva `statusBarTranslucent`/`navigationBarTranslucent` (necesarios para `keyboard-controller` en Android). `Button` gana la variante `danger`. **Probado en emulador:** el modal de contraseña y la cabecera con un usuario de muestra (galería) y el estado sin sesión. **Sin probar con sesión real:** la pantalla completa, cerrar sesión y cambiar la contraseña. |
| 3.3 | hecho y **activado** | ver git log | `HelpScreen` (reexportada desde `src/app/help.tsx`; antes solo mostraba el título). Muestra WhatsApp, teléfono y correo de la empresa y los datos de la sede activa, **leídos de la config del backend** (cada canal solo aparece si existe). Nueva `utils/contact.ts` (con tests) que normaliza el teléfono a formato internacional para `wa.me`: **bug corregido** — el checkout convertía `0422-9876543` en `wa.me/04229876543` (número inválido); ahora `wa.me/584229876543`. **Ojo con los datos:** la config de producción trae valores de relleno (`example@example.com`, `Calle 77`, teléfono `0422-9876543`); hay que cargar los reales en el admin. Sin enlaces a términos/privacidad: la app no tiene esas pantallas todavía. |
| 4 | pendiente | | |

## Paridad con la web (novedades de sept–oct 2026, portadas el 2026-10-26)

Fuente: `b2c_app/docs/novedades-features.md` (la app web). Cada fila es un commit propio en `developer`.

| Origen (web) | Estado | Notas |
|---|---|---|
| G9 Banners completos | hecho | **Corrige un bug**: el backend ya no manda `tx_img_url_mobile`; el Home usa `tx_img_url_web` (2:1, `contain` sobre copia desenfocada). El skeleton del arranque (`Providers.tsx`) usa la misma proporción. |
| G10 Símbolos de contraseña | hecho | `PASSWORD_SYMBOLS` = ASCII imprimible; sin espacios ni acentos. **Falta confirmar con el backend** que acepta `_ ~ / …` y qué pasa con la contraseña *actual* al cambiarla. |
| G12 Validación del merge | hecho | `utils/cartMerge.ts`; toast si falla, el carrito local se conserva. |
| G7 Recordar sede | hecho | La persistida se resuelve contra `/config/get` (`reconcileSelectedBranch`). |
| G8 Error 429 | hecho | GET con reintentos y `Retry-After`; nunca POST/PUT/DELETE. |
| 2 Repetir pedido | hecho y probado con sesión | Botón en `ModalOrderDetail`; resumen compartido con favoritos (`utils/cartBulkResult.ts`). |
| 1 Favoritos | hecho y probado con sesión | `FavoriteButton`, `favorites.store`, ruta `/favorites` desde Perfil. En las filas el corazón va junto al botón "+" (arriba chocaba con el nombre). Animación "pop" al marcar (omitida con *reducir movimiento*, que se consulta solo en ese momento). |
| G3 Variantes | hecho, **sin probar con datos reales** | Producción aún no manda `family` ni `variants_count`. No se soporta `VARIANTS_COLLAPSE_CATALOG`. |
| G4 Escáner de barras | hecho, lectura real sin probar | `expo-camera` (nativo: rebuild). Probado en emulador el permiso, la cámara y la entrada manual; falta un teléfono real o una imagen con código en la cámara virtual. |
| F Búsqueda aproximada (doc 19) | hecho, **sin probar con datos reales** | `getProductSearch` lee `metadata.approximate` (`utils/searchApproximation.ts`) y soporta `exact=1`; Buscar muestra «Sin resultados exactos para «…». Mostramos productos similares.» y no pagina esa respuesta. Depende de la rama `improve-search` del backend (aún no desplegada: producción no manda el campo). El panel de filtros de búsqueda no existe en la app. |
| Textos del doc 19 (repetir pedido, favoritos) | hecho | Títulos y motivos iguales al doc; sin resultados usa el `message` del backend. Corazón: aviso «…productos favoritos», latido mientras responde el backend (fijo con *reducir movimiento*), «Ir al inicio» en el vacío, la lista de favoritos cancela la petición al cambiar de sede. **No se hizo:** conservar el scroll al cambiar de variante (la pantalla se reemplaza) ni títulos en el toast (el 429 solo tiene mensaje). |
| G5 Lite + `TBD` | hecho | El backend ya acepta `fulfillment_type = "TBD"` (confirmado por el equipo, 2026-10-26): los pedidos Lite ya no dan 400. |
| 6 Variantes de diseño, 11 Kiosko | no aplican | Son de la web. |
