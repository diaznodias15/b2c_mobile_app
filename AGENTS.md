# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

**Marca:** el proyecto se llamó "Farmacia El Samán de Perijá" y se
rebrandeó a **"Grupo Maraplus"** — si aparece la marca vieja en un archivo
nuevo o copiado de otro lado, corregirla.

# Arquitectura actual (actualizado 2026-10-08)

## Providers (`src/app/_layout.tsx` + `src/components/Providers.tsx`)

`_layout.tsx` monta `<Providers>` (todo el stack) + `bootstrapConfig()` en un
`useEffect`. `bootstrapConfig` pega a `/api/config/get`, llena
`useConfigStore` (whitelabel), `useDepartmentStore`, `useAdvertisingStore` y
`useBranchStore`.

El stack de providers, de afuera hacia adentro, quedó verificado **uno por
uno en dispositivo Android real** (no en web) tras una sospecha de pantalla
blanca:

1. `GestureHandlerRootView`
2. `SafeAreaProvider`
3. `QueryClientProvider` (TanStack Query)
4. `HeroUINativeProvider` (config de `textProps` para font scaling) — **ya
   no existe**, ver "HeroUI Native removido" más abajo.

Si vuelve a aparecer una pantalla blanca, **no asumas que es un provider**:
repetir este mismo proceso (stack pelado → agregar de a uno, probando en
Android real cada vez) es más rápido que adivinar.

`Providers.tsx` también inyecta los colores del whitelabel como CSS vars
(`themeColorsToCssVars`) en un `View` raíz con `className="bg-background"` —
así los tokens de `global.css` (`--color-primary`, etc.) reflejan la config
del backend en runtime, no solo el fallback de diseño.

## HeroUI Native removido (2026-09-04) — Uniwind puro

**Se sacó `heroui-native` del proyecto por completo.** Se había adoptado
para resolver un bug de `className` en `<Text>` crudo de RN (ver abajo),
pero terminó costando una sesión entera de debugging: pantalla blanca de
providers, un `--theme` interno de HeroUI que Tailwind v4 purgaba del
build (`"invalid" is not a valid color or brush` / `[Reanimated]: invalid
color value: "invalid"`), y un patch de `patch-package` para forzarlo. La
causa raíz siempre fue la complejidad interna de HeroUI (su propio sistema
de theming con decenas de tokens `--overlay`, `--backdrop`, `--accent`,
etc., resueltos vía `useCSSVariable` en runtime) — no Uniwind en sí.

**Convención actual: React Native puro + `className` de Uniwind/Tailwind.**
Nada de `PressableFeedback`/`Typography`/`Button`/`BottomSheet` de HeroUI.
`Pressable`, `Text`, `View`, `Modal` de `react-native` directamente. Los
tokens de color/radius están en `src/global.css` (`@theme`) y en paralelo
en `src/theme/colors.ts` (`SOFT_COLORS` / `ThemeColors`) — si cambiás uno,
cambiá el otro.

Los íconos son SVG (`lucide-react-native`) y no aceptan `className`; su
color sale de `useConfigStore((s) => s.getThemeColors())`, no de clases.

**Sobre el bug original de `<Text>` + className — resuelto, ya no se usa
className en pantallas/componentes:** una sesión anterior encontró que
`className` en `<Text>` se comportaba distinto entre web y Android
(`fontSize`/`margin`/`color` no se aplicaban), lo cual motivó adoptar
HeroUI. Al remover HeroUI se probó reintentar `<Text>` + className crudo,
pero el bug reapareció en Android real — **decisión final: 100% estilos
inline (`style={{ ... }}`) en todos los componentes de pantalla**, nada de
`className` salvo la única excepción de abajo. No perder tiempo
reintentando className en `<Text>`/`<View>` de nuevo; si algún día se
quiere retomar, hacerlo con un componente aislado y de bajo riesgo primero,
no en una pantalla real.

La única excepción viva es el `View` raíz de `Providers.tsx`
(`className="bg-background"`), que solo necesita el `background` de
`global.css`. Todo lo demás — Home, cards, navbar, marquee, banners — es
`react-native` puro (`View`, `Text`, `Pressable`, `ScrollView`, `Image` de
`expo-image`, `Animated`/`react-native-reanimated`) con `style` inline y
los colores resueltos desde `useThemeColors()` (`src/store/config.store.ts`).

**Cómo Uniwind resuelve colores en runtime (nativo):** cada `className` con
color se busca contra una tabla compilada (`UniwindStore.vars`), generada
al bundlear desde `cssEntryFile: './src/global.css'` (`metro.config.js`).
Una variable de `@theme` que **nunca se usa en un className** (solo se lee
por JS vía `useCSSVariable`) se purga del build salvo que se declare en un
bloque `@theme static { ... }` (no un `@theme {}` común) — esto fue
justamente lo que rompió con `--theme` de HeroUI, y ya no aplica al no usar
la librería. Si algún día se define una CSS var propia que solo se lee por
JS (no por className), declararla en `@theme static` para no repetir el
mismo problema.

