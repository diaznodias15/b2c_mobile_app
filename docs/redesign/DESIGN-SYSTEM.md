# Sistema de diseño del rediseño

Generado con la skill `ui-ux-pro-max` (consulta `--design-system` para
"pharmacy ecommerce health trust mobile" + guías de React Native y UX) y
**adaptado a las restricciones reales del proyecto**. Lo que la skill
recomendó y lo que se decidió:

| Recomendación de la skill | Decisión |
|---|---|
| Patrón "Trust & Authority + Conversion" (transparencia de precios, prueba social, CTA claro) | **Adoptado.** Es lo que necesita una farmacia: precio y disponibilidad siempre visibles, un solo CTA por pantalla. |
| Estilo "Flat Design" (sin sombras, formas simples, iconografía) | **Adoptado con matiz:** superficies planas con borde fino en vez de sombras (en Android `elevation` se ve distinto según el dispositivo). Sombra solo en elementos flotantes (tab bar, toast, CTA fijo). |
| Paleta verde `#15803D` + azul `#0369A1` | **No se usa.** Los colores vienen del backend (`config_colors`). Solo se definen *roles* semánticos. |
| Inter + Playfair Display | **Aplazado.** Ver §Tipografía. |
| Checklist: contraste 4.5:1, objetivos táctiles ≥48dp, sin emojis como iconos, estados de carga, `reduced-motion` | **Adoptado** como criterio de aceptación de cada paso (ver `MIGRATION.md`). |

## 1. Principios e-commerce

1. **El precio manda.** Precio final en el tamaño y peso más altos de la card;
   precio tachado y `-N%` secundarios. Siempre en la moneda elegida.
2. **Disponibilidad visible antes de tocar.** Cada producto muestra su estado
   (`En stock` / `Pocas unidades` / `Agotado`) con color **y** texto (nunca solo color).
3. **Un CTA primario por pantalla** (Agregar, Ir a pagar, Confirmar). Lo demás
   es secundario o terciario.
4. **Cero acciones sin respuesta.** Todo toque tiene feedback ≤150 ms; toda
   espera tiene skeleton o spinner; todo éxito tiene confirmación (el toast y
   la animación "flying to cart" actuales se conservan).
5. **Pulgar primero.** Acciones principales en la mitad inferior; el CTA de
   compra queda fijo abajo en carrito, checkout y detalle.
6. **Densidad cómoda.** Más aire entre secciones, menos bordes y cajas anidadas.

## 2. Roles de color (whitelabel-safe)

Se usan los campos existentes de `ThemeColors` (`src/theme/colors.ts`):

| Rol | Token | Uso |
|---|---|---|
| Fondo de pantalla | `background` | Detrás de todo |
| Superficie | `section` / `productCard` | Cards, filas, modales |
| Texto | `foreground` | Títulos, precios |
| Texto secundario | `muted` | Marca, ayuda, precio tachado |
| Borde | `border` | Separadores y contorno de cards (1 px) |
| Acción primaria | `primary` + `onPrimary` | CTA, estado activo |
| Acento suave | `primaryOverlay` / `primaryOverlaySoft` | Fondos de chips activos, selección |
| Estado | `success` / `warning` / `danger` | Stock, errores, descuentos |

Reglas: texto normal ≥4.5:1 contra su fondo, iconos significativos ≥3:1.
Si un color del admin no cumple, se corrige con `isLightColor()` para elegir
el texto (patrón ya usado en la navbar), no con hex fijos.

## 3. Tipografía

La app hoy muestra la fuente del sistema (`theme/typography.ts` declara
*Plus Jakarta Sans* e *Inter* pero **nunca se cargan** en nativo y ningún
componente usa esa escala).

**Fase 1 (sin riesgo):** fuente del sistema, pero con una escala única y
**mínimo 12 px** (hoy hay textos de 10 y 10.5 px, p. ej. marca y precio
tachado en `ProductCard`). Escala del rediseño:

| Token | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|
| `title` | 22 / 28 | 700 | Título de pantalla |
| `section` | 18 / 24 | 700 | Título de sección |
| `price` | 18 / 24 | 800 | Precio final en card grande y detalle |
| `priceSm` | 15 / 20 | 700 | Precio en filas/cards compactas |
| `body` | 15 / 22 | 400 | Texto corrido |
| `label` | 14 / 20 | 600 | Botones, chips, nombres de producto |
| `caption` | 12 / 16 | 500 | Marca, ayuda, estados |

**Fase posterior (opcional):** cargar Plus Jakarta Sans/Inter con `expo-font`.
Es JS pero toca el arranque (splash + `useFonts`) y en Android hay que usar
una familia por peso; se hace como paso aislado y verificado en dispositivo
real, dado el historial de pantallas blancas del proyecto.

## 4. Espaciado, radios y elevación

Se reutilizan `Spacing`, `Radius` y `Shadows` de `src/theme/` (hoy sin uso):

- Ritmo de 4/8: `4, 8, 12, 16, 24, 32`. Gutter de pantalla **16** (hoy 24).
- Entre secciones: 24–32. Dentro de una card: 12.
- Radios: card `16`, botón/campo `12`, chip `999`, imagen `12`.
- Cards: fondo `productCard` + borde 1 px `border`, **sin sombra**.
  `Shadows.md` solo en tab bar, toast y barras CTA fijas.

## 5. Componentes base (`src/redesign/ui/`)

Primitivas pequeñas que evitan repetir estilos inline y garantizan los mínimos
de accesibilidad:

| Primitiva | Garantiza |
|---|---|
| `Txt` | Escala tipográfica, color por rol, `maxFontSizeMultiplier` acotado |
| `Surface` | Fondo + borde + radio de card |
| `Button` | Alto ≥48, estados `pressed` / `disabled` / `loading`, `accessibilityRole` y `accessibilityState` |
| `IconButton` | Área táctil ≥48 con `hitSlop` aunque el icono sea de 20 |
| `Chip` | Filtros/estados; seleccionado = relleno `primaryOverlay` + borde `primary` |
| `PriceBlock` | Precio final + tachado + `-N%` + etiqueta de IVA, usando `getProductPricing`/`formatDisplayPrice` |
| `StockPill` | Estado de stock (texto + punto de color) con `STOCK_META` de `utils/stock.ts` |
| `Skeleton` | Reusa el `Skeleton` actual |

## 6. Interacción y movimiento

- Feedback de toque: opacidad/color (`pressed`), **sin transformaciones que
  muevan el layout**.
- Duraciones: micro-interacciones 120–180 ms, entradas de modal 250–300 ms,
  salidas más cortas que entradas.
- Respetar "reducir movimiento" (`AccessibilityInfo.isReduceMotionEnabled`):
  sin la animación de vuelo ni el marquee de marcas, solo el toast.
- Listas: filas memoizadas, `keyExtractor` estable, props de callback estables
  (patrón ya usado en Buscar y en el listado por departamento).

## 7. Accesibilidad (criterio de aceptación)

- Objetivo táctil ≥48×48 dp (hoy el botón "+" de `ProductCard` mide 28×28).
- Todo control con `accessibilityLabel` y `accessibilityRole`; estados
  (`selected`, `busy`, `disabled`) en `accessibilityState`.
- Soportar texto grande del sistema sin cortar precios (probar al 130 %).
- Iconos decorativos junto a texto: ocultos al lector de pantalla.
- Safe areas respetadas en barras fijas (CTA, tab bar).
