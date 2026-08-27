import { z } from 'zod';
import {
  isEmailValid,
  isNameValid,
  isPasswordValid,
  isVenezuelanPhoneValid,
  DOC_TYPES,
  GENDERS,
} from '@/utils/validations';

/* ============================================================
 * Login
 * ============================================================ */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .refine(isEmailValid, 'Correo inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  remember: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/* ============================================================
 * SignUp
 * ============================================================ */

const VE_OPERATORAS = ['0412', '0414', '0416', '0422', '0424', '0426'] as const;

export const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El correo es obligatorio')
      .refine(isEmailValid, 'Correo inválido'),
    documentType: z.enum(DOC_TYPES, {
      message: 'Selecciona un tipo de documento',
    }),
    documentNumber: z
      .string()
      .min(6, 'Número de documento inválido')
      .max(12, 'Número de documento inválido')
      .regex(/^\d+$/, 'Solo dígitos'),
    name: z.string().refine(isNameValid, 'Nombre demasiado corto'),
    gender: z.enum(GENDERS, { message: 'Selecciona un género' }),
    countryCode: z.literal('+58'),
    areaCode: z.enum(VE_OPERATORAS, {
      message: 'Operadora inválida',
    }),
    phoneNumber: z
      .string()
      .regex(/^\d{7}$/, '7 dígitos requeridos'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .refine((v) => isPasswordValid(v, true), 'Debe incluir mayúscula y número'),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      message: 'Debes aceptar los términos y condiciones',
    }),
  })
  .refine((data) => isVenezuelanPhoneValid(data), {
    message: 'Teléfono inválido',
    path: ['phoneNumber'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

/* ============================================================
 * Reset password (3 pasos)
 * ============================================================ */

// Paso 1: email
export const resetEmailSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').refine(isEmailValid, 'Correo inválido'),
});
export type ResetEmailFormValues = z.infer<typeof resetEmailSchema>;

// Paso 2: PIN (6 dígitos numéricos)
export const resetPinSchema = z.object({
  pin: z
    .string()
    .length(6, 'El PIN tiene 6 dígitos')
    .regex(/^\d{6}$/, 'Solo dígitos'),
});
export type ResetPinFormValues = z.infer<typeof resetPinSchema>;

// Paso 3: nueva contraseña
export const resetNewPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .refine((v) => isPasswordValid(v, true), 'Debe incluir mayúscula y número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
export type ResetNewPasswordFormValues = z.infer<typeof resetNewPasswordSchema>;

/* ============================================================
 * Cambiar contraseña (logueado)
 * ============================================================ */

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .refine((v) => isPasswordValid(v, true), 'Debe incluir mayúscula y número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'La nueva contraseña debe ser diferente',
    path: ['newPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