**Nota sobre el caché de Metro:** `npm run clean:metro` originalmente solo
borraba `os.tmpdir()/metro-cache` (el temp real del sistema). Pero
`metro.config.js` redirige `process.env.TEMP`/`TMP` a `.metro-tmp/`
(carpeta del proyecto) **dentro del proceso de Metro** — el script de
limpieza corre en un proceso Node aparte que nunca hereda esa redirección,
así que borraba el directorio equivocado y el caché real en `.metro-tmp/`
sobrevivía a cada "restart limpio". Ya está corregido para borrar ambos
directorios. Si un cambio de CSS/theme no parece tomar efecto ni con
`start:fresh`, borrar `.metro-tmp/` a mano es el primer sospechoso.

## Entorno de build local (Windows) — no usar Expo Go

Esta app usa `react-native-reanimated` 4.5.1 + `react-native-worklets`
0.10.1 (arquitectura nueva de Reanimated, con parte nativa compilada).
**Expo Go no sirve para esta app** — trae un binario nativo fijo que no
coincide con esas versiones. Hay que compilar un dev-client.

**Build local (recomendado, más rápido que la cola gratuita de EAS):**

- Requiere Android Studio + SDK instalados (`ANDROID_HOME` apuntando a
  `%LOCALAPPDATA%\Android\Sdk`, `platform-tools`/`emulator` en el PATH).
- `JAVA_HOME` debe apuntar a un **JDK 17 LTS** (ej. Eclipse Temurin). El
  JBR que trae Android Studio embebido puede ser demasiado nuevo (JDK 25
  a la fecha) y rompe las tareas de CMake nativas (`react-native-worklets`,
  `react-native-screens`) con `WARNING: A restricted method in
  java.lang.System has been called`.
- **El proyecto NO puede vivir dentro de una carpeta sincronizada por
  OneDrive para compilar.** Causa `ninja: error: manifest 'build.ninja'
  still dirty after 100 tries` en las tareas CMake nativas — el sync de
  OneDrive interfiere con los timestamps que ninja usa para detectar
  cambios. Excluir la carpeta de Windows Defender NO alcanza. La copia de
  trabajo para builds nativos vive en `C:\dev\b2c_mobile_app` (fuera de
  OneDrive); el repo real/fuente de verdad para git sigue siendo la carpeta
  de OneDrive. Si movés/copiás el proyect, no uses `robocopy /XJ` sobre
  `node_modules` (excluye symlinks/junctions y rompe paquetes anidados
  como `expo/node_modules/@expo/cli`) — copiá todo excepto `node_modules`
  y corré `npm install` fresco en el destino.
- Comando: `npx expo run:android` (genera `android/`, compila con Gradle,
  instala en el emulador/device). Solo hace falta repetirlo si cambian
  dependencias nativas; para JS/CSS alcanza con Metro (`npm run
  start:fresh` + reload de la app).

## Forma real de `/api/config/get` (verificado con curl, 2026-09-08)

El backend NO anida todo bajo `app_config` como el nombre del campo
`config_colors` en `AppConfig` sugiere. La forma real de `data` es:

```
data.app_config      // datos de la empresa (rif, teléfono, email, etc.)
data.config_colors   // los 40+ `col_*` — HERMANO de app_config, no anidado
data.advertisings
data.brands
data.departments
data.branches
```

`bootstrapConfig()` (`src/components/Providers.tsx`) hace el merge:
`setAppConfig({ ...data.app_config, config_colors: data.config_colors })`.
Si algún día un `setAppConfig` deja de reflejar colores, este es el primer
sospechoso — confirmalo con
`curl -s https://b2c-api.icompras360.online/api/config/get | node -e "..."`
y `Object.keys(j.data)` antes de asumir un bug de UI.

**`app_config` HOY no trae `tx_company_name` ni `tx_company_logo_url`**
(están tipados en `AppConfig` para cuando el backend los agregue, pero la
respuesta real no los incluye a la fecha). El logo de la navbar por eso
sale de assets locales, no del backend — ver "Logo de la navbar" abajo.

`config_colors` trae pares `col_x` / `col_x_dark` para (casi) todo, pero
**no hay ningún toggle de dark mode implementado en la app** (`is_allow_dark_mode`
existe en `app_config` pero no se lee en ningún lado). `buildThemeColors()`
(`src/theme/colors.ts`) solo mapea los valores `_light` (sin sufijo). No
asumas que existe un modo oscuro real hasta que se implemente.

## El anti-patrón de Zustand que más se repite: selectors que arman objetos

**Nunca** hagas `useXStore((s) => s.algo())` donde `algo()` construye un
objeto/array nuevo en cada llamada, ni `useXStore((s) => ({ a: s.a, b: s.b }))`
inline. Zustand usa `useSyncExternalStore`, que compara snapshots por
referencia — un objeto nuevo en cada render nunca es "igual" al anterior,
así que React re-renderiza en loop → `"The result of getSnapshot should be
cached"` → `"Maximum update depth exceeded"`. Ya pasó (y se arregló) al
menos 3 veces en este proyecto: `getThemeColors()` en `config.store.ts`,
`selectEffectiveBranchLocation` en `branch.store.ts`, y por eso
`useEffectiveBranchLocation()` existe como hook con `useMemo`.

