# Grupo Maraplus — App B2C

App móvil B2C (Business-to-Consumer) de **Grupo Maraplus**, cadena de
farmacias venezolana. Permite a los clientes:

- Explorar el catálogo por departamento y buscar productos
- Ver productos destacados, detalle, disponibilidad e inventario por sede
- Armar un carrito (local sin sesión; sincronizado con el backend con sesión)
- Hacer checkout: modo **Lite** (un paso, la tienda contacta al cliente) o
  **Full** (entrega a domicilio / pickup + datos de pago), según la config
  del backend
- Iniciar sesión, registrarse, ver su perfil y "Mis órdenes" (con el estado
  de cada pedido, que se puede refrescar bajando con el dedo)

Construida con **React Native + Expo SDK 57**. El objetivo principal es
**Android** (se prueba en emulador y dispositivo real); iOS y Web existen en
la configuración pero no son el foco. Es una app **solo móvil**: no hay
soporte de TV.

> Antes de tocar código, lee [`AGENTS.md`](./AGENTS.md): documenta las
> decisiones de arquitectura, los bugs ya resueltos y las convenciones.
> Este README cubre solo setup, comandos y estructura.

---

## Stack

- **Expo SDK 57** — React Native 0.86, React 19.2, new architecture
- **Expo Router** (rutas por archivo, typed routes)
- **Uniwind** (Tailwind v4 para RN) — solo para los tokens de `global.css`;
  los componentes usan **estilos inline** (ver `AGENTS.md`). No se usa HeroUI.
- **Zustand** (estado global) + **TanStack Query** (data fetching)
- **Axios** con wrapper propio (token, anti-duplicados de 5 s, evento 401)
- **expo-secure-store** (token) + **AsyncStorage** (persistencia de stores)
- **Formularios**: estado local de React + validadores propios
  (`utils/validations.ts`, `utils/phone.ts`, `utils/passwordChange.ts`)
- **react-native-reanimated** 4 + **worklets**, **react-native-keyboard-controller**,
  **react-native-webview** (mapas con Leaflet/OpenStreetMap)
- **Vitest** (tests de lógica: API, stores, utils, theme; no hay tests de
  pantallas)

Backend: `https://api-maraplus.icommerce360.com`. El whitelabel (colores,
RIF, contacto, tasa de cambio, modo Lite, sedes, departamentos, publicidad,
marcas) llega por `GET /api/config/get` y se carga al arrancar
(`bootstrapConfig`).

### Repos relacionados

Viven como carpetas hermanas dentro de `Proyectos FullTech360`:

| Carpeta | Qué es |
|---|---|
| `b2c_app` | App **web** (React). Su carpeta `docs/mobile/` es la especificación por vista que se usó de referencia para esta app. |
| `b2c_api` | **Backend** (Laravel). La fuente de verdad cuando la documentación y el comportamiento no coinciden. |
| `b2c_admin` | Panel de administración (también el POS). |

---

## Prerrequisitos

- **Node.js 22.11.0** (la versión que usa EAS, ver `eas.json`)
- **npm**
- **Git**
- **Android Studio** con SDK (`ANDROID_HOME` → `%LOCALAPPDATA%\Android\Sdk`,
  `platform-tools` y `emulator` en el PATH) y un emulador o dispositivo con
  depuración USB
- **JDK 17 LTS** (ej. Eclipse Temurin) con `JAVA_HOME` apuntando a él. El
  JBR embebido de Android Studio puede ser demasiado nuevo y rompe las
  tareas CMake nativas.

### ⚠️ Expo Go no sirve

La app usa módulos nativos con versiones propias (Reanimated 4, Worklets,
keyboard-controller, etc.). **Hay que compilar un dev-client**; Expo Go trae
un binario fijo incompatible.

### ⚠️ Compilar fuera de OneDrive y desde una terminal normal (Windows)

