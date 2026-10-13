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
| 1.4 – 1.5 | hecho y **activado** | ver git log | `DepartmentCard` v2 (nombre en panel propio bajo la foto, ya no sobre un degradado) y `HomeNavbar` v2 (sede como pastilla de 48 dp + buscador que lleva a Buscar). Activados en `index.tsx` y `departments.tsx` (solo el import). Pendiente: el atajo de búsqueda aterriza en la pestaña pero no enfoca el campo; la navbar creció ~100 px y baja el contenido del Home (revisar en 1.7). |
| 1.6 – 1.10 | pendiente | | |
| 2.1 – 2.4 | pendiente | | |
| 3.1 – 3.3 | pendiente | | |
| 4 | pendiente | | |
