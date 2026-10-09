import { Text, TextInput, View } from 'react-native';

import {
  CheckoutField,
  CheckoutFieldLabel,
  checkoutInputStyle,
} from '@/components/CheckoutPrimitives';
import { CheckoutSelectField } from '@/components/CheckoutSelectField';
import { formatPhoneNumber, isPhoneNumberValid, VE_AREA_CODES, VE_COUNTRY_CODE } from '@/utils/phone';
import type { ThemeColors } from '@/theme/colors';

const AREA_CODE_OPTIONS = VE_AREA_CODES.map((code) => ({ value: code, label: code }));

/**
 * Teléfono de contacto en las 3 partes que exige el backend (país +58,
 * operadora y número `000-0000`) — ver `utils/phone.ts`. Lo comparten el
 * checkout Lite (donde es obligatorio aun en retiro) y la entrega a domicilio
 * del checkout Full, para que ambos manden exactamente el mismo formato.
 *
 * El número se guarda ya formateado ("456-7890"): el teclado es numérico y el
 * guión se agrega solo.
 */
export function PhoneContactFields({
  label,
  areaCode,
  number,
  onChangeAreaCode,
  onChangeNumber,
  colors,
}: {
  label: string;
  areaCode: string;
  number: string;
  onChangeAreaCode: (areaCode: string) => void;
  onChangeNumber: (number: string) => void;
  colors: ThemeColors;
}) {
  // Solo se marca el error cuando ya escribió algo incompleto — no mientras el
  // campo está vacío (el botón de continuar ya queda deshabilitado).
  const showError = number.length > 0 && !isPhoneNumberValid(number);

  return (
    <View style={{ marginBottom: 16 }}>
      <CheckoutFieldLabel colors={colors}>{`${label} (${VE_COUNTRY_CODE})`}</CheckoutFieldLabel>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <CheckoutSelectField
            label="Operadora"
            placeholder={VE_AREA_CODES[0]}
            value={areaCode}
            options={AREA_CODE_OPTIONS}
            onChange={onChangeAreaCode}
            colors={colors}
          />
        </View>
        <View style={{ flex: 1.6 }}>
          <CheckoutField label="Número" colors={colors}>
            <TextInput
              value={number}
              onChangeText={(text) => onChangeNumber(formatPhoneNumber(text))}
              placeholder="456-7890"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={8}
              style={[checkoutInputStyle(colors), showError && { borderColor: colors.danger }]}
              accessibilityLabel={`${label}, número`}
            />
          </CheckoutField>
        </View>
      </View>
      {showError && (
        <Text style={{ fontSize: 12, color: colors.danger, marginTop: -8 }}>
          Ingresa los 7 dígitos del número. Ejemplo: 456-7890
        </Text>
      )}
    </View>
  );
}