Si el proyecto vive en una carpeta sincronizada por OneDrive, las tareas
CMake fallan con `ninja: error: manifest 'build.ninja' still dirty after 100
tries`. Excluir la carpeta de Defender no alcanza. Para compilar, trabaja
desde una copia fuera de OneDrive (en este equipo: `C:\dev\b2c_mobile_app`):

- Copia todo **excepto `node_modules`** y corre `npm install` en el destino.
  No uses `robocopy /XJ` sobre `node_modules` (rompe paquetes anidados).
- Para sincronizar solo el código: `robocopy <origen>\src <destino>\src /E`.
  Ojo: `robocopy` no borra, así que los archivos que renombres o elimines en
  el origen hay que quitarlos a mano en la copia.
- Si agregas assets nuevos en `assets/images/`, cópialos también a la copia
  de build o Metro no los encontrará.
- La carpeta de OneDrive sigue siendo la fuente de verdad para git.
- Compila desde **tu propia terminal de Windows** (PowerShell/cmd), no desde
  dentro de una aplicación empaquetada (por ejemplo, la de Claude): ahí las
  rutas del SDK se virtualizan y `ninja` falla con `CreateProcess failed`.

---

## Setup

```bash
git clone <repo-url>
cd b2c_mobile_app
npm install          # también aplica los parches de patches/ (postinstall)
cp .env.example .env
```

Variables (prefijo `EXPO_PUBLIC_`, se inyectan en el bundle — no pongas
secretos aquí; `.env` no se versiona):

| Variable | Default | Descripción |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://api-maraplus.icommerce360.com` | Base URL del backend |
| `EXPO_PUBLIC_API_TIMEOUT` | `60000` | Timeout de requests (ms) |

Verifica que todo está sano:

```bash
npm run typecheck
npm test
```

---

## Desarrollo

### Android (flujo principal)

1. **Una sola vez** (o cuando cambien dependencias nativas, `app.json` o
   plugins), compilar e instalar el dev-client:

   ```bash
   npx expo run:android
   ```

   Genera `android/` (ignorado por git), compila con Gradle e instala en el
   emulador/dispositivo.

2. **Día a día**, solo Metro; los cambios de JS/CSS se ven con reload:

   ```bash
   npm run start:fresh
   ```

   Si usas un emulador y no conecta con Metro: `adb reverse tcp:8081 tcp:8081`.

> **Ojo con el APK instalado.** Si el emulador tiene un APK de **release**
> (por ejemplo, uno que compilaste con `npm run build:apk`), la app lleva el
> JavaScript embebido e **ignora Metro**: nunca verás tus cambios. Necesitas
> el dev-client (`npx expo run:android`). Para comprobarlo:
> `adb shell run-as com.diaznodias.b2c_mobile_app id` falla con "package not
> debuggable" en un release.

### Alternativa: dev build en la nube (EAS)

Más lento por la cola gratuita, pero no requiere entorno local:

```bash
npx eas-cli login
npx eas-cli build --profile development --platform android
```

Instala el APK/AAB resultante y conéctalo a Metro (`npm start`).

### APK de release liviano

El APK universal (4 arquitecturas de CPU) pesa ~114 MB, de los cuales ~88 MB
son librerías nativas duplicadas por arquitectura. Para el release se
compila solo `arm64-v8a` + `armeabi-v7a` (todos los celulares Android,
incluidos los viejos de 32 bits; `x86`/`x86_64` son solo emuladores). Además,
`app.json` activa minify y shrink de recursos en release.

Desde `C:\dev\b2c_mobile_app`, en tu propia terminal:

```bash
npx expo prebuild --platform android   # aplica los cambios de app.json a android/
npm run build:apk
```

