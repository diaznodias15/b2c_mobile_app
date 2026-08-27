import { View } from 'react-native';
import { Text } from 'heroui-native';

type PasswordStrengthProps = {
  password: string;
};

/**
 * Indicador de fortaleza de contraseña.
 * Mínimo 8 caracteres + mayúscula + número.
 */
export function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /[0-9]/.test(password) },
  ];

  const passed = checks.filter((c) => c.ok).length;
  const labels = ['Débil', 'Aceptable', 'Buena', 'Fuerte'] as const;
  const colors = ['bg-danger', 'bg-warning', 'bg-primary', 'bg-success'] as const;

  if (password.length === 0) return null;

  return (
    <View className="gap-2">
      <View className="flex-row gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < passed ? colors[passed] : 'bg-border'
            }`}
          />
        ))}
      </View>
      <View className="gap-1">
        {checks.map((check) => (
          <View key={check.label} className="flex-row items-center gap-2">
            <View
              className={`w-1.5 h-1.5 rounded-full ${
                check.ok ? 'bg-success' : 'bg-muted'
              }`}
            />
            <Text
              className={`text-xs ${check.ok ? 'text-success' : 'text-muted'}`}
            >
              {check.label}
            </Text>
          </View>
        ))}
      </View>
      <Text className="text-xs text-muted">{labels[passed]}</Text>
    </View>
  );
}
