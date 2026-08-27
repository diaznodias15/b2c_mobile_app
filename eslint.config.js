// ESLint flat config — Expo + TypeScript strict
// https://docs.expo.dev/guides/using-eslint/

const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'dist-test/**',
      'src/uniwind-types.d.ts',
      'expo-env.d.ts',
    ],
  },
  {
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react/display-name': 'off',
    },
  },
  prettierConfig,
];
