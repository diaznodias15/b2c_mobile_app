import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Configuración de Vitest para tests de lógica pura.
 *
 * En esta primera fase testeamos solo funciones sin RN (utils, stores,
 * theme builders, axios wrapper con mocks). Cuando agreguemos componentes
 * con @testing-library/react-native, sumamos environment 'jsdom' o
 * 'happy-dom' aquí.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/index.ts',
        'src/uniwind-types.d.ts',
        'src/app/**', // layouts/screens testean con testing-library, no acá
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Importante: NO resolver '@/theme' al barrel (index.ts).
      // Rollup falla con `import type` cuando hay `export *` re-exports
      // encadenados. Apuntamos al directorio para que imports del tipo
      // '@/theme/colors' funcionen y los barrels se usen solo desde código.
      '@/theme': path.resolve(__dirname, './src/theme'),
      '@/api': path.resolve(__dirname, './src/api'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
    },
  },
});
