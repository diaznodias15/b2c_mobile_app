// Metro configuration for Expo + Uniwind
// https://docs.expo.dev/guides/customizing-metro/
// https://docs.uniwind.dev/quickstart
//
// Notas para Windows:
//   - El cache vive en %TEMP%/metro-cache. Si ves EMFILE (too many open
//     files), corré `npm run clean:metro` o `expo start --clear`.
//   - Deshabilitamos el health check para reducir file handles abiertos.

const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// Reducir uso de file handles en Windows (EMFILE workaround).
config.watcher = {
  ...(config.watcher ?? {}),
  healthCheck: { enabled: false },
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