**Regla práctica:**
- Si el selector devuelve una referencia que YA existe en el state (ej.
  `state.selectedBranch`, o un item encontrado con `.find()` dentro del
  árbol sin reconstruirlo) → seguro usar directo:
  `useBranchStore(selectEffectiveBranch)` (`src/store/branch.store.ts`).
- Si el selector arma `{ ... }` o `[ ... ]` nuevo → hay que envolverlo en
  un hook dedicado que seleccione las piezas primitivas/estables por
  separado y derive el resultado con `useMemo` (ver `useThemeColors()`,
  `useEffectiveBranchLocation()`).

## Convención de fallback de imágenes (producto, marca, logo)

Tres variantes del mismo patrón, todas con `expo-image` + `onError` +
`useState`:

- **Producto** (`ProductCard.tsx`): si no hay `tx_img_url` o falla la
  carga, usa `assets/images/unavailable-product-image.webp` (imagen real,
  no generada).
- **Marca** (`BrandsMarquee.tsx`): si no hay logo o falla, cae a un ícono
  `Building2` de `lucide-react-native` — no hay asset de fallback para
  marcas, es más barato un ícono que una imagen genérica.
- **Logo de la navbar** (`HomeNavbar.tsx`): no es un fallback por error de
  red, es una elección de contraste. `assets/images/logo-light.webp` es el
  logo a color (para fondos claros); `assets/images/logo-dark.webp` es una
  versión casi blanca (para fondos oscuros — queda invisible sobre blanco,
  ¡no confundir cuál usar!). La elección es `isLightColor(colors.navbar)`
  (`src/theme/colors.ts`) sobre el color real del whitelabel, no el modo
  claro/oscuro del sistema — el admin puede pintar el navbar de cualquier
  color. Ninguna de las dos variantes viene del backend (ver arriba, el
  API no manda logo todavía).

