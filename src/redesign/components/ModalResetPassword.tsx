import { useEffect, useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { CircleAlert, CircleCheck, Lock, Save, X } from 'lucide-react-native';

import { resetPassword } from '@/api/services/auth.services';
import { hexToRgba, type ThemeColors } from '@/theme/colors';
import {
  getPasswordChangeIssues,
  OLD_PASSWORD_INVALID_MESSAGE,
  SAME_PASSWORD_MESSAGE,
} from '@/utils/passwordChange';

import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { TextField } from '../ui/TextField';
import { Txt } from '../ui/Txt';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

/**
 * Cambio de contraseña. **Mismo contrato que `@/components/ModalResetPassword`** (`visible`,
 * `onClose`, `colors`) y misma lógica: el backend exige que la contraseña ANTIGUA también cumpla
 * la política (y responde 400, no 401, si es incorrecta), así que se avisa antes de enviar con
 * `getPasswordChangeIssues`; tras el éxito se cierra solo a los 1,2 s (con el temporizador
 * cancelado al desmontar); mientras se envía no se puede cerrar. Se conservan
 * `statusBarTranslucent` y `navigationBarTranslucent`: sin ellos, en Android el Modal vive en una
 * ventana aparte y `react-native-keyboard-controller` no recibe los eventos del teclado.
 *
 * Qué cambia: campos con `TextField` (etiqueta visible, 48 dp, mostrar/ocultar de 48 dp y errores
 * en 14 px junto al campo), el éxito con icono además de color, el error del servidor como aviso
 * y el cierre como botón de 48 dp.
 */
export function ModalResetPassword({
  visible,
  onClose,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
}) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // El backend exige que la antigua también cumpla la política: se avisa antes de enviar.
  const issues = getPasswordChangeIssues({ oldPassword, newPassword, confirmPassword });
  const canSubmit = issues.canChange && !isSubmitting;

  // Cierre diferido tras el éxito: se cancela si el modal se desmonta antes.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  const reset = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      setSuccess(true);
      closeTimer.current = setTimeout(() => {
        reset();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 16 }}>
        <View
          style={{ backgroundColor: colors.background, borderRadius: 20, maxHeight: '88%', overflow: 'hidden' }}
          accessibilityViewIsModal
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: 20,
              paddingRight: 8,
              paddingVertical: 4,
              backgroundColor: colors.productCard,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Txt variant="section" colors={colors}>
              Cambiar contraseña
            </Txt>
            {!isSubmitting && (
              <IconButton icon={X} label="Cerrar" variant="plain" onPress={handleClose} colors={colors} />
            )}
          </View>

          <KeyboardAwareScrollView
            bottomOffset={24}
            contentContainerStyle={{ padding: 20, gap: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {success ? (
              <View style={{ alignItems: 'center', gap: 10, paddingVertical: 20 }} accessibilityRole="alert">
                <CircleCheck size={40} color={colors.success} strokeWidth={1.8} />
                <Txt variant="label" colors={colors} style={{ textAlign: 'center', fontWeight: '700' }}>
                  Contraseña actualizada correctamente.
                </Txt>
              </View>
            ) : (
              <>
                <TextField
                  label="Contraseña actual"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  icon={Lock}
                  secureTextEntry
                  // Gestores de contraseñas: ofrecer rellenar la actual y guardar la nueva.
                  autoComplete="current-password"
                  textContentType="password"
                  error={issues.oldInvalid ? OLD_PASSWORD_INVALID_MESSAGE : null}
                  colors={colors}
                />

                <View style={{ gap: 12 }}>
                  <TextField
                    label="Contraseña nueva"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    icon={Lock}
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                    error={issues.sameAsOld ? SAME_PASSWORD_MESSAGE : null}
                    colors={colors}
                  />
                  <PasswordStrengthMeter password={newPassword} colors={colors} />
                </View>

                <TextField
                  label="Confirmar contraseña nueva"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  icon={Lock}
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  error={confirmPassword.length > 0 && confirmPassword !== newPassword ? 'Las contraseñas no coinciden.' : null}
                  colors={colors}
                />

                {error && (
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 10,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: hexToRgba(colors.danger, 0.1),
                    }}
                    accessibilityRole="alert"
                  >
                    <CircleAlert size={18} color={colors.danger} style={{ marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                      <Txt variant="label" colors={colors} style={{ fontWeight: '500' }}>
                        {error}
                      </Txt>
                    </View>
                  </View>
                )}

                <Button
                  label={isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
                  icon={Save}
                  loading={isSubmitting}
                  disabled={!canSubmit && !isSubmitting}
                  onPress={handleSubmit}
                  colors={colors}
                />
              </>
            )}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}
