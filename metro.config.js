// Metro configuration for Expo + Uniwind
// https://docs.expo.dev/guides/customizing-metro/
// https://docs.uniwind.dev/quickstart
//
// Notas para Windows:
//   - El cache de Metro por default vive en %TEMP%/metro-cache y abre
//     MUCHOS file handles. En Windows el limite del proceso se agota
//     rapido y termina en EMFILE (too many open files).
//   - Workaround definitivo: usamos SOLO cache en memoria (no disco).
//     Esto elimina el EMFILE en Windows. El trade-off: el cold start
//     es ~5-10s mas lento porque recompila desde cero cada vez, pero
//     la experiencia de desarrollo es estable.

const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const { MemoryStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Reducir uso de file handles en Windows (EMFILE workaround).
config.watcher = {
  ...(config.watcher ?? {}),
  healthCheck: { enabled: false },
};

// Sustituir el cache de disco por uno en memoria.
// Metro default usa FileStore -> lee/escribe miles de archivos pequenos.
// MemoryStore vive en RAM, no toca el disco.
if (config.transformer && Array.isArray(config.transformer.cacheStores)) {
  config.transformer.cacheStores = [
    new MemoryStore({ max: 200 }),
  ];
}

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
