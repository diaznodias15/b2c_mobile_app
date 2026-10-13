import { TextInput, View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';
import { formatPhoneNumber, isPhoneNumberValid, VE_AREA_CODES, VE_COUNTRY_CODE } from '@/utils/phone';

import { Chip } from '../ui/Chip';
import { MIN_TOUCH, TYPE } from '../ui/tokens';
import { Txt } from '../ui/Txt';

/**
 * Teléfono de contacto en las 3 partes que exige el backend (país +58, operadora y número
 * `000-0000`, ver `utils/phone.ts`). **Mismo contrato que `@/components/PhoneContactFields`**
 * (`label`, `areaCode`, `number`, `onChangeAreaCode`, `onChangeNumber`, `colors`) y mismo
 * formato de salida: el número se guarda ya formateado ("456-7890").
 *
 * Qué cambia:
 *  - La operadora se elige con **chips** visibles (un toque) en vez de abrir un modal con
 *    una lista de 6 opciones.
 *  - Etiquetas siempre visibles de 14 px y campo de 48 dp de alto; el error va debajo del
 *    campo, en 14 px (era 12) y con el ejemplo del formato.
 *  - Autocompletado de teléfono para el gestor del sistema.
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
  // Solo se marca el error cuando ya escribió algo incompleto — no mientras el campo está
  // vacío (el botón de continuar ya queda deshabilitado).
  const showError = number.length > 0 && !isPhoneNumberValid(number);

  return (
    <View style={{ gap: 10 }}>
      <Txt variant="label" colors={colors}>
        {`${label} (${VE_COUNTRY_CODE})`}
      </Txt>

      <View style={{ gap: 6 }}>
        <Txt variant="caption" color="muted" colors={colors}>
          Operadora
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {VE_AREA_CODES.map((code) => (
            <Chip
              key={code}
              label={code}
              selected={code === areaCode}
              onPress={() => onChangeAreaCode(code)}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Txt variant="caption" color="muted" colors={colors}>
          Número
        </Txt>
        <TextInput
          value={number}
          onChangeText={(text) => onChangeNumber(formatPhoneNumber(text))}
          placeholder="456-7890"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          maxLength={8}
          autoComplete="tel"
          textContentType="telephoneNumber"
          accessibilityLabel={`${label}, número`}
          style={{
            ...TYPE.body,
            minHeight: MIN_TOUCH,
            paddingHorizontal: 14,
            borderRadius: 12,
            borderWidth: showError ? 1.5 : 1,
            borderColor: showError ? colors.danger : colors.border,
            backgroundColor: colors.productCard,
            color: colors.foreground,
          }}
        />
        {showError && (
          <Txt variant="label" color="danger" colors={colors} style={{ fontWeight: '500' }}>
            Ingresa los 7 dígitos del número. Ejemplo: 456-7890
          </Txt>
        )}
      </View>
    </View>
  );
}
