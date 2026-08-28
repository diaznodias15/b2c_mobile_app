import { describe, it, expect, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfigStore } from './config.store';

const sampleConfig = {
  tx_company_name: 'Farmacia El Samán',
  tx_company_rif: 'J-12345678-9',
  tx_company_phone: '+58 412-1234567',
  is_lite_mode: '1',
  is_allow_delivery: '1',
  config_colors: {
    col_primary: '#008000',
    col_background: '#F5F4F0',
    col_navbar_departments: '#1014C5',
  },
};

describe('useConfigStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useConfigStore.getState().reset();
  });

  it('starts with null config and no errors', () => {
    const s = useConfigStore.getState();
    expect(s.appConfig).toBeNull();
    expect(s.isLoading).toBe(false);
    expect(s.isError).toBe(false);
    expect(s.isMaintenance).toBe(false);
  });

  it('setAppConfig stores the config and clears loading/error', () => {
    useConfigStore.getState().setAppConfig(sampleConfig);
    const s = useConfigStore.getState();
    expect(s.appConfig).toEqual(sampleConfig);
    expect(s.isLoading).toBe(false);
    expect(s.isError).toBe(false);
  });

  it('setLoading toggles isLoading flag', () => {
    useConfigStore.getState().setLoading(true);
    expect(useConfigStore.getState().isLoading).toBe(true);
    useConfigStore.getState().setLoading(false);
    expect(useConfigStore.getState().isLoading).toBe(false);
  });

  it('setError sets isError true and stores message', () => {
    useConfigStore.getState().setError('algo salió mal');
    const s = useConfigStore.getState();
    expect(s.isError).toBe(true);
    expect(s.errorInfo).toBe('algo salió mal');
    expect(s.isLoading).toBe(false);
  });

  it('setError(null) clears the error', () => {
    useConfigStore.getState().setError('algo');
    useConfigStore.getState().setError(null);
    const s = useConfigStore.getState();
    expect(s.isError).toBe(false);
    expect(s.errorInfo).toBeNull();
  });

  it('setMaintenance toggles maintenance flag', () => {
    useConfigStore.getState().setMaintenance(true);
    expect(useConfigStore.getState().isMaintenance).toBe(true);
    useConfigStore.getState().setMaintenance(false);
    expect(useConfigStore.getState().isMaintenance).toBe(false);
  });

  it('reset() restores initial state', () => {
    useConfigStore.getState().setAppConfig(sampleConfig);
    useConfigStore.getState().setLoading(true);
    useConfigStore.getState().reset();
    const s = useConfigStore.getState();
    expect(s.appConfig).toBeNull();
    expect(s.isLoading).toBe(false);
  });

  describe('getThemeColors', () => {
    it('returns Soft defaults when no config is loaded', () => {
      const colors = useConfigStore.getState().getThemeColors();
      // Defaults del SOFT_COLORS (matchean el backend real)
      expect(colors.primary).toBe('#008000');
      expect(colors.background).toBe('#F5F4F0');
    });

    it('uses backend colors (col_*) when config has them', () => {
      useConfigStore.getState().setAppConfig({
        config_colors: {
          col_primary: '#ff0000',
          col_background: '#000000',
        },
      });
      const colors = useConfigStore.getState().getThemeColors();
      expect(colors.primary).toBe('#ff0000');
      expect(colors.background).toBe('#000000');
      // Mantiene Soft en los no provistos
      expect(colors.warning).toBe('#F5A524');
    });
  });

  describe('persistence', () => {
    it('persists appConfig to AsyncStorage', async () => {
      useConfigStore.getState().setAppConfig(sampleConfig);
      // Esperar a que Zustand persista.
      await new Promise((r) => setTimeout(r, 10));
      const stored = await AsyncStorage.getItem('config-storage');
      expect(stored).toBeTruthy();
      expect(stored).toContain('Farmacia El Samán');
    });
  });
});
