// Metro configuration for Expo + Uniwind
// https://docs.expo.dev/guides/customizing-metro/
// https://docs.uniwind.dev/quickstart
//
// =====================================================================
// WORKAROUND EMFILE (Windows) — leer antes de debuggear nada del cache
// =====================================================================
// Metro crea miles de archivos chiquitos en %TEMP%/metro-cache (vía
// metro-file-map). En Windows el limite de file handles del proceso
// Node se agota rapido y termina en:
//
//   Metro error: EMFILE: too many open files
//
// Hay 2 caches separados en Metro:
// 1. transformer.cacheStores — cache de modulos transformados. Lo
//    cambiamos a MemoryStore (RAM) y eliminamos el problema ahi.
// 2. metro-file-map — cache del file graph (shards 00-ff en
//    %TEMP%/metro-cache). Metro NO expone `cacheStores` en su config
//    publica, asi que la unica forma de sacarlo del temp del sistema
//    es monkey-patchear process.env.TEMP ANTES de que Metro lo lea.
//
// Hacemos ambas cosas aca: TEMP local + MemoryStore para transformer.
// El .gitignore ya excluye .metro-tmp/.
// =====================================================================

const path = require('path');
const fs = require('fs');

// Paso 1: Redirigir %TEMP% a un dir local del proyecto (antes que Metro lea).
const projectTmp = path.join(__dirname, '.metro-tmp');
fs.mkdirSync(projectTmp, { recursive: true });
process.env.TEMP = projectTmp;
process.env.TMP = projectTmp;

// Paso 2: Requerir Metro DESPUES del patch.
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const { MemoryStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Paso 3: Transformer cache en RAM (no toca el disco).
if (config.transformer && Array.isArray(config.transformer.cacheStores)) {
  config.transformer.cacheStores = [new MemoryStore({ max: 200 })];
}

// Paso 4: Deshabilitar health check del watcher (menos file handles).
config.watcher = {
  ...(config.watcher ?? {}),
  healthCheck: { enabled: false },
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