Si se sube un asset nuevo a `assets/images/`, recordar copiarlo también a
`C:\dev\b2c_mobile_app\assets\images\` (ver "Entorno de build local" abajo)
o Metro no lo va a encontrar al bundlear desde ahí.

## Home (`src/app/index.tsx`) — orden de secciones y patrón de título

De arriba hacia abajo: `HomeNavbar` (fijo, fuera del `ScrollView`) →
carrusel de publicidad (1:1, `react-native-reanimated-carousel`) →
`TopProducts` ("Más vendidos") → grid de `DepartmentCard` → `WhyChooseUs`
→ `DeliveryBanner` → `BrandsMarquee`.

**Todo título de sección usa `SectionHeader`** (`src/components/
SectionHeader.tsx`): título centrado + subtítulo opcional debajo, mismo
tamaño/peso en todos lados. Si se agrega una sección nueva al Home,
reusar `SectionHeader` en vez de armar un título a mano — fue pedido
explícito del usuario para mantener consistencia.

## Detalle de producto (`src/app/product/[slug].tsx`) y carrito

Ruta dinámica de Expo Router, alcanzada con `router.push(`/product/${tx_slug}`)`
desde `TopProducts`, `ProductListItem` (Buscar) y donde sea que se
liste un `Product`. MVP deliberado — **quedó afuera a propósito**:
el bloque de breakdown de IVA de la web de referencia
(`PRODUCT-DETAIL-VIEW.md`) porque la API real hoy **no** devuelve
`pri_product_price_with_tax`/`qty_tax_amount` — solo `qty_tax`/
`qty_discount`. No los agregues sin confirmar antes que el backend ya
los manda.

El "Ver en mapa" de sedes SÍ existe: `BranchMapModal.tsx` usa Leaflet +
tiles de OpenStreetMap dentro de un `react-native-webview` (misma
solución que la web, sin API key de Google). `react-native-maps` está en
`package.json` pero no se importa en ningún lado (ver "Dependencias sin
uso").

Bloques que sí están: carrusel de imágenes (fallback a
`unavailable-product-image.webp` si `product_img` viene vacío/null),
disponibilidad de la sede activa (`STOCK_META`, `src/utils/stock.ts`),
precio con descuento, stepper de cantidad + agregar al carrito,
características (`product_features`), **inventario por sede**
(`BranchInventoryList.tsx` — tocar una card cambia la sede activa vía
`setSelectedBranch`, y el detalle re-fetchea solo porque su query key
incluye `branchId`) y **relacionados** (`TopProducts` reusado con
`brand`/`title`/`subtitle`/`excludeSlug` opcionales, en vez de duplicar
el componente para el Home vs. el detalle).

### "Flying to cart" + toast + rebote del ícono del carrito

Al agregar un producto pasan 3 cosas, coordinadas por 2 stores nuevos
sin contexto ni prop drilling:

1. **La imagen "vuela" hacia el ícono del carrito** en `BottomTabs`.
   `useFlyingCartStore` (`src/store/flyingCart.store.ts`) guarda
   `cartIconPosition` (que `BottomTabs` mide una vez con
   `measureInWindow` en su `onLayout`) y `flight` (origen + imagen).
   `FlyingCartOverlay.tsx`, montado una sola vez en `Providers.tsx`,
   es el único que lee ese estado y anima `translateX/Y` + `scale` +
   `opacity` con Reanimated desde el origen hasta el ícono.
   **`product/[slug].tsx` no renderiza `BottomTabs`** (no es una tab),
   así que ahí la animación vuela hacia la última posición conocida del
   ícono (la de la última pantalla con tabs que se visitó) — es una
   aproximación correcta porque la barra de tabs siempre queda en el
   mismo lugar en las pantallas que sí la tienen.
2. **El ícono del carrito rebota** al aterrizar: `clearFly()` incrementa
   `bounceSignal` (un contador, no un booleano — así siempre dispara el
   efecto sin tener que resetearlo a mano), y `BottomTabs` anima un
   `scale` con `withSequence` al verlo cambiar.
3. **Toast de confirmación** ("Producto agregado al carrito"):
   `useToastStore` + `Toast.tsx` (mismo criterio de un store mínimo +
   componente montado una vez en `Providers.tsx`).

**La lógica de disparar la animación (medir la imagen, `startFly`,
deshabilitar el botón ~650ms para evitar doble-tap) está en un único
hook, `useAddToCartFlight()` (`src/hooks/useAddToCartFlight.ts`)** —
usado por `ProductCard`, `ProductListItem` y `product/[slug].tsx`. El
JSX de esos 3 lugares NO se puede unificar (son layouts genuinamente
distintos: card vertical de descubrimiento, fila horizontal de
búsqueda, pantalla completa con carrusel grande) — pero la lógica que
sí era idéntica ya no está copiada 3 veces.

## Reutilización: lógica compartida sí, JSX forzado no

Regla general del proyecto (surgió al notar que la lógica de
"agregar al carrito" se había copiado 3 veces en vez de compartirse):
cuando el mismo dato se necesita en varios componentes con **layouts
distintos**, no fuerces un único componente — extraé la lógica pura a
un hook/util y dejá que cada componente arme su propio JSX. Ejemplos
ya establecidos:

- `useAddToCartFlight()` (arriba) — la lógica del flying-to-cart.
- `getProductPricing(product)` (`src/utils/pricing.ts`) — deriva
  `{ basePrice, finalPrice, hasDiscount }` de un `Product`/`ProductDetail`.
  Se repetía literal en `ProductCard`, `ProductListItem` y
  `product/[slug].tsx`.
- `useDisplayCurrency()` (`src/hooks/useDisplayCurrency.ts`) —
  `{ displayCurrency, exchangeRate }`, el par que necesita cualquier
  lugar que llame `formatDisplayPrice`. Devuelve un objeto nuevo cada
  render, pero eso es seguro porque es un hook de React normal, no un
  selector de Zustand — el anti-patrón de "selector que arma un objeto"
  (ver más abajo) aplica adentro de `create()`, no a hooks que combinan
  selectores primitivos y devuelven el resultado.
- `<DiscountBadge percent={...} colors={colors} size="sm"|"lg" suffix?={...} />`
  (`src/components/DiscountBadge.tsx`) — el pill "-N%" sí es el mismo
  JSX en los 3 lugares (solo cambiaba el tamaño de fuente y el
  posicionamiento del wrapper), así que ahí sí se compartió el
  componente completo.

Cuando dudes si extraer: si el JSX que envuelve la lógica es
sustancialmente distinto entre los call sites, extraé solo la lógica
(hook/util). Si el JSX también es igual (o casi), extraé el componente
completo.

## Bugs de datos ya resueltos (no reintroducir)

- **`login()`/`register()` no desenvolvían el envelope de la API** —
  `axiosRequest` devuelve el body HTTP completo (`{status, message,
  data}`), pero ambas funciones estaban tipadas y devueltas como si YA
  fuera el `data` desenvuelto. Confirmado con la app real: `user.name`/
  `user.email` quedaban vacíos porque el store guardaba el envelope
  entero como `user`. Fix: `const res = await axiosRequest<Envelope>(...);
  return res.data;` — mismo patrón que `me()`. Si se agrega un endpoint
  nuevo a `auth.services.ts`, verificar contra un login real (no solo
  contra la doc) qué forma tiene la respuesta.

- **El stepper de estado del detalle de orden no se iluminaba** — la app leía
  `data.in_status`, pero el backend **no lo manda**: en la web lo calcula
  `orderDetailAdapter` a partir de `tx_status` (verificado: no hay `in_status`
  en `b2c_api`). Llegaba `undefined` y `index <= undefined` es falso en todos
  los pasos. Ahora el paso sale de `getOrderStatusStep(tx_status)`
  (`utils/orderStatusStep.ts`, con test). No volver a leer `in_status`. Ese
  módulo está aparte de `orderStatus.ts` porque este importa íconos de
  `lucide-react-native`, que no cargan en los tests de Node.

- **`order.dt_created_at` (`GET /api/orders/my-orders/branch/:branch`)
  viene CRUDO** (`"YYYY-MM-DD HH:mm:ss"`), no pre-formateado
  `"DD/MM/YYYY"` como sugiere MY-ORDERS-MODULE.md (ahí lo formatea el
  `ordersAdapter` de la web con dayjs, que no existe en mobile).
  `formatOrderListDate()` (`src/utils/orderStatus.ts`) lo parsea a mano
  con un regex — no asumir que un campo de fecha ya viene formateado
  solo porque la doc de referencia (basada en el adapter de la web) lo
  documenta así.

- **`getTopProducts` armaba `${TOP_PRODUCTS}?${toQueryString(params)}`** —
  `toQueryString()` ya devuelve el string CON el `?` inicial, así que
  quedaba `??branch=1` y el backend respondía `"La sucursal es
  requerida."` aun con una sede válida. Las demás funciones de
  `src/api/services/products.services.ts` (`getProductList`,
  `getProductSearch`, `getProductDetail`) ya lo hacían bien. Hay test de
  regresión (`not.toContain('??')`) en `products.services.test.ts`.

