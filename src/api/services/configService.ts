import { axiosRequest } from '../axiosRequest';
import type { AppConfig } from '@/store/config.store';

const ENDPOINT = '/api/config/get';

/**
 * Carga la configuración global de la app (whitelabel).
 * Se llama en boot, antes de mostrar cualquier pantalla.
 */
export async function loadConfig(signal?: AbortSignal): Promise<AppConfig> {
  return axiosRequest<AppConfig>({ method: 'GET', url: ENDPOINT, signal });
}
