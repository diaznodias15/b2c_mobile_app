# Grupo Maraplus — App B2C

App móvil B2C (Business-to-Consumer) de **Grupo Maraplus**, cadena de
farmacias venezolana. Permite a los clientes:

- Explorar el catálogo por departamento y buscar productos
- Ver productos destacados, detalle, disponibilidad e inventario por sede
- Armar un carrito (local o sincronizado con el backend si hay sesión)
- Hacer checkout: modo **Lite** (un paso, la tienda contacta al cliente) o
  **Full** (entrega a domicilio / pickup + datos de pago), según la config
  del backend
- Iniciar sesión, registrarse, ver perfil y "Mis órdenes"

Construida con **React Native + Expo SDK 57**. El objetivo principal es
**Android** (se prueba en dispositivo real); iOS y Web existen en la
configuración pero no son el foco.

> Antes de tocar código, leé [`AGENTS.md`](./AGENTS.md): documenta las
> decisiones de arquitectura, los bugs ya resueltos y las convenciones.
> Este README cubre solo setup y comandos.

---

## Stack

- **Expo SDK 57** — React Native 0.86, React 19.2, new architecture
- **Expo Router** (rutas por archivo, typed routes)
- **Uniwind** (Tailwind v4 para RN) — solo para los tokens de `global.css`;
  los componentes usan **estilos inline** (ver `AGENTS.md`). No se usa HeroUI.
- **Zustand** (estado global) + **TanStack Query** (data fetching)
- **Axios** con wrapper propio (token, dedup de requests, evento 401)
- **expo-secure-store** (token) + **AsyncStorage** (persistencia de stores)
- **react-hook-form** + **Zod** (formularios)
- **react-native-reanimated** 4 + **worklets**, **react-native-keyboard-controller**,
  **react-native-webview** (mapas con Leaflet/OpenStreetMap)
- **Vitest** (tests de lógica: API, stores, utils, theme)

Backend: `https://api-maraplus.icommerce360.com`. El whitelabel (colores,
RIF, contacto, tasa de cambio, modo Lite, sedes, departamentos, publicidad,
marcas) llega por `GET /api/config/get` y se carga al arrancar
(`bootstrapConfig`).

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

### ⚠️ Compilar fuera de OneDrive (Windows)

Si el proyecto vive en una carpeta sincronizada por OneDrive, las tareas
CMake fallan con `ninja: error: manifest 'build.ninja' still dirty after 100
tries`. Excluir la carpeta de Defender no alcanza. Para compilar, trabajá
desde una copia fuera de OneDrive (en este equipo: `C:\dev\b2c_mobile_app`):

- Copiá todo **excepto `node_modules`** y corré `npm install` en el destino.
  No uses `robocopy /XJ` sobre `node_modules` (rompe paquetes anidados).
- Si agregás assets nuevos en `assets/images/`, copialos también a la copia
  de build o Metro no los encontrará.
- La carpeta de OneDrive sigue siendo la fuente de verdad para git.

---

## Setup

```bash
git clone <repo-url>
cd b2c_mobile_app
npm install          # también aplica los parches de patches/ (postinstall)
cp .env.example .env
```

Variables (prefijo `EXPO_PUBLIC_`, se inyectan en el bundle — no pongas
secretos acá):

| Variable | Default | Descripción |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://api-maraplus.icommerce360.com` | Base URL del backend |
| `EXPO_PUBLIC_API_TIMEOUT` | `60000` | Timeout de requests (ms) |

Verificá que todo está sano:

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

### Alternativa: dev build en la nube (EAS)

Más lento por la cola gratuita, pero no requiere entorno local:

```bash
npx eas-cli login
npx eas-cli build --profile development --platform android
```

Instalá el APK/AAB resultante y conectalo a Metro (`npm start`).

### APK de release liviano

El APK universal (4 arquitecturas de CPU) pesa ~114 MB, de los cuales ~88 MB
son librerías nativas duplicadas por arquitectura. Para el release se
compila solo `arm64-v8a` + `armeabi-v7a` (todos los celulares Android,
incluidos los viejos de 32 bits; `x86`/`x86_64` son solo emuladores):

```bash
npm run build:apk     # desde C:dev2c_mobile_app, en tu propia terminal
```