- **Los precios de producto (`pri_product_price`/`pri_product_final_price`)
  vienen en Bs., NO en USD** — a pesar de que el campo no lo aclara y de
  que el tipo `Product` originalmente los documentaba como USD. Se
  detectó porque `formatDisplayPrice` (`src/utils/currency.ts`) hacía la
  conversión al revés (multiplicaba por `amt_exchange_rate` en vez de
  dividir), mostrando precios "extremadamente inflados" — confirmado
  contra la API real: un precio como `"5499.160"` solo tiene sentido como
  Bs. (÷814.69 ≈ $6.75; como USD sería absurdo para un cartón de huevos).
  `formatDisplayPrice` ahora trata el monto base como Bs. siempre, y solo
  convierte a `REF` (el precio referencial en USD) dividiendo por la tasa
  cuando el usuario elige esa moneda en el selector de "Ver Más"
  (`useCurrencyStore`). Si se agrega código nuevo que toque precios, no
  asumir USD — la base es Bs.

## Mapa de rutas y BottomTabs (`src/components/bottom-tabs.tsx`)

5 tabs: **Inicio** (`/`), **Departamentos** (`/departments`), **Buscar**
(`/search`), **Carrito** (`/cart`, con badge de `selectCartCount`) y
**Ver Más** (abre un `<Modal>` nativo de RN, no navega directo) con
**Perfil** (`/profile`) y **Ayuda** (`/help`).

**`/orders` ("Pedidos") NO está en el menú "Ver más" a propósito** —
pedido explícito del usuario: se accede solo desde `ProfileActionCard`
"Mis órdenes" (`profile.tsx`) con `router.push`, no `router.replace`.
Es una ruta NO-tab, igual que `product/[slug]`/`login`/`register`: no
renderiza `<BottomTabs />`, tiene su propio botón de volver
(`ChevronLeft` + `colors.section`, mismo estilo que `login.tsx`), y
está en la lista de `Stack.Screen` con `animation: 'slide_from_right'`
+ `gestureEnabled: true` en `_layout.tsx` para que el swipe-back
funcione (ver el comentario ahí sobre por qué el default global es
`animation: 'none'`).

`help.tsx` sigue siendo un placeholder tab (mismo patrón que las demás
screens: `<Text className="text-2xl font-bold text-foreground">` +
`<BottomTabs />`) — falta implementar de verdad.

## "Mis órdenes" (`src/app/orders.tsx`) — basado en MY-ORDERS-MODULE.md

Lista paginada (`getMyOrders`, paginación local con `useState`, no
URL-driven — este app no tiene URLs) + modal full-screen de detalle al
tocar una `OrderRow` (`getOrderDetail`). Componentes en
`src/components/`: `OrderRow`/`OrderRowSkeleton` (filas striped —
`index % 2` alterna `colors.section`/`colors.background`),
`OrderStatusBadge` (pill de la lista), `OrderStatusStepper` (timeline
de 5 pasos, no se muestra si `tx_status === 'CANCELED'`),
`DualCurrencyText` (Bs. + REF lado a lado, usa la tasa **de la orden**
— `amt_exchange_rate` — no la tasa live del config, porque una orden
vieja debe reflejar la tasa vigente cuando se compró), `ModalOrderDetail`
(con `OrderProductsList`/`OrderTotals` inline, colapsables vía
`LayoutAnimation`, mismo patrón que `BranchSelectorModal`). Labels de
status/pago/fulfillment centralizados en `src/utils/orderStatus.ts`.

Bug de la doc de referencia ya corregido acá: ver "Bugs de datos ya
resueltos" arriba sobre `dt_created_at` viniendo crudo.

Cada screen del tab bar repite el mismo layout (`View flex-1 bg-background`
→ contenido → `<BottomTabs />` como hermano). Es un patrón manual, no un
layout compartido — si se agrega una screen nueva a las tabs, copiar ese
patrón.

`app-tabs.tsx`, `app-tabs.web.tsx` (intento con `NativeTabs`) y
`AppShell.tsx` fueron código muerto de intentos previos y se eliminaron.

