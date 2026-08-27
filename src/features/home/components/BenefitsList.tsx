import { Text, View } from 'react-native';
import { Truck, ShieldCheck, Pill, CreditCard } from 'lucide-react-native';

/**
 * Lista de beneficios hardcoded con copy en es-VE.
 *
 * En web esto viene de la config del backend. En mobile lo dejamos
 * estático por ahora; si el admin necesita editar los textos, los
 * movemos a `app_config.tx_benefits` en una fase posterior.
 */
const BENEFITS = [
  {
    icon: Truck,
    title: 'Envío a domicilio',
    body: 'Recibe tu pedido en Maracaibo y zonas cercanas.',
  },
  {
    icon: Pill,
    title: 'Variedad en medicamentos',
    body: 'Más de 4.000 productos en catálogo.',
  },
  {
    icon: CreditCard,
    title: 'Paga en Bs. o USD',
    body: 'Efectivo, transferencia, Zelle, Binance.',
  },
  {
    icon: ShieldCheck,
    title: 'Productos regulados',
    body: 'Trabajamos solo con laboratorios certificados.',
  },
] as const;

export function BenefitsList() {
  return (
    <View className="mt-6 px-4 gap-2">
      <Text className="text-base font-bold text-foreground mb-1">
        ¿Por qué elegirnos?
      </Text>
      {BENEFITS.map(({ icon: Icon, title, body }) => (
        <View
          key={title}
          className="flex-row items-start gap-3 bg-backgroundElement rounded-[14px] p-3"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Icon size={18} color="#0f766e" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">
              {title}
            </Text>
            <Text className="text-xs text-muted mt-0.5">{body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
