import { axiosRequest } from '../axiosRequest';
import type { User } from '@/store/user.store';

/** Tipos de respuesta de la API de auth. */

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  data: {
    user: User;
    token: string;
  };
  message: string;
  status: number;
};

export type RegisterPayload = {
  email: string;
  documentType: 'V' | 'E' | 'P';
  documentNumber: string;
  name: string;
  gender: 'M' | 'F' | 'OTRO';
  countryCode: string; // +58
  areaCode: string; // 0412 etc.
  phoneNumber: string; // 7 dígitos
  password: string;
  acceptTerms: boolean;
};

export type RegisterResponse = {
  data: { user: User };
  message: string;
  status: number;
};

export type MeResponse = {
  data: User;
};

export type LogoutResponse = {
  message: string;
  status: number;
};

export type VerifyEmailResponse = {
  data: { verified: boolean };
  message: string;
  status: number;
};

export type ValidateUserPayload = { email: string };
export type ValidateUserResponse = { message: string; status: number };

export type ValidatePinPayload = { email: string; pin: string };
export type ValidatePinResponse = {
  data: { resetToken: string };
  message: string;
  status: number;
};

export type RestorePasswordPayload = {
  email: string;
  resetToken: string;
  newPassword: string;
};
export type RestorePasswordResponse = { message: string; status: number };

export type ResetPasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
export type ResetPasswordResponse = { message: string; status: number };

export type SendEmailVerificationResponse = { message: string; status: number };

/* ============================================================
 * Servicios — cada uno consume axiosRequest, sin axios directo.
 * Manejan errors con mensajes limpios para la UI.
 * ============================================================ */

function cleanError(err: unknown, fallback: string): Error {
  if (err instanceof Error) {
    // Extraer mensaje del backend si existe.
    const match = err.message.match(/"message"\s*:\s*"([^"]+)"/);
    if (match) return new Error(match[1]);
    return err;
  }
  return new Error(fallback);
}

export async function login(payload: LoginPayload): Promise<LoginResponse['data']> {
  try {
    return await axiosRequest<LoginResponse['data']>({
      method: 'POST',
      url: '/api/auth/login',
      data: payload,
      dedup: false,
    });
  } catch (err) {
    throw cleanError(err, 'No se pudo iniciar sesión');
  }
}

export async function logout(): Promise<void> {
  try {
    await axiosRequest<LogoutResponse>({
      method: 'POST',
      url: '/api/auth/logout',
      dedup: false,
    });
  } catch (err) {
    // El logout local es lo importante; los errores del servidor se ignoran.
    console.warn('[auth] logout server error:', err);
  }
}

export async function me(): Promise<User> {
  try {
    const res = await axiosRequest<MeResponse>({ method: 'GET', url: '/api/auth/me' });
    return res.data;
  } catch (err) {
    throw cleanError(err, 'No se pudo obtener el usuario');
  }
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse['data']> {
  try {
    return await axiosRequest<RegisterResponse['data']>({
      method: 'POST',
      url: '/api/users/register',
      data: payload,
      dedup: false,
    });
  } catch (err) {
    throw cleanError(err, 'No se pudo crear la cuenta');
  }
}

export async function verifyEmail(id: string, token: string): Promise<VerifyEmailResponse> {
  try {
    return await axiosRequest<VerifyEmailResponse>({
      method: 'GET',
      url: `/api/auth/account/verify/${id}/${token}`,
      dedup: false,
    });
  } catch (err) {
    throw cleanError(err, 'No se pudo verificar el correo');
  }
}

export async function sendEmailVerification(): Promise<SendEmailVerificationResponse> {
  try {
    return await axiosRequest<SendEmailVerificationResponse>({
      method: 'POST',
      url: '/api/auth/send-email-verification',
      dedup: false,
    });
  } catch (err) {
    throw cleanError(err, 'No se pudo enviar el correo de verificación');
  }
}

export async function validateUser(
  payload: ValidateUserPayload
): Promise<ValidateUserResponse> {
  try {
    return await axiosRequest<ValidateUserResponse>({
      method: 'POST',
      url: '/api/auth/validate-user',
      data: payload,
      dedup: false,
    });
  } catch (err) {
    throw cleanError(err, 'No se pudo validar el usuario');
  }
}

export async function validatePin(
  payload: ValidatePinPayload
): Promise<ValidatePinResponse> {
  try {
    return await axiosRequest<ValidatePinResponse>({
      method: 'POST',
      url: '/api/auth/validate-pin',
      data: payload,
      dedup: false,
    });
  } catch (err) {
    throw cleanError(err, 'PIN inválido o expirado');
  }
}

export async function restorePassword(
  payload: RestorePasswordPayload
): Promise<RestorePasswordResponse> {
  try {
    return await axiosRequest<RestorePasswordResponse>({
      method: 'POST',
      url: '/api/auth/restore-password',
      data: payload,
      dedup: false,
    });
  } catch (err) {
    throw cleanError(err, 'No se pudo restablecer la contraseña');
  }
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  try {
    return axiosRequest<ResetPasswordResponse>({
      method: 'POST',
      url: '/api/auth/reset-password',
      data: payload,
      dedup: false,
    });
  } catch (err) {
    throw cleanError(err, 'No se pudo cambiar la contraseña');
  }
}