## Formularios con teclado: `KeyboardAwareScrollView`, no `KeyboardAvoidingView` + `ScrollView`

`login.tsx`/`register.tsx` originalmente usaban `KeyboardAvoidingView`
(con `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` — es
decir, **sin comportamiento en Android**) envolviendo un `ScrollView`
normal. Bug real reportado: al enfocar un input que queda por debajo de
la línea del teclado (ej. "Contraseña" en un form largo), el teclado lo
tapaba y no había forma de verlo sin cerrar el teclado a mano — porque
`ScrollView` de RN solo hace auto-scroll al input enfocado en iOS; en
Android es responsabilidad de la app.

**Solución adoptada (2026-09-09):** `react-native-keyboard-controller`
(paquete con parte nativa — instalarlo/actualizarlo requiere rebuild
nativo, ver "Entorno de build local" arriba). Se envuelve la raíz con
`<KeyboardProvider>` en `Providers.tsx` (tiene que ser el wrapper más
externo). Cada pantalla con formulario usa `KeyboardAwareScrollView` de
esa librería en vez de `KeyboardAvoidingView` + `ScrollView` — es un
reemplazo directo de `ScrollView` (mismos props: `contentContainerStyle`,
`keyboardShouldPersistTaps`, etc.) que además hace scroll automático al
input enfocado en ambas plataformas. **Cualquier pantalla nueva con
`TextInput`s dentro de un scroll debe usar este componente desde el
principio**, no `ScrollView` a secas.

## Carrito y checkout (`cart.tsx`, `checkout.tsx`) — basado en CHECKOUT-FLOW.md

**Carrito (`cart.store.ts`)**: persiste en AsyncStorage y cada ítem lleva su
`branch_id` (las pantallas filtran por la sede activa). **Sin sesión** los
cambios son instantáneos (no hay API). **Con sesión** (`isSyncEnabled`, lo
prende `user.store` en `signIn`/`signOut`/`rehydrateAuth`) **se espera la
respuesta de `/api/cart/*` antes de cambiar nada** (ver abajo). `syncOnLogin()` sube el carrito local (`mergeLocalCart`) y después el
backend pasa a ser la fuente de verdad. `cart.store` NO importa
`user.store` (evita el ciclo); es `user.store` quien llama a `cart.store`.

**El backend arma la orden con el carrito del SERVIDOR** (`OrderController`:
`ShoppingCartItem` del usuario + sede), no con los `products` del payload.
Con sesión, el carrito local tiene que ser un espejo del remoto:

- `POST /api/cart/add-product` **SUMA** `qty_product` al ítem existente
  (`+=`): se manda lo **agregado**, nunca el total. Antes se mandaba el total
  y el servidor terminaba con más unidades que las mostradas (el cliente
  pagaba de más). `PUT update-product-quantity` sí fija la cantidad exacta.
- El stock lo valida el backend al agregar, al cambiar cantidad y al crear la
  orden (disponible = existencias − reservado). El carrito remoto devuelve
  `qty_availability`; para invitados se guarda el `qty_product` del producto
  al agregarlo (`toAvailability`). Lógica pura en `utils/cartStock.ts`.
- `refreshFromServer(branchId)` repone la sede desde el servidor: al entrar al
  carrito y al checkout, al cambiar de sede y con pull-to-refresh. No corre
  mientras hay operaciones en vuelo (la UI saltaría hacia atrás).
- **Con sesión se espera la API antes de cambiar el carrito** (no es optimista;
  decisión explícita: así las cantidades locales no se desfasan del servidor).
  `addProduct`/`updateQuantity`/`removeProduct`/`clearBranch` devuelven
  `Promise<boolean>`: `true` si se aplicó, `false` si el servidor lo rechazó
  (toast con el mensaje del backend + se re-lee el carrito, porque el stock pudo
  cambiar) o si ya había una operación en esa línea. Mientras tanto la línea está
  en `pendingKeys` (`cartLineKey(sede, slug)`, `cartClearKey(sede)`): la UI
  muestra un spinner (`QuantityStepper loading`, papelera, "Vaciar carrito",
  botón "+" de las tarjetas) y bloquea los botones de esa línea; el botón de
  pago se bloquea mientras haya cualquier operación en curso. Líneas distintas
  van en paralelo. El toast "agregado" y la animación hacia el carrito salen SOLO
  si el servidor aceptó (`useAddToCartFlight().addWithFlight`). **No hay
  debounce**: con el botón bloqueado no se pueden encadenar peticiones.
- **Al crear una orden el backend vacía su carrito**: el checkout limpia SOLO lo
  local con `clearBranchLocal`. Llamar a `removeProduct` por ítem daría errores
  (el servidor ya no los tiene).
- La línea del carrito usa `getCartLinePricing` (`utils/pricing.ts`): total de la
  línea (precio final × cantidad), valor base tachado + badge `-N%` si hay
  descuento, e "IVA inc.". `QuantityStepper` acepta `onRemove`: con cantidad 1
  el "−" se vuelve papelera. "Vaciar carrito" pide confirmación y llama
  `clearBranch` (`DELETE /cart/clear`, esperando la respuesta). "Seguir comprando" y "Ir a comprar" usan
  `router.replace('/')` porque `/` es una tab.