Sale en `android/app/build/outputs/apk/release/` (~64 MB). En EAS, el
perfil `preview` ya aplica lo mismo vía `gradleCommand`. **No restrinjas
las arquitecturas en `android/gradle.properties`**: el emulador es
`x86_64` y el build de desarrollo (`npx expo run:android`) las necesita.

### Web e iOS

`npm run web` abre la versión web (útil para iterar layout; algunas pantallas
dependen de módulos nativos). iOS requiere macOS + Xcode (`npm run ios`) y
está sin validar: `app.json` tiene un `bundleIdentifier` por definir.

### Conectar un dispositivo físico por LAN

```bash
npm run start:lan     # Metro en 0.0.0.0:8082
```

El dispositivo debe estar en la misma Wi-Fi. Si no conecta, revisá el
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
├── components/           # UI compartida (plana); Providers, bottom-tabs,
│                         # Toast, FlyingCartOverlay, familias Checkout*,
│                         # Order*, Product*, etc.
├── api/
│   ├── axiosRequest.ts   # wrapper: token, dedup 5 s, onUnauthorized
│   ├── config.ts         # API_BASE_URL, timeout
│   └── services/         # auth, cart, config, orders, payment-methods,
│                         # products, utilities (+ un .test.ts por servicio)
├── store/                # Zustand: config, branch, department, advertising,
│                         # brands, user, ui, cart, checkout, currency,
│                         # flyingCart, toast
├── hooks/                # useAddToCartFlight, useDisplayCurrency,
│                         # useDebouncedValue
├── theme/                # colors (whitelabel → ThemeColors), typography,
│                         # spacing, shadows
├── utils/                # currency, pricing, igtf, geo, maps, stock,
│                         # orderStatus, validations, queryParams,
│                         # secureStorage (.native / .web)
├── types/                # cart, checkout, orders, whitelabel
├── test/setup.ts         # setup de Vitest
└── global.css            # tokens de Uniwind (@theme)
patches/                  # parches de patch-package (react-native,
                          # assets-registry, expo-constants, expo-modules-core)
```

Navegación: 5 tabs (**Inicio, Departamentos, Buscar, Carrito, Ver más**);
"Ver más" abre un modal con Perfil y Ayuda. Las demás pantallas
(`login`, `register`, `orders`, `checkout`, `product/[slug]`) son rutas del
stack con animación `slide_from_right`. Detalle completo en `AGENTS.md`.

---

## Troubleshooting

### `EMFILE: too many open files` (Windows)

Metro crea miles de archivos en el temp del sistema. `metro.config.js` ya
redirige `TEMP`/`TMP` a `.metro-tmp/` dentro del proyecto. Si reaparece:
`npm run start:fresh`.

### Un cambio de CSS/tema no se refleja

Uniwind compila `global.css` al bundlear. Probá `npm run start:fresh`; si
persiste, borrá `.metro-tmp/` a mano (el caché real de Metro vive ahí).

### Pantalla blanca al arrancar

No asumas que es un provider. Ver la sección "Providers" de `AGENTS.md`:
se resuelve armando el stack pelado y agregando providers de a uno en un
dispositivo Android real.

### Errores de CMake / ninja al compilar

Casi siempre es OneDrive o el JDK equivocado. Ver "Prerrequisitos".

### `Maximum update depth exceeded` / `getSnapshot should be cached`

Un selector de Zustand está armando un objeto nuevo en cada render. Ver el
anti-patrón documentado en `AGENTS.md`.

### Tests: errores al mockear

El wrapper de storage se mockea con `vi.mock('@/utils/secureStorage', ...)`;
el mock debe incluir `getItemAsync`, `setItemAsync` y `deleteItemAsync`.

---

## Contribuir

- **Ramas**: `developer` para trabajo en curso, `main` solo para releases.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, `perf:`…).
- **Tests**: la lógica nueva (api, stores, utils) viene con su `*.test.ts`
  al lado del archivo. Antes de commitear: `npm run typecheck && npm test`.
- **Marca**: el proyecto se llamó "Farmacia El Samán de Perijá"; si
  aparece ese nombre en un archivo nuevo o copiado, corregirlo a
  "Grupo Maraplus".

---

## Licencia

Privado — uso interno de Grupo Maraplus.
