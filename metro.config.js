// Metro configuration for Expo + Uniwind
// https://docs.expo.dev/guides/customizing-metro/
// https://docs.uniwind.dev/quickstart

const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