Sale en `android/app/build/outputs/apk/release/`. Tras compilarlo, **prueba
que abre, inicia sesión y carga productos y mapas**: el minify puede romper
código que usa reflexión; si pasa, desactiva `enableMinifyInReleaseBuilds`
en `app.json` y agrega reglas de ProGuard en vez de apagarlo del todo. En
EAS, el perfil `preview` ya aplica las dos arquitecturas vía `gradleCommand`.
**No restrinjas las arquitecturas en `android/gradle.properties`**: el
emulador es `x86_64` y el build de desarrollo las necesita.

### Web e iOS

`npm run web` abre la versión web (útil para iterar layout; algunas pantallas
dependen de módulos nativos). iOS requiere macOS + Xcode (`npm run ios`) y
está sin validar: el `bundleIdentifier` de `app.json` es provisional.

### Conectar un dispositivo físico por LAN

```bash
npm run start:lan     # Metro en 0.0.0.0:8082
```

El dispositivo debe estar en la misma Wi-Fi. Si no conecta, revisa el
firewall de Windows (reglas entrantes de Node.js) y que la IP no haya
cambiado (`ipconfig`).

---

## Scripts

| Script | Qué hace |
|---|---|
| `npm start` | Metro (dev server) |
| `npm run start:clean` | Metro con `--clear` |
| `npm run start:fresh` | Borra `.metro-tmp/` y el metro-cache del sistema, y arranca con `--clear` |
| `npm run start:lan` | Metro en la red local, puerto 8082 |
| `npm run start:tunnel` | Metro con túnel |
| `npm run android` / `ios` / `web` | Compila y corre en la plataforma |
| `npm run build:apk` | APK de release solo con `arm64-v8a` y `armeabi-v7a` (corre dentro de `android/`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`expo lint`) |
| `npm run format` | Prettier sobre todo el repo |
| `npm test` | Vitest (una corrida) |
| `npm run test:watch` | Vitest en watch |
| `npm run test:coverage` | Vitest con cobertura |
| `npm run reset-project` | Script de plantilla de Expo — **no usar** en este proyecto |

---

## Estructura

```
src/
├── app/                  # Expo Router
│   ├── _layout.tsx       # Providers + Stack + listener de 401
│   ├── index.tsx         # Home (tab)
│   ├── departments.tsx   # Departamentos (tab)
│   ├── search.tsx        # Buscar (tab)
│   ├── cart.tsx          # Carrito (tab)
│   ├── profile.tsx       # Perfil (vía "Ver más")
│   ├── help.tsx          # Ayuda (placeholder)
│   ├── login.tsx · register.tsx
│   ├── orders.tsx        # Mis órdenes (desde Perfil)
│   ├── checkout.tsx      # Checkout Lite / Full
│   └── product/[slug].tsx
├── components/           # UI compartida (plana). Familias:
│                         #  Providers, bottom-tabs, Toast, FlyingCartOverlay
│                         #  Checkout* · PhoneContactFields · PaymentMethodCard
│                         #  Order* · ModalOrderDetail · ModalLogout
│                         #  ModalResetPassword · Profile* · QuantityStepper
│                         #  Product* · TopProducts · DiscountBadge
│                         #  CartTimer · ModalCartWorkingHours · ModuleMaintenance
├── api/
│   ├── axiosRequest.ts   # wrapper: token, anti-duplicados 5 s, onUnauthorized
│   ├── config.ts         # API_BASE_URL, timeout
│   └── services/         # auth, cart, config, orders, payment-methods,
│                         # products, utilities (+ un .test.ts por servicio)
├── store/                # Zustand: config, branch, department, advertising,
│                         # brands, user, ui, cart, cartTimer, checkout,
│                         # currency, flyingCart, toast
├── hooks/                # useAddToCartFlight, useCartTimer,
│                         # useDisplayCurrency, useRefreshControl,
│                         # useSafePush, useSlowLoading, useDebouncedValue
├── theme/                # colors (whitelabel → ThemeColors), typography,
│                         # spacing, shadows
├── utils/                # lógica pura y testeada: currency, pricing, igtf,
│                         # geo, maps, stock, cartStock, cartTimer, phone,
│                         # orderStatus(Step), orderList, orderPayload,
│                         # passwordChange, productDetailState, refreshGuard,
│                         # navigation, validations, queryParams,
│                         # secureStorage (.native / .web)
├── types/                # cart, checkout, orders, whitelabel
├── test/setup.ts         # setup de Vitest
└── global.css            # tokens de Uniwind (@theme)
patches/                  # parches de patch-package (react-native,
                          # assets-registry, expo-constants, expo-modules-core)
```

