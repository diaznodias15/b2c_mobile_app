import { forwardRef, type ReactNode } from 'react';
import { TextInput, View } from 'react-native';
import { Text } from 'heroui-native';

export type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'off';
  textContentType?: 'emailAddress' | 'password' | 'name' | 'telephoneNumber';
  rightAccessory?: ReactNode;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'go' | 'send';
  maxLength?: number;
};

/**
 * Wrapper de TextField con label, error y hint.
 * Usa TextInput de RN por simplicidad; visualmente alineado con el
 * theme Soft (border, radius, colores). Migrable a TextField de
 * HeroUI Native si se quiere el look exacto del design system.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    value,
    onChangeText,
    placeholder,
    error,
    hint,
    required,
    disabled,
    secureTextEntry,
    keyboardType,
    autoCapitalize = 'none',
    autoComplete,
    textContentType,
    rightAccessory,
    onBlur,
    onSubmitEditing,
    returnKeyType,
    maxLength,
  },
  ref
) {
  const hasError = Boolean(error);

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        {required ? (
          <Text className="text-sm text-danger">*</Text>
        ) : null}
      </View>
      <View
        className={`flex-row items-center rounded-[14px] border bg-surface px-4 h-12 ${
          hasError ? 'border-danger' : 'border-border focus:border-primary'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          maxLength={maxLength}
          className="flex-1 text-base text-foreground"
          accessibilityLabel={label}
        />
        {rightAccessory}
      </View>
      {hasError ? (
        <Text className="text-xs text-danger">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-muted">{hint}</Text>
      ) : null}
    </View>
  );
});
