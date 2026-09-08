import { axiosRequest } from '../axiosRequest';
import type { User } from '@/store/user.store';

/** Tipos de respuesta de la API de auth. */

export type LoginPayload = {
  email: string;
  password: string;
};

/**
 * `data` es PLANO (el user y el token en el mismo nivel), no
 * `{ user, token }` anidado — confirmado en AUTH_WEB_FLOWS.md contra
 * el backend real. `login()` separa `token` del resto al devolverlo.
 */
export type LoginResponse = {
  data: User & { token: string };
  message: string;
  status: string;
};

/**
 * Nombres de campo EXACTOS que espera el backend (snake_case,
 * `id_gender` numérico, `phone_number` con guión) — ver
 * AUTH_WEB_FLOWS.md §2. No son los mismos nombres que usa el form en
 * pantalla (`RegisterScreen` arma este payload al enviar).
 */
export type RegisterPayload = {
  document_type: 'V' | 'E' | 'P' | 'J' | 'G';
  document_id: number;
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  /** 0 = femenino, 1 = masculino. */
  id_gender: 0 | 1;
  country_code: '+58';
  area_code: string;
  /** Formato "XXX-XXXX" — el server lo valida con ese regex exacto. */
  phone_number: string;
  terms_of_service: true;
};

/** El registro NO devuelve user ni token — el email todavía no está verificado. */
export type RegisterResponse = {
  data: null;
  message: string;
  status: string;
};

export type MeResponse = {
  data: User;
};

export type LogoutResponse = {
  message: string;
  status: string;
};

/** El éxito/error se determina por si tira excepción (404/409), no por `data`. */
export type VerifyEmailResponse = {
  data: null;
  message: string;
  status: string;
};

export type ValidateUserPayload = { email: string };
export type ValidateUserResponse = { status: string; message: string; data: null };

export type ValidatePinPayload = { email: string; pin: string };
/**
 * NO devuelve `resetToken` — el flujo real (AUTH_WEB_FLOWS.md §3) no
 * usa un token intermedio: el paso 3 (`restorePassword`) manda
 * `email` + `pin` directo. `validatePin` es solo un chequeo previo
 * (no invalida el PIN, no lo consume) para poder avanzar de pantalla
 * en la UI antes de pedir la contraseña nueva.
 */
export type ValidatePinResponse = { status: string; message: string; data: null };

export type RestorePasswordPayload = {
  email: string;
  pin: string;
  password: string;
  password_confirmation: string;
};
export type RestorePasswordResponse = { status: string; message: string; data: null };

export type ResetPasswordPayload = {
  old_password: string;
  new_password: string;
  new_password_confirmation: string;
};
export type ResetPasswordResponse = { status: string; message: string; data: null };

export type SendEmailVerificationResponse = { status: string; message: string; data: null };

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

/**
 * Público — no requiere token. Se usa tanto para reenviar el email de
 * verificación post-registro como desde el banner de login cuando el
 * server responde "Correo electrónico no verificado" (AUTH_WEB_FLOWS.md
 * §4.1). El endpoint necesita `email` en el body porque en ninguno de
 * los dos casos hay sesión activa todavía.
 */
export async function sendEmailVerification(
  email: string
): Promise<SendEmailVerificationResponse> {
  try {
    return await axiosRequest<SendEmailVerificationResponse>({
      method: 'POST',
      url: '/api/auth/send-email-verification',
      data: { email },
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
