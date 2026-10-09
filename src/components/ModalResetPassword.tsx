import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Eye, EyeOff, Save, X } from 'lucide-react-native';

import { resetPassword } from '@/api/services/auth.services';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import {
  getPasswordChangeIssues,
  OLD_PASSWORD_INVALID_MESSAGE,
  SAME_PASSWORD_MESSAGE,
} from '@/utils/passwordChange';
import type { ThemeColors } from '@/theme/colors';

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
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
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

  // `statusBarTranslucent` + `navigationBarTranslucent`: sin ellos, en Android
  // el Modal vive en una ventana aparte y `react-native-keyboard-controller`
  // no recibe los eventos del teclado, así que `KeyboardAwareScrollView` de
  // adentro no desplaza los inputs y el teclado los tapa.
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 16,
            maxHeight: '85%',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: colors.section,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
              Restablecer contraseña
            </Text>
            {!isSubmitting && (
              <Pressable onPress={handleClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cerrar">
                <X size={20} color={colors.muted} />
              </Pressable>
            )}
          </View>

          <KeyboardAwareScrollView
            bottomOffset={24}
            contentContainerStyle={{ padding: 20, gap: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {success ? (
              <Text style={{ fontSize: 14, color: colors.success, fontWeight: '600', textAlign: 'center', paddingVertical: 12 }}>
                Contraseña actualizada correctamente.
              </Text>
            ) : (
              <>
                <PasswordField
                  label="Antigua contraseña"
                  kind="current"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  show={showOld}
                  onToggleShow={() => setShowOld((v) => !v)}
                  error={issues.oldInvalid ? OLD_PASSWORD_INVALID_MESSAGE : undefined}
                  colors={colors}
                />

                <View>
                  <PasswordField
                    label="Contraseña nueva"
                    kind="new"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    show={showNew}
                    onToggleShow={() => setShowNew((v) => !v)}
                    error={issues.sameAsOld ? SAME_PASSWORD_MESSAGE : undefined}
                    colors={colors}
                  />
                  <View style={{ marginTop: 8 }}>
                    <PasswordStrengthMeter password={newPassword} colors={colors} />
                  </View>
                </View>

                <PasswordField
                  label="Confirmar contraseña"
                  kind="new"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  show={showConfirm}
                  onToggleShow={() => setShowConfirm((v) => !v)}
                  colors={colors}
                />

                {error && (
                  <Text style={{ fontSize: 13, color: colors.danger }}>{error}</Text>
                )}

                <Pressable
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: canSubmit ? colors.primary : colors.border,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Guardar"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Save size={18} color={canSubmit ? colors.onPrimary : colors.muted} />
                  )}
                  <Text style={{ fontSize: 15, fontWeight: '700', color: canSubmit ? colors.onPrimary : colors.muted }}>
                    {isSubmitting ? 'Guardando…' : 'Guardar'}
                  </Text>
                </Pressable>
              </>
            )}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PasswordField({
  label,
  kind,
  value,
  onChangeText,
  show,
  onToggleShow,
  error,
  colors,
}: {
  label: string;
  /** `current`: la contraseña actual; `new`: una nueva (para que el gestor ofrezca guardarla). */
  kind: 'current' | 'new';
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  colors: ThemeColors;
}) {
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.section,
          borderRadius: 12,
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          // Gestores de contraseñas: ofrecer rellenar la actual y guardar la nueva.
          autoComplete={kind === 'current' ? 'current-password' : 'new-password'}
          textContentType={kind === 'current' ? 'password' : 'newPassword'}
          importantForAutofill="yes"
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          style={{ flex: 1, fontSize: 15, color: colors.foreground, paddingVertical: 12 }}
        />
        <Pressable
          onPress={onToggleShow}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
        </Pressable>
      </View>
      {error ? <Text style={{ fontSize: 12, color: colors.danger, marginTop: 6 }}>{error}</Text> : null}
    </View>
  );
}
