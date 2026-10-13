import { View } from 'react-native';
import { Check, Circle } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';
import { PASSWORD_REQUIREMENTS } from '@/utils/validations';

import { Txt } from '../ui/Txt';

/**
 * Medidor de fuerza en vivo (4 barras + checklist). **Mismo contrato que
 * `@/components/PasswordStrengthMeter`** (`password`, `colors`); los requisitos salen de
 * `PASSWORD_REQUIREMENTS`, la misma fuente que valida `isPasswordValid`, así que el checklist
 * visual nunca se desincroniza de lo que el backend exige.
 *
 * Qué cambia: requisitos de 14 px (eran 12) con icono de check/círculo en vez de los glifos
 * ✓ y •, y el estado cumplido/pendiente se anuncia al lector de pantalla (antes solo se veía).
 */
export function PasswordStrengthMeter({ password, colors }: { password: string; colors: ThemeColors }) {
  const metCount = PASSWORD_REQUIREMENTS.filter((r) => r.re.test(password)).length;
  const hasMinLength = password.length >= 8;
  const strengthBars = hasMinLength ? metCount : Math.min(metCount, 3);
  const strengthColor =
    strengthBars >= 4 && hasMinLength ? colors.success : strengthBars >= 2 ? colors.warning : colors.danger;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: i < strengthBars ? strengthColor : colors.border,
            }}
          />
        ))}
      </View>
      <View style={{ gap: 4 }}>
        <RequirementLine met={hasMinLength} label="Al menos 8 caracteres" colors={colors} />
        {PASSWORD_REQUIREMENTS.map((r) => (
          <RequirementLine key={r.label} met={r.re.test(password)} label={r.label} colors={colors} />
        ))}
      </View>
    </View>
  );
}

function RequirementLine({ met, label, colors }: { met: boolean; label: string; colors: ThemeColors }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
      accessible
      accessibilityLabel={`${label}: ${met ? 'cumplido' : 'pendiente'}`}
    >
      {met ? (
        <Check size={16} color={colors.success} strokeWidth={3} />
      ) : (
        <Circle size={16} color={colors.muted} />
      )}
      <Txt variant="label" color={met ? 'foreground' : 'muted'} colors={colors} style={{ fontWeight: '500' }}>
        {label}
      </Txt>
    </View>
  );
}
