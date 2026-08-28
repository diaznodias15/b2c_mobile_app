import { describe, it, expect } from 'vitest';
import { buildThemeColors, SOFT_COLORS } from './colors';
import type { ConfigColors } from './colors';

describe('buildThemeColors', () => {
  it('devuelve SOFT_COLORS cuando config es null', () => {
    expect(buildThemeColors(null)).toBe(SOFT_COLORS);
    expect(buildThemeColors(undefined)).toBe(SOFT_COLORS);
  });

  it('mapea los col_* del whitelabel a los tokens internos', () => {
    const cfg: ConfigColors = {
      col_background: '#ABCDEF',
      col_primary: '#123456',
      col_success: '#00FF00',
      col_danger: '#FF0000',
      col_warning: '#FFAA00',
      col_section: '#FFFFFF',
      col_navbar: '#FAFAFA',
      col_navbar_departments: '#0000FF',
      col_footer: '#F0F0F0',
      col_product_card: '#FFFFFF',
      col_background_bottom_navbar: '#FFFFFF',
      col_secondary_bottom_navbar: '#888888',
      col_text_for_background: '#000000',
      col_text_for_section: '#111111',
      col_text_for_primary: '#FFFFFF',
    };

    const t = buildThemeColors(cfg);

    expect(t.background).toBe('#ABCDEF');
    expect(t.primary).toBe('#123456');
    expect(t.success).toBe('#00FF00');
    expect(t.danger).toBe('#FF0000');
    expect(t.warning).toBe('#FFAA00');
    expect(t.section).toBe('#FFFFFF');
    expect(t.navbar).toBe('#FAFAFA');
    expect(t.navbarDepartments).toBe('#0000FF');
    expect(t.footer).toBe('#F0F0F0');
    expect(t.productCard).toBe('#FFFFFF');
    expect(t.bottomNavbar).toBe('#FFFFFF');
    expect(t.secondary).toBe('#888888');
    expect(t.onPrimary).toBe('#FFFFFF');
  });

  it('deriva primaryOverlay con alpha 0.10', () => {
    const t = buildThemeColors({ col_primary: '#008000' });
    expect(t.primaryOverlay).toBe('rgba(0, 128, 0, 0.1)');
  });

  it('deriva primaryOverlaySoft con alpha 0.05', () => {
    const t = buildThemeColors({ col_primary: '#123456' });
    expect(t.primaryOverlaySoft).toBe('rgba(18, 52, 86, 0.05)');
  });

  it('deriva border a partir de text_for_section con 12% opacity', () => {
    const t = buildThemeColors({ col_text_for_section: '#1A1A2E' });
    expect(t.border).toBe('rgba(26, 26, 46, 0.12)');
  });

  it('cae a SOFT_COLORS para keys faltantes', () => {
    const t = buildThemeColors({ col_primary: '#FF00FF' });
    // primary viene de la config
    expect(t.primary).toBe('#FF00FF');
    // success cae al soft
    expect(t.success).toBe(SOFT_COLORS.success);
  });

  it('foreground prioriza col_text_for_background sobre col_text_for_section', () => {
    const t1 = buildThemeColors({
      col_text_for_background: '#111',
      col_text_for_section: '#222',
    });
    expect(t1.foreground).toBe('#111');
  });

  it('foreground cae a col_text_for_section si no hay col_text_for_background', () => {
    const t = buildThemeColors({ col_text_for_section: '#222' });
    expect(t.foreground).toBe('#222');
  });

  it('config real del backend (snapshot de Farmacia Samán) parsea', () => {
    // Snapshot del response real de /api/config/get que probamos en dev
    const realConfig: ConfigColors = {
      col_background: '#F5F4F0',
      col_background_dark: '#0F0F1A',
      col_danger: '#F87171',
      col_danger_dark: '#F87171',
      col_footer: '#FEFFFE',
      col_footer_dark: '#15151F',
      col_navbar: '#FEFFFE',
      col_navbar_dark: '#1A1A2E',
      col_navbar_departments: '#1014C5',
      col_navbar_departments_dark: '#252538',
      col_primary: '#008000',
      col_primary_dark: '#008000',
      col_section: '#FEFFFE',
      col_section_dark: '#1A1A2E',
      col_success: '#17C964',
      col_success_dark: '#17C964',
      col_text_for_background: '#1A1A2E',
      col_text_for_background_dark: '#FEFFFE',
      col_warning: '#f5a524',
      col_warning_dark: '#f5a524',
      col_text_for_warning: '#0F0F1A',
      col_text_for_warning_dark: '#0F0F1A',
      col_product_card: '#FEFFFE',
      col_product_card_dark: '#1A1A2E',
      col_text_for_product_card: '#1A1A2E',
      col_text_for_product_card_dark: '#FEFFFE',
      col_background_bottom_navbar: '#FEFFFE',
      col_background_bottom_navbar_dark: '#FEFFFE',
      col_primary_bottom_navbar: '#008000',
      col_primary_bottom_navbar_dark: '#008000',
      col_secondary_bottom_navbar: '#757575',
      col_secondary_bottom_navbar_dark: '#a8a8a8',
    };

    const t = buildThemeColors(realConfig);
    expect(t.primary).toBe('#008000');
    expect(t.background).toBe('#F5F4F0');
    expect(t.navbarDepartments).toBe('#1014C5');
    expect(t.success).toBe('#17C964');
    expect(t.danger).toBe('#F87171');
    expect(t.warning).toBe('#f5a524');
  });
});
