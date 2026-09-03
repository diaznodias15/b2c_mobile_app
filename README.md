# Farmacia El Samán de Perijá — App B2C

App móvil B2C (Business-to-Consumer) para la cadena de farmacias venezolana
**Farmacia El Samán de Perijá**. Permite a los clientes:

- Explorar el catálogo por departamento y categoría
- Ver productos destacados y buscar
- Armar un carrito de compras
- Checkout con entrega a domicilio o pickup en sede
- Iniciar sesión, ver perfil y órdenes

App universal (iOS + Android + Web) construida con **React Native + Expo SDK 57**.

---

## Stack

- **Expo SDK 57** (React Native 0.81, React 19, React Compiler)
- **Expo Router** (file-based routing, typed routes)
- **HeroUI Native** + **Uniwind** (Tailwind CSS para RN)
- **Zustand** (estado global) + **TanStack Query** (data fetching)
- **Axios** con wrapper de auth y dedup
- **expo-secure-store** (tokens) + **AsyncStorage** (persist)
- **react-hook-form** + **Zod** (formularios y validación)
- **Vitest** (testing)

API backend: `https://api-farmasaman.icommerce360.com`
Whitelabel (colores, RIF, contacto, exchange rate) controlado por el dashboard
del admin vía `GET /api/config/get`.

---

## Prerrequisitos

- **Node.js 22.11.0 LTS** (EAS usa exactamente esta versión; ver `eas.json`)
- **npm** o **pnpm** o **yarn**
- **Git**
- **Watchman** (solo macOS — no hace falta en Windows)
- **Windows 10/11** con PowerShell 5.1+ o **macOS** o **Linux**

### Para iOS (cualquier plataforma)

- **Apple ID** (cuenta gratis, no requiere Apple Developer de $99 para dev builds)
- **Expo Go** (App Store) — solo para pruebas rápidas sin módulos nativos custom
- Opcional: **EAS CLI** para dev builds (`npm i -g eas-cli`)

### Para Android

- **Android Studio** con un emulador o un device físico con USB debugging
- **Java 17+**

---

## Setup

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd b2c_mobile_app
npm install
```

### 2. Variables de entorno

Copiá `.env.example` a `.env` y editá los valores si hace falta:

```bash
cp .env.example .env
```

Variables:

- `EXPO_PUBLIC_API_URL` — base URL del backend (default: producción)
- `EXPO_PUBLIC_API_TIMEOUT` — timeout en ms (default: 60000)

Las vars con prefijo `EXPO_PUBLIC_` se inyectan en el bundle del cliente
(visibles en runtime). Para vars secretas del server usá `extra` en
`app.json` o EAS Secrets.

### 3. Verificar

```bash
npm run typecheck   # TypeScript
npm test            # Vitest (265 tests al día de hoy)
```

---

## Cómo iniciar el proyecto en desarrollo

El entry point es `npx expo start`. Tiene varios flags que cambian el
comportamiento según la plataforma.

### Web (browser, para testing rápido)

```bash
npm run web
# o equivalente:
npx expo start --web
```

Abre automáticamente `http://localhost:8081` con la app corriendo en modo
web. Útil para iterar en layout, copy, navegación. **No usa módulos
nativos**, así que es lo más rápido para dev.

Hot reload activado: editás un archivo y se ve al toque.

### iOS — Tres opciones

#### Opción A: iOS Simulator (solo macOS con Xcode)

```bash
npx expo start --ios
```

Abre el simulador de iPhone con la app. **Necesita macOS + Xcode**. No es
el caso si estás en Windows.

#### Opción B: iPhone físico con Expo Go (rápido pero limitado)

```bash
npx expo start --host lan
```

1. En tu iPhone, instalá **Expo Go** desde la App Store.
2. Asegurate de que el iPhone esté en la **misma Wi-Fi** que tu PC.
3. Abrí Expo Go → **Enter URL manually** → escribí:
   ```
   exp://<IP-DE-TU-PC>:8081
   ```
   Para encontrar tu IP: en Windows `ipconfig`, en macOS/Linux `ifconfig`
   (buscá la interfaz Wi-Fi activa, suele ser `192.168.x.x`).
4. Tap **Connect**.

