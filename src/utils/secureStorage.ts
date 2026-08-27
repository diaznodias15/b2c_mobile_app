/**
 * Entry canónico de secureStorage.
 *
 * Metro resuelve este import a:
 * - `secureStorage.web.ts` cuando `Platform.OS === 'web'`
 * - `secureStorage.native.ts` cuando es iOS o Android
 *
 * Este archivo es el fallback para entornos sin plataforma (tests, SSR).
 * En tests, mockeamos este path con `vi.mock('@/utils/secureStorage', ...)`.
 *
 * Si en el futuro hace falta extender el wrapper (e.g. encriptación extra,
 * migrar de expo-secure-store a otra cosa), todos los call sites siguen
 * importando de aquí y solo cambia la implementación.
 */

export { getItemAsync, setItemAsync, deleteItemAsync } from './secureStorage.native';
