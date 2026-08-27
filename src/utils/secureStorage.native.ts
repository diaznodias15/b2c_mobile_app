/**
 * Implementación nativa (iOS/Android) del secureStorage.
 *
 * Usa `expo-secure-store` directamente:
 * - iOS → Keychain Services (encriptado por hardware)
 * - Android → Keystore + EncryptedSharedPreferences
 *
 * Mantiene la misma API que la versión web para que el código de dominio
 * no sepa en qué plataforma corre.
 */

import * as SecureStore from 'expo-secure-store';

export const getItemAsync = SecureStore.getItemAsync;
export const setItemAsync = SecureStore.setItemAsync;
export const deleteItemAsync = SecureStore.deleteItemAsync;