- **Timer de reserva** (`useCartTimer`, `CartTimer`, `utils/cartTimer.ts`): cuenta
  regresiva desde `appConfig.qty_cart_seconds` (420 en producción), solo con
  sesión + productos. Es **solo UX del cliente**: no está confirmado que el
  backend reserve/libere stock al vencer. Se calcula por timestamp (`deadline`
  en `cartTimer.store`, en memoria) y se recalcula al volver de segundo plano
  (`AppState`). Al vencer: en el carrito se repone desde el servidor; en el
  checkout vuelve a `/cart`; en ambos se reinicia. El `deadline` sigue al pasar
  del carrito al checkout (en la web es una sola página). **El timer del carrito
  solo corre enfocado (`useIsFocused`)**: con `push` queda montado debajo del
  checkout y, si siguiera activo, "ganaría" el vencimiento.
- **Modal de horarios** (`ModalCartWorkingHours`): 1 s después de entrar, **una vez
  por sede y sesión** (la web lo abre en cada visita a `/carrito`; aquí el
  carrito es una tab que se visita seguido). Se salta si la sede no trae
  `tx_working_hours`. No se cierra tocando fuera; el botón atrás de Android sí.
- **`is_show_cart = 0`** muestra `ModuleMaintenance` en carrito y checkout
  (`isModuleEnabled`: un flag ausente NO apaga el módulo).
- UI: alerta "Cantidad no disponible" bajo la card, tope del stepper = stock,
  botón de pago bloqueado y `CheckoutStockIssue` si hay ítems pasados de stock.

**Checkout (`checkout.tsx`)** tiene dos modos, elegidos en runtime por
`appConfig.is_lite_mode` (`isConfigFlagTrue`):

