import { Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

export type Step = {
  id: string;
  label: string;
};

type Props = {
  steps: Step[];
  /** Index del step actual (0-based). */
  current: number;
};

/**
 * Stepper horizontal minimalista para el wizard de checkout.
 * Muestra círculos numerados + label, con check en los completados.
 */
export function StepperHeader({ steps, current }: Props) {
  return (
    <View className="flex-row items-center px-4 py-3 bg-background border-b border-backgroundElement">
      {steps.map((s, i) => {
        const completed = i < current;
        const active = i === current;
        return (
          <View key={s.id} className="flex-1 flex-row items-center">
            <View
              className={`h-6 w-6 items-center justify-center rounded-full ${
                completed
                  ? 'bg-primary'
                  : active
                    ? 'bg-primary/15 border border-primary'
                    : 'bg-backgroundElement'
              }`}
            >
              {completed ? (
                <Check size={12} color="#FFFFFF" />
              ) : (
                <Text
                  className={
                    active
                      ? 'text-[10px] font-bold text-primary'
                      : 'text-[10px] font-bold text-muted'
                  }
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              numberOfLines={1}
              className={`ml-1.5 text-[11px] font-medium ${
                active ? 'text-foreground' : 'text-muted'
              }`}
            >
              {s.label}
            </Text>
            {i < steps.length - 1 ? (
              <View
                className={`flex-1 h-px mx-2 ${
                  completed ? 'bg-primary' : 'bg-backgroundElement'
                }`}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
