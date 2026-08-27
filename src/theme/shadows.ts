import { Platform, type ViewStyle } from 'react-native';

/**
 * Sombras suaves (whitelabel-safe).
 * Solo `rgba(0,0,0,0.04..0.10)` para que se vea consistente
 * sobre cualquier color de fondo.
 */
export const Shadows = {
  none: {} as ViewStyle,
  sm: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }) as ViewStyle,
  md: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }) as ViewStyle,
  lg: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }) as ViewStyle,
};
