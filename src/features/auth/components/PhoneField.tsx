import { Pressable, ScrollView, View } from 'react-native';
import { Text } from 'heroui-native';
import { TextField } from './TextField';

const OPERADORAS = ['0412', '0414', '0416', '0422', '0424', '0426'] as const;

type PhoneFieldProps = {
  areaCode: string;
  phoneNumber: string;
  onAreaCodeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  areaCodeError?: string;
  phoneNumberError?: string;
};

/**
 * Campo de teléfono venezolano: prefijo +58 (fijo) + operadora + 7 dígitos.
 * Operadora como pills horizontales para reducir fricción en mobile.
 */
export function PhoneField({
  areaCode,
  phoneNumber,
  onAreaCodeChange,
  onPhoneNumberChange,
  areaCodeError,
  phoneNumberError,
}: PhoneFieldProps) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-medium text-foreground">Teléfono</Text>
        <Text className="text-sm text-danger">*</Text>
      </View>
      <View className="flex-row gap-2 items-start">
        {/* Prefijo +58 fijo */}
        <View className="h-12 px-4 items-center justify-center rounded-[14px] border border-border bg-section">
          <Text className="text-base font-medium text-foreground">+58</Text>
        </View>
        {/* Operadora: pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          className="max-h-12"
        >
          {OPERADORAS.map((op) => {
            const active = areaCode === op;
            return (
              <Pressable
                key={op}
                onPress={() => onAreaCodeChange(op)}
                className={`h-12 px-3 items-center justify-center rounded-[14px] border ${
                  active
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  className={`text-sm font-medium ${
                    active ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {op}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      {areaCodeError ? (
        <Text className="text-xs text-danger">{areaCodeError}</Text>
      ) : null}
      <TextField
        label=""
        value={phoneNumber}
        onChangeText={(t) => onPhoneNumberChange(t.replace(/\D/g, '').slice(0, 7))}
        placeholder="1234567"
        keyboardType="number-pad"
        error={phoneNumberError}
        maxLength={7}
        hint="7 dígitos sin el código de operadora"
      />
    </View>
  );
}