> ⚠️ **Limitaciones de Expo Go**: NO incluye todos los módulos nativos de
> tu app. Si el bundle pide un módulo que Expo Go no trae, ves
> `Cannot find native module 'X'` en pantalla roja. Solución: Opción C.

#### Opción C: iPhone físico con EAS dev build (RECOMENDADA)

El dev build es un `.app` compilado con **todos** los módulos nativos de
tu proyecto (`ExpoAsset`, `ExpoSecureStore`, `ExpoFetchModule`, etc.) y
después se conecta a tu dev server como Expo Go pero sin las
limitaciones. **Se compila UNA sola vez**; después cada cambio de código
es instantáneo con Hot Reload.

##### 1. Login en EAS

```bash
npx eas-cli login
```

Te abre el browser para OAuth. Si no tenés cuenta de Expo, la creás
gratis ahí mismo.

##### 2. Disparar el primer build (10-20 min)

```bash
npx eas-cli build --profile development --platform ios
```

EAS te va a preguntar cosas. Las defaults funcionan:

- **Certificados / provisioning profile**: deja que EAS los genere
  automáticamente (es internal distribution, no necesitás Apple Developer
  pago)
- **Apple Team ID**: si te lo pide, dejá en blanco

El primer build tarda 10-20 min (EAS compila en la nube). Los siguientes
son más rápidos porque cachea las dependencias nativas.

##### 3. Instalar en el iPhone

Cuando termina, EAS te da un **link de descarga**. Abrilo en **Safari del
iPhone** (no en Chrome ni en otro browser, Safari es el único que puede
instalar perfiles de desarrollo):

1. Safari abre el link → "Install" → confirmá
2. Settings → General → VPN & Device Management → confiá en el perfil
3. Volvé a Safari y abrí el link de nuevo → "Install" la app
4. La app se llama igual que el `name` de tu `app.json` (típicamente
   "b2c_mobile_app")

##### 4. Conectar al dev server

Una vez instalada, abrí la app en el iPhone. Te aparece la pantalla
"Enter URL". Escribí:

```
exp://<IP-DE-TU-PC>:8081
```

Tap **Connect**. La primera vez tarda en compilar el bundle (~30s). Después
todo es instantáneo con Hot Reload.

##### 5. Builds subsiguientes

**No necesitás volver a buildear** salvo que:

- Agregues un módulo nativo nuevo (`npx expo install X`)
- Cambies `app.json` o `eas.json`
- Cambies dependencias nativas (`package.json`)

Si solo editás código JS/TSX, el cambio se refleja al instante con Hot
Reload. Para forzar reload, agitá el iPhone → "Reload" en el dev menu.

### Android — Emulator o device

```bash
# Emulator (requiere Android Studio con un AVD corriendo)
npx expo start --android

# Device físico con USB debugging
npx expo start --android
# Asegurate de que `adb devices` muestre tu device
```

O para emular web con Chrome (sirve para chequear layout Android en
pantallas chicas sin emulador):

```bash
npx expo start --web
```

Abrí DevTools → toggle device toolbar → iPhone o Pixel.

---

## Scripts disponibles

| Script | Qué hace |
|---|---|
| `npm run web` | Inicia en modo web (browser) |
| `npm start` | Inicia en modo dev (Metro, sin plataforma) |
| `npm run start:clear` | Inicia forzando clean cache de Metro |
| `npm run start:fresh` | Limpia `.metro-tmp` + `metro-cache` + `--clear` |
| `npm run start:lan` | Inicia escuchando en IP LAN (para iPhone físico) |
| `npm run android` | Build + run en Android emulator/device |
| `npm run ios` | Build + run en iOS simulator (macOS) |
| `npm test` | Corre los tests con Vitest |
| `npm run test:watch` | Tests en watch mode |
| `npm run typecheck` | TypeScript check (sin emit) |
| `npm run lint` | ESLint |
| `npm run reset-project` | Mueve el código a `app-example` y deja `app` en blanco |

---

## Troubleshooting

### `EMFILE: too many open files` en Windows

Metro crea miles de archivos chiquitos en `%TEMP%/metro-cache`. El
workaround ya está aplicado en `metro.config.js` (TEMP redirigido a
`.metro-tmp/` local + `MemoryStore` para transformer cache).

