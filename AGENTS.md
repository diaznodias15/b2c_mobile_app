# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

**Marca:** el proyecto se llamó "Farmacia El Samán de Perijá" y se
rebrandeó a **"Grupo Maraplus"** — si aparece la marca vieja en un archivo
nuevo o copiado de otro lado, corregirla.

# Arquitectura actual (2026-09-08)

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

## Bugs de datos ya resueltos (no reintroducir)

- **`getTopProducts` armaba `${TOP_PRODUCTS}?${toQueryString(params)}`** —
  `toQueryString()` ya devuelve el string CON el `?` inicial, así que
  quedaba `??branch=1` y el backend respondía `"La sucursal es
  requerida."` aun con una sede válida. Las demás funciones de
  `src/api/services/products.services.ts` (`getProductList`,
  `getProductSearch`, `getProductDetail`) ya lo hacían bien. Hay test de
  regresión (`not.toContain('??')`) en `products.services.test.ts`.

## Mapa de rutas y BottomTabs (`src/components/bottom-tabs.tsx`)

5 tabs: **Inicio** (`/`), **Departamentos** (`/departments`), **Buscar**
(`/search`), **Carrito** (`/cart`, con badge de `selectCartCount`) y
**Ver Más** (abre un `<Modal>` nativo de RN, no navega directo) con
**Perfil** (`/profile`), **Pedidos** (`/orders`) y **Ayuda** (`/help`).

`orders.tsx` y `help.tsx` son placeholders (mismo patrón que las demás
screens: `<Text className="text-2xl font-bold text-foreground">` +
`<BottomTabs />`) — faltan implementar de verdad.

Cada screen del tab bar repite el mismo layout (`View flex-1 bg-background`
→ contenido → `<BottomTabs />` como hermano). Es un patrón manual, no un
layout compartido — si se agrega una screen nueva a las tabs, copiar ese
patrón.

`app-tabs.tsx`, `app-tabs.web.tsx` (intento con `NativeTabs`) y
`AppShell.tsx` fueron código muerto de intentos previos y se eliminaron.
