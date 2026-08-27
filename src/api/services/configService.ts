import { axiosRequest } from '../axiosRequest';
import type { AppConfig, Branch } from '@/store';
import type { ConfigColors } from '@/theme';

const ENDPOINT = '/api/config/get';

/** Forma del response envelope de la API. */
type Envelope<T> = {
  status: string;
  message: string;
  data: T;
};

/** Forma interna de la data en /api/config/get. */
type ConfigData = {
  app_config: AppConfig;
  config_colors?: ConfigColors;
  branches?: Branch[];
  // Otros campos se agregan en fases siguientes (advertisings, brands, etc.)
};

/**
 * Carga la configuración global de la app (whitelabel).
 * Se llama en boot, antes de mostrar cualquier pantalla.
 *
 * Devuelve SOLO la `data` del envelope, no el envelope completo.
 */
export async function loadConfig(signal?: AbortSignal): Promise<ConfigData> {
  const envelope = await axiosRequest<Envelope<ConfigData>>({
    method: 'GET',
    url: ENDPOINT,
    signal,
  });
  return envelope.data;
}
