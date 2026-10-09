import { isConfirmPasswordValid, isPasswordValid } from '@/utils/validations';

/**
 * Validación del formulario "Cambiar contraseña" (`ModalResetPassword`).
 *
 * El backend (`ResetPasswordStore`) exige que la contraseña ANTIGUA también
 * cumpla la política de complejidad (8–40 caracteres con mayúscula, minúscula,
 * número y símbolo): si no, responde 400 con un mensaje de regex. Validarlo en
 * el cliente da el aviso antes de enviar, en vez de recién tras la petición.
 */
export const OLD_PASSWORD_INVALID_MESSAGE =
  'La contraseña antigua debe tener entre 8 y 40 caracteres, con mayúscula, minúscula, número y símbolo.';
export const SAME_PASSWORD_MESSAGE = 'La contraseña nueva debe ser distinta de la antigua.';

export type PasswordChangeIssues = {
  /** La antigua ya tiene texto pero no cumple la política (el backend la rechazaría). */
  oldInvalid: boolean;
  /** La nueva es idéntica a la antigua. */
  sameAsOld: boolean;
  /** La nueva cumple todos los requisitos. */
  newValid: boolean;
  /** La confirmación coincide con la nueva. */
  confirmMatches: boolean;
  /** Se puede enviar. */
  canChange: boolean;
};

export function getPasswordChangeIssues(input: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): PasswordChangeIssues {
  const { oldPassword, newPassword, confirmPassword } = input;
  const oldInvalid = oldPassword.length > 0 && !isPasswordValid(oldPassword);
  const sameAsOld = oldPassword.length > 0 && newPassword.length > 0 && oldPassword === newPassword;
  const newValid = isPasswordValid(newPassword);
  const confirmMatches = isConfirmPasswordValid(newPassword, confirmPassword);
  return {
    oldInvalid,
    sameAsOld,
    newValid,
    confirmMatches,
    canChange: oldPassword.length > 0 && !oldInvalid && !sameAsOld && newValid && confirmMatches,
  };
}
