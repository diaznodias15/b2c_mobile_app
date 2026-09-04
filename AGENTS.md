# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Arquitectura actual (2026-09-04)

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

**Sobre el bug original de `<Text>` + className:** una sesión anterior
encontró que `className` en `<Text>` se comportaba distinto entre web y
Android (`fontSize`/`margin`/`color` no se aplicaban), lo cual motivó
adoptar HeroUI. Al remover HeroUI se decidió **reintentar `<Text>` +
className crudo** primero (en vez de saltar directo a estilos inline),
bajo la hipótesis de que el bug original pudo ser un efecto secundario de
tener HeroUI + Uniwind conviviendo, no de Uniwind puro. **Si reaparece ese
bug** (texto sin el `fontSize`/`color`/`margin` esperado en Android),
la salida conocida es mezclar: `className` para layout/spacing, `style`
inline para `color`/`fontSize` en ese `<Text>` puntual — no volver a traer
una librería de componentes por esto.

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
