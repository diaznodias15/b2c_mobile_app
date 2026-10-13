import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

import { IconButton } from './IconButton';
import { MIN_TOUCH, TYPE } from './tokens';
import { Txt } from './Txt';
import { useColors } from './useColors';

export type SelectOption = { value: string; label: string };

/** A partir de cuántas opciones aparece el buscador dentro de la lista. */
const SEARCH_FROM = 8;

/**
 * Selector de una opción de una lista larga (p. ej. el banco de origen). El campo se ve como un
 * `TextField` (etiqueta visible, 48 dp, flecha) y al tocarlo abre una **hoja de pantalla completa**
 * con filas de 56 dp, la opción elegida marcada con un check (y en negrita: no solo de color) y, si
 * hay muchas opciones, un buscador para filtrar.
 *
 * Para pocas opciones (≤6) usa `Chip`s directamente: un toque en vez de abrir una lista.
 */
export function SelectField({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  colors,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string | null;
  colors?: ThemeColors;
}) {
  const theme = useColors(colors);
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const selected = options.find((o) => o.value === value);
  const showSearch = options.length >= SEARCH_FROM;
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, filter]);

  const close = () => {
    setOpen(false);
    setFilter('');
  };

  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label" colors={theme}>
        {label}
      </Txt>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? 'sin seleccionar'}`}
        style={({ pressed }) => ({
          minHeight: MIN_TOUCH,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 14,
          borderRadius: 12,
          borderWidth: error ? 2 : 1,
          borderColor: error ? theme.danger : theme.border,
          backgroundColor: theme.productCard,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{ flex: 1 }}>
          <Txt variant="body" color={selected ? 'foreground' : 'muted'} colors={theme} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Txt>
        </View>
        <ChevronDown size={20} color={theme.muted} />
      </Pressable>
      {error ? (
        <Txt variant="label" color="danger" colors={theme} style={{ fontWeight: '500' }} accessibilityRole="alert">
          {error}
        </Txt>
      ) : null}

      <Modal visible={open} animationType="slide" onRequestClose={close} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: 16,
              paddingRight: 8,
              paddingTop: insets.top + 8,
              paddingBottom: 8,
              backgroundColor: theme.productCard,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <Txt variant="section" colors={theme} numberOfLines={1}>
                {label}
              </Txt>
            </View>
            <IconButton icon={X} label="Cerrar" variant="plain" onPress={close} colors={theme} />
          </View>

          {showSearch && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                margin: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.productCard,
              }}
            >
              <Search size={18} color={theme.muted} />
              <TextInput
                value={filter}
                onChangeText={setFilter}
                placeholder="Buscar…"
                placeholderTextColor={theme.muted}
                autoCorrect={false}
                autoCapitalize="none"
                accessibilityLabel={`Buscar en ${label}`}
                style={{ ...TYPE.body, flex: 1, minHeight: MIN_TOUCH, color: theme.foreground }}
              />
            </View>
          )}

          <FlatList
            data={visible}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            ListEmptyComponent={
              <Txt variant="body" color="muted" colors={theme} style={{ textAlign: 'center', padding: 32 }}>
                {options.length === 0 ? 'No hay opciones disponibles.' : 'Sin coincidencias.'}
              </Txt>
            }
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    close();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={item.label}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                    backgroundColor: isSelected ? theme.primaryOverlay : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Txt variant="body" colors={theme} style={{ fontWeight: isSelected ? '700' : '400' }}>
                      {item.label}
                    </Txt>
                  </View>
                  {isSelected && <Check size={20} color={theme.primary} strokeWidth={2.6} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
