import { useState, forwardRef, type Ref } from 'react';
import { Pressable, TextInput } from 'react-native';
import { TextField, type TextFieldProps } from './TextField';
import { Eye, EyeOff } from 'lucide-react-native';

type PasswordFieldProps = Omit<TextFieldProps, 'secureTextEntry' | 'rightAccessory'>;

/**
 * TextField específico para contraseñas con toggle de visibilidad.
 */
export const PasswordField = forwardRef<TextInput, PasswordFieldProps>(
  function PasswordField(props, ref: Ref<TextInput>) {
    const [visible, setVisible] = useState(false);

    return (
      <TextField
        ref={ref}
        {...props}
        secureTextEntry={!visible}
        rightAccessory={
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={12}
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="p-1"
          >
            {visible ? (
              <EyeOff size={20} color="#6b7280" />
            ) : (
              <Eye size={20} color="#6b7280" />
            )}
          </Pressable>
        }
      />
    );
  }
);
