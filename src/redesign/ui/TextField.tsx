import { useState, type ReactNode } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

import { MIN_TOUCH, TYPE } from './tokens';
import { Txt } from './Txt';
import { useColors } from './useColors';

/**
 * Campo de texto del rediseño: **etiqueta siempre visible** (nunca solo placeholder), alto ≥48,
 * icono opcional a la izquierda, mensaje de error JUNTO al campo (en 14 px, y anunciado al lector
 * de pantalla) y ayuda opcional debajo. Con `secureTextEntry` incluye el botón de mostrar/ocultar
 * (de 48 dp) y no hace falta pasar nada más.
 *
 * El borde cambia de grosor y color con el foco y el error (no solo de color). Las props de
 * autocompletado (`autoComplete`/`textContentType`) se pasan tal cual para los gestores de
 * contraseñas.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  error,
  helper,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  editable = true,
  right,
  colors,
  inputProps,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  /** Mensaje de error; si existe, el campo se marca en rojo y se anuncia. */
  error?: string | null;
  helper?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  maxLength?: number;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  editable?: boolean;
  /** Elemento a la derecha (p. ej. un botón); con `secureTextEntry` se usa el de mostrar/ocultar. */
  right?: ReactNode;
  colors?: ThemeColors;
  /** Escape para props de `TextInput` que este componente no expone. */
  inputProps?: TextInputProps;
}) {
  const theme = useColors(colors);
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const hasError = !!error;
  const borderColor = hasError ? theme.danger : focused ? theme.primary : theme.border;

  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label" colors={theme}>
        {label}
      </Txt>

      <View
        style={{
          minHeight: MIN_TOUCH,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingLeft: 14,
          paddingRight: secureTextEntry || right ? 4 : 14,
          borderRadius: 12,
          borderWidth: focused || hasError ? 2 : 1,
          borderColor,
          backgroundColor: editable ? theme.productCard : theme.section,
        }}
      >
        {Icon && <Icon size={18} color={theme.muted} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          secureTextEntry={secureTextEntry && !revealed}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={helper}
          style={{ ...TYPE.body, flex: 1, minHeight: MIN_TOUCH - 4, color: theme.foreground, paddingVertical: 8 }}
          {...inputProps}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{ width: MIN_TOUCH - 8, height: MIN_TOUCH - 8, alignItems: 'center', justifyContent: 'center' }}
          >
            {revealed ? <EyeOff size={20} color={theme.muted} /> : <Eye size={20} color={theme.muted} />}
          </Pressable>
        ) : (
          right
        )}
      </View>

      {hasError ? (
        <Txt variant="label" color="danger" colors={theme} style={{ fontWeight: '500' }} accessibilityRole="alert">
          {error}
        </Txt>
      ) : helper ? (
        <Txt variant="caption" color="muted" colors={theme}>
          {helper}
        </Txt>
      ) : null}
    </View>
  );
}