Navegación: 5 tabs (**Inicio, Departamentos, Buscar, Carrito, Ver más**);
"Ver más" abre un modal con la moneda de precios, **Mi perfil** (o **Iniciar
sesión** si no hay sesión) y Ayuda. Las demás pantallas (`login`, `register`,
`orders`, `checkout`, `product/[slug]`) son rutas del stack con animación
`slide_from_right`. Detalle completo en `AGENTS.md`.

---

## Troubleshooting

### `EMFILE: too many open files` (Windows)

Metro crea miles de archivos en el temp del sistema. `metro.config.js` ya
redirige `TEMP`/`TMP` a `.metro-tmp/` dentro del proyecto. Si reaparece:
`npm run start:fresh`.

### Un cambio de CSS/tema no se refleja

Uniwind compila `global.css` al bundlear. Prueba `npm run start:fresh`; si
persiste, borra `.metro-tmp/` a mano (el caché real de Metro vive ahí).

### No veo ningún cambio en el emulador

Casi seguro hay un APK de **release** instalado (ignora Metro). Compila e
instala el dev-client con `npx expo run:android`. Ver "Ojo con el APK
instalado" arriba.

### Pantalla blanca al arrancar

No asumas que es un provider. Ver la sección "Providers" de `AGENTS.md`:
se resuelve armando el stack pelado y agregando providers de a uno en un
dispositivo Android real.

### Errores de CMake / ninja al compilar

Casi siempre es OneDrive, el JDK equivocado o compilar desde una app
empaquetada. Ver "Prerrequisitos".

### El teclado en pantalla no aparece en el emulador

El emulador trata el teclado de tu PC como físico y oculta el virtual:

```bash
adb shell settings put secure show_ime_with_hard_keyboard 1
```

### `DUPLICATE_REQUEST`

`axiosRequest` descarta con ese error un `GET` idéntico lanzado en los 5 s
siguientes a otro ya completado. En una recarga voluntaria usa
`dedup: false` (ver `getOrderDetail` con `fresh`, o `me()`); el pull-to-refresh
global ya se protege con `utils/refreshGuard.ts`.

### `Maximum update depth exceeded` / `getSnapshot should be cached`

Un selector de Zustand está armando un objeto nuevo en cada render. Ver el
anti-patrón documentado en `AGENTS.md`.

### Tests: errores al mockear

El wrapper de storage se mockea con `vi.mock('@/utils/secureStorage', ...)`;
el mock debe incluir `getItemAsync`, `setItemAsync` y `deleteItemAsync`.
Los módulos que importan `lucide-react-native` (íconos) no cargan en Node:
la lógica pura va en archivos aparte (ver `utils/orderStatusStep.ts`).

---

## Contribuir

- **Ramas**: `developer` para trabajo en curso, `main` solo para releases.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, `perf:`…).
- **Tests**: la lógica nueva (api, stores, utils) viene con su `*.test.ts`
  al lado del archivo. Antes de commitear: `npm run typecheck && npm test`.
- **Textos de la interfaz en tuteo** ("Inicia sesión", "Agrega productos"),
  nunca voseo. `utils/uiCopy.test.ts` falla si aparece una forma de voseo.
- **Marca**: el proyecto se llamó "Farmacia El Samán de Perijá"; si
  aparece ese nombre en un archivo nuevo o copiado, corregirlo a
  "Grupo Maraplus".

---

## Licencia

Privado — uso interno de Grupo Maraplus.
