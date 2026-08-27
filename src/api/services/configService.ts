import { axiosRequest } from '../axiosRequest';
import type { AppConfig } from '@/store';
import type { ConfigColors } from '@/theme';
import type {
  Advertising,
  Brand,
  BranchGroup,
  ConfigData,
  Department,
  Envelope,
} from '@/types/whitelabel';

const ENDPOINT = '/api/config/get';

/**
 * Carga la configuración global de la app (whitelabel).
 * Se llama en boot, antes de mostrar cualquier pantalla.
 *
 * Devuelve SOLO la `data` del envelope, no el envelope completo.
 * El `data` incluye: app_config, config_colors, advertisings, brands,
 * departments, branches (todos opcionales menos app_config).
 */
export async function loadConfig(signal?: AbortSignal): Promise<ConfigData> {
  const envelope = await axiosRequest<Envelope<ConfigData>>({
    method: 'GET',
    url: ENDPOINT,
    signal,
  });
  return envelope.data;
}

// Re-exports de tipos para que callers que importan de este módulo
// no necesiten conocer la ruta @/types/whitelabel.
export type {
  AppConfig,
  ConfigColors,
  Advertising,
  Brand,
  BranchGroup,
  ConfigData,
  Department,
};