- **Lite** (el que está activo en producción, `is_lite_mode: 1`): un paso con
  **teléfono de contacto obligatorio + checkbox**. El payload
  (`buildLiteOrderPayload`, `utils/orderPayload.ts`, con test) manda
  `fulfillment_type: 'TBD'` ("Por definir"), `tx_payment_method: EXPRESS`,
  `is_lite: 1` y el teléfono en 3 partes. **Con `is_lite_mode = 1` el backend
  exige el teléfono aun en retiro** (`OrderController.php`: 400 "El código del
  país es requerido.") y `TBD` solo se acepta en Lite (`CreateOrder.php`). No
  volver al payload viejo `PICKUP` sin teléfono. La tienda contacta al cliente
  por WhatsApp para coordinar pago y entrega.
- **Full**: dos pasos locales, `CheckoutEntregaStep` → `CheckoutPagoStep`,
  con estado compartido en `useCheckoutStore` (no persiste: si se cierra
  la app se reinicia). Entrega = `DELIVERY` o `PICKUP`; en delivery se
  elige dirección con `DeliveryMapModal` (WebView + Leaflet, buscador vía
  `getLocations`, GPS vía `expo-location`) y se cotiza el envío con
  `calculateDeliveryFee`.

Reglas a respetar:

- `deliveryFee: null` significa "no se pudo cotizar", **no** "envío
  gratis": mostrar "se coordina por WhatsApp", nunca asumir 0.
- **Teléfono en 3 partes** (`PhoneContactFields`, `utils/phone.ts`): país `+58`,
  operadora (`0412/0414/0416/0422/0424/0426`) y número `000-0000` con guión.
  Lo usan Lite y la entrega a domicilio del Full (`recipientAreaCode` +
  `recipientPhone` en `checkout.store`). Un campo libre de teléfono da 400.
- `OrderFulfillmentType` (`PICKUP | DELIVERY | TBD`) es el tipo del backend;
  `FulfillmentType` (sin `TBD`) es lo que el cliente elige en el Full.
- `paymentMethod` es el **código** (`PaymentMethodCode`), no un objeto.
- Los campos de pago varían por método (PAGOMOVIL → banco origen +
  teléfono pagador; ZELLE → titular; etc.). El monto se autocalcula pero
  es editable; el IGTF (`utils/igtf.ts`, 3 %) aplica a pagos en divisas.
- No avanzar a la pantalla de éxito si `createOrder` falla (bug §20.7 de
  la web, ya corregido acá).
- `checkout` es ruta del stack (no tab): sin `<BottomTabs />`.
- **El checkout exige sesión** (igual que la web, que deshabilita "Continuar" sin
  token). Sin sesión, el botón del carrito dice "Iniciar sesión para continuar"
  y va a `/login`, que al terminar hace `router.back()` y regresa al carrito con
  el carrito ya sincronizado. `checkout.tsx` también valida `isAuthenticated`
  (`CheckoutLoginRequired`) por si la sesión expira con el checkout abierto.

## Dependencias removidas y las que NO se pueden quitar

Se quitaron (2026-10-08) por no tener ningún import: `react-native-maps`,
`@gorhom/bottom-sheet`, `expo-image-picker`, `react-native-mask-input`,
`tailwind-merge` y `tailwind-variants`. Y (2026-10-09), tras una auditoría:
`zod`, `react-hook-form` y `@hookform/resolvers` (los formularios usan estado
local + validadores propios en `utils/validations.ts`). Si se necesita alguna,
reinstalar con `npx expo install <paquete>` (las nativas piden rebuild; esas
tres son JS puro). `zod` sigue en `node_modules` como dependencia indirecta de
otra librería: no es una dependencia del proyecto.

**`@expo/ui`, `expo-glass-effect` y `expo-symbols` se quedan en
`package.json` aunque no se importen**: son `dependencies` directas de
`expo-router`, se instalan y enlazan igual, así que quitarlas no reduce el
APK.

Auditoría (2026-10-09): el resto de paquetes que no se importan directamente
(`expo-constants`, `expo-linking`, `expo-status-bar`, `expo-system-ui`,
`expo-dev-client`, `react-native-screens`, `react-native-svg`,
`react-native-worklets`, `react-dom`/`react-native-web`…) los exigen Expo
Router, Reanimated, `lucide-react-native` o el dev-client: **no los quites**.
`src/constants/theme.ts` (resto de la plantilla de Expo que nadie importaba) se borró el 2026-10-09.

## Configuración de `app.json`

Con RN 0.86 la new architecture es obligatoria (y Reanimated 4 la
requiere), por eso `app.json` ya **no** define `newArchEnabled`. El
`ios.bundleIdentifier` es `com.diaznodias.b2c_mobile_app` (igual al
package de Android); es provisional — definir el definitivo antes de
publicar en iOS.

## Tamaño del APK y arquitecturas (2026-10-08)

La app **no tiene soporte ni código de TV** (verificado: sin `leanback`,
`isTV`, `hasTVPreferredFocus` ni dependencias `tv*`; es solo móvil). Lo que
infla el APK universal (~114 MB) son las **4 ABIs de CPU**
(`armeabi-v7a, arm64-v8a, x86, x86_64`): ~88 MB de `.so` (cada ABI pesa
16–25 MB). Release = `arm64-v8a,armeabi-v7a` (~64 MB) con
`npm run build:apk` / perfil EAS `preview`. Desarrollo = todas (el AVD es
`x86_64`). Además, `app.json` activa `enableMinifyInReleaseBuilds` y
`enableShrinkResourcesInReleaseBuilds` (vía `expo-build-properties`) para
achicar el dex (~16 MB sin minificar). **Solo afectan al build de release**
y, como `android/` es generado, hay que aplicarlos con
`npx expo prebuild --platform android` antes de `npm run build:apk`. Si el
release minificado crashea al abrir o pierde una librería por reflexión,
probar primero con `enableMinifyInReleaseBuilds: false` y agregar
`extraProguardRules` en vez de apagarlo del todo.

## Navegación: `useSafePush`, no `router.push` directo

`router.push` siempre apila una pantalla: tocar varias veces seguidas un
producto abría N copias del detalle y había que volver N veces. Todo botón o
fila que abra una pantalla del stack usa `useSafePush()`
(`src/hooks/useSafePush.ts`), que descarta los toques repetidos durante
700 ms (`src/utils/navigation.ts`, con tests). La ventana es **global**, no
por componente: cubre la animación `slide_from_right`. `router.replace`
(tabs, login/registro) y `router.back` no lo necesitan.

## Perfil y "Información personal" (`profile.tsx`)

- **El perfil se revalida con `GET /api/auth/me`** (`useUserStore.refreshUser`): al
  arrancar (`rehydrateAuth`), al abrir la pantalla y con pull-to-refresh. El store
  solo persiste lo que llegó en el login, así que sin esto los datos (nombre,
  teléfono…) quedaban viejos y un token vencido seguía pareciendo sesión activa
  (el 401 lo cierra el listener global). `me()` usa `dedup: false` porque se llama
  varias veces en pocos segundos. Si la sesión se cierra mientras se pide, no se
  resucita al usuario.
- `is_show_user = 0` muestra `ModuleMaintenance` (como `is_show_cart` en el carrito).
- **Cambiar contraseña** (`ModalResetPassword`): el backend exige que la contraseña
  **antigua** también cumpla la política (8–40, mayúscula, minúscula, número y
  símbolo) y responde **400** (no 401) si es incorrecta. `getPasswordChangeIssues`
  (`utils/passwordChange.ts`) lo valida en el cliente y avisa si la nueva es igual a
  la antigua. Los campos declaran `autoComplete`/`textContentType` para los gestores
  de contraseñas. Limitación del backend: un usuario antiguo con una clave débil no
  puede cambiarla.

## Textos de la interfaz: tuteo, no voseo

Toda la UI habla de "tú" ("Inicia sesión", "Agrega productos", "¿No tienes
cuenta?"), no de "vos" ("Iniciá", "Agregá", "¿No tenés?"). Había una mezcla;
`utils/uiCopy.test.ts` escanea `src/` y falla si aparece una forma de voseo.
Si el test marca una palabra legítima, ajusta su lista en vez de desactivarlo.
