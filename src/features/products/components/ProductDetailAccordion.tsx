import { useState } from 'react';
import { LayoutAnimation, Pressable, Text, UIManager, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

// Habilita animaciones en Android (en iOS vienen por defecto).
if (
  UIManager.setLayoutAnimationEnabledExperimental &&
  typeof UIManager.setLayoutAnimationEnabledExperimental === 'function'
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  title: string;
  children: React.ReactNode;
  /** Inicia abierto. */
  defaultOpen?: boolean;
};

/**
 * Acordeón simple con animación de layout. Reutilizable para
 * descripción, especificaciones, contraindicaciones, etc.
 */
export function ProductDetailAccordion({
  title,
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <View className="mx-4 mt-3 bg-backgroundElement rounded-[14px] overflow-hidden">
      <Pressable
        onPress={toggle}
        className="flex-row items-center justify-between p-3"
        accessibilityRole="button"
        accessibilityLabel={`${open ? 'Contraer' : 'Expandir'} ${title}`}
      >
        <Text className="text-sm font-bold text-foreground">{title}</Text>
        <View
          style={{
            transform: [{ rotate: open ? '180deg' : '0deg' }],
          }}
        >
          <ChevronDown size={16} color="#1A1A2E" />
        </View>
      </Pressable>
      {open ? <View className="px-3 pb-3">{children}</View> : null}
    </View>
  );
}