Si volvés a verlo: `npm run start:fresh` limpia todo.

### El iPhone no se conecta al dev server (Windows)

1. **El server está bindeado solo a localhost**. Solución: usá
   `npx expo start --host lan` (no `--host` solo).
2. **El iPhone está en otra Wi-Fi**. Verificá en iPhone: Settings → Wi-Fi.
3. **Firewall de Windows bloqueando**. Verificá que las reglas
   "Node.js JavaScript Runtime" y "EXPO" estén habilitadas en inbound.
4. **IP cambió**. La IP de tu PC puede cambiar si reiniciás. Verificá con
   `ipconfig` y actualizá la URL en Expo Go / Dev Client.

### `Invariant Violation: "main" has not been registered` en iPhone

Tu versión de Expo Go no tiene los módulos nativos que tu bundle pide
(más común: `ExpoAsset`, `ExpoFetchModule`). Solución: instalá un EAS dev
build (Opción C arriba).

### El bundle se sirve en 14-18 MB y tarda 10-20s en compilar

Es normal. La primera compilación de cada cambio grande (cambio en
`package.json`, `metro.config.js`, `app.json`) es lenta. Las siguientes
usando el cache son instantáneas.

### Error de CORS en web

El backend tiene que tener tu origen en la whitelist de CORS. En dev local
es `http://localhost:8081`. Si seguís con CORS, contactá al admin del
backend.

### Uniwind / Tailwind: cambios de estilo no se reflejan

Uniwind procesa el CSS en build time. Si tocás `global.css` o agregás
clases nuevas, hot reload debería detectarlo. Si no: `npm run start:fresh`.

### Tests fallan con error de imports

`vi.mock('@/utils/secureStorage', ...)` se usa para mockear el wrapper.
Verificá que tu test mockea todos los métodos que el código bajo test usa
(`getItemAsync`, `setItemAsync`, `deleteItemAsync`).

---

## Estructura del proyecto

```
src/
├── api/                # axios wrapper + services
│   ├── axiosRequest.ts
│   ├── config.ts       # API_BASE_URL, env vars
│   └── services/       # configService, products, cart, orders, etc.
├── app/                # Expo Router (file-based routes)
│   ├── _layout.tsx     # root layout (Providers + AppShell + Stack)
│   ├── index.tsx       # Home
│   ├── login.tsx       # Auth screens
│   ├── categorias.tsx
│   ├── productos/[department].tsx
│   ├── producto/[slug].tsx
│   └── cart/           # Wizard de checkout
├── components/         # Componentes compartidos
│   ├── AppShell.tsx
│   ├── Providers.tsx
│   ├── EmptyState.tsx
│   └── illustrations.tsx
├── features/           # Features con sus propios componentes/hooks/utils
│   ├── auth/
│   ├── branches/
│   ├── cart/
│   ├── home/
│   └── products/
├── hooks/
│   ├── use-theme.ts
│   └── use-cart-sync.ts
├── store/              # Zustand stores
│   ├── config.store.ts
│   ├── branch.store.ts
│   ├── department.store.ts
│   ├── advertising.store.ts
│   ├── user.store.ts
│   ├── ui.store.ts
│   ├── cart.store.ts
│   └── checkout.store.ts
├── theme/              # Colores, tipografía, sombras
│   ├── colors.ts
│   ├── applyConfigColors.ts  # whitelabel bridge
│   ├── typography.ts
│   └── shadows.ts
├── types/              # TypeScript types
├── utils/              # Helpers (currency, queryParams, secureStorage)
└── global.css          # Entry point de Uniwind (Google Fonts, tokens)
```

---

## Contribuir

- **Branch**: `developer` para features, `main` solo para releases
- **Commits**: convenciones de [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, etc.)
- **Tests**: cualquier feature nueva viene con sus tests
  (`*.test.ts` al lado del archivo)
- **No borrar archivos** en Windows (no hay permisos). Si necesitás
  "eliminar" uno, renombrá a `*.disabled` o `*.bak`.

---

## Licencia

Privado — uso interno de Farmacia El Samán de Perijá.
