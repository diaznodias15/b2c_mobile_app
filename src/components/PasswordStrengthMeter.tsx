import { Text, View } from 'react-native';

import { PASSWORD_REQUIREMENTS } from '@/utils/validations';
import type { ThemeColors } from '@/theme/colors';

/**
 * Medidor de fuerza en vivo (4 barras + checklist) — usado en el
 * registro y en `ModalResetPassword`. Los requisitos vienen de
 * `PASSWORD_REQUIREMENTS` (misma fuente que valida `isPasswordValid`),
 * así que nunca se puede desincronizar el checklist visual de lo que
 * el backend realmente exige.
 */
export function PasswordStrengthMeter({
  password,
  colors,
}: {
  password: string;
  colors: ThemeColors;
}) {
  const metCount = PASSWORD_REQUIREMENTS.filter((r) => r.re.test(password)).length;
  const hasMinLength = password.length >= 8;
  const strengthBars = hasMinLength ? metCount : Math.min(metCount, 3);
  const strengthColor =
    strengthBars >= 4 && hasMinLength ? colors.success : strengthBars >= 2 ? colors.warning : colors.danger;

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < strengthBars ? strengthColor : colors.border,
            }}
          />
        ))}
      </View>
      <View style={{ marginTop: 8, gap: 4 }}>
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
    <Text style={{ fontSize: 12, color: met ? colors.success : colors.muted }}>
      {met ? '✓' : '•'} {label}
    </Text>
  );
}
