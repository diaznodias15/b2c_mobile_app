import { useCallback, useState } from 'react';
import { useUserStore } from '@/store/user.store';
import { useUIStore } from '@/store/ui.store';
import {
  login as loginRequest,
  logout as logoutRequest,
  me as meRequest,
  register as registerRequest,
  verifyEmail as verifyEmailRequest,
  sendEmailVerification as sendEmailVerificationRequest,
  validateUser as validateUserRequest,
  validatePin as validatePinRequest,
  restorePassword as restorePasswordRequest,
  resetPassword as resetPasswordRequest,
  type RegisterPayload,
  type LoginPayload,
} from '@/api/services/auth.services';

/**
 * Hook central de auth.
 * Encapsula la interacción entre el user store, la UI y los servicios.
 * Toda pantalla de auth consume este hook (no llama a los services directo).
 */
export function useAuth() {
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const signIn = useUserStore((s) => s.signIn);
  const signOut = useUserStore((s) => s.signOut);
  const setUser = useUserStore((s) => s.setUser);
  const setLoading = useUserStore((s) => s.setLoading);
  const showToast = useUIStore((s) => s.showToast);
  const openModal = useUIStore((s) => s.openModal);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = useCallback(
    async (payload: LoginPayload) => {
      setIsSubmitting(true);
      setLoading(true);
      try {
        const { user: userData, token } = await loginRequest(payload);
        await signIn(userData, token);
        showToast('Bienvenido', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        showToast(message, 'error');
        throw err;
      } finally {
        setIsSubmitting(false);
        setLoading(false);
      }
    },
    [signIn, showToast, setLoading]
  );

  const handleSignOut = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await logoutRequest();
    } finally {
      await signOut();
      setIsSubmitting(false);
      showToast('Sesión cerrada', 'info');
    }
  }, [signOut, showToast]);

  const handleRegister = useCallback(
    async (payload: RegisterPayload) => {
      setIsSubmitting(true);
      try {
        await registerRequest(payload);
        showToast('Revisa tu correo para verificar la cuenta', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        showToast(message, 'error');
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [showToast]
  );

  const handleVerifyEmail = useCallback(
    async (id: string, token: string) => {
      setIsSubmitting(true);
      try {
        const res = await verifyEmailRequest(id, token);
        if (res.data?.verified) {
          showToast('Correo verificado correctamente', 'success');
        }
        return res;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        showToast(message, 'error');
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [showToast]
  );

  const handleSendVerification = useCallback(async () => {
    try {
      await sendEmailVerificationRequest();
      showToast('Correo de verificación enviado', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      showToast(message, 'error');
      throw err;
    }
  }, [showToast]);

  const handleResetFlow = {
    validateUser: validateUserRequest,
    validatePin: validatePinRequest,
    restorePassword: restorePasswordRequest,
  };

  const handleChangePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setIsSubmitting(true);
      try {
        await resetPasswordRequest({ currentPassword, newPassword });
        showToast('Contraseña actualizada', 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        showToast(message, 'error');
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [showToast]
  );

  const handleRefreshProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const fresh = await meRequest();
      setUser(fresh);
    } catch (err) {
      // El 401 ya lo maneja axiosRequest; aquí solo logueamos.
      console.warn('[useAuth] refresh profile failed:', err);
    }
  }, [isAuthenticated, setUser]);

  return {
    user,
    isAuthenticated,
    isSubmitting,
    actions: {
      signIn: handleSignIn,
      signOut: handleSignOut,
      register: handleRegister,
      verifyEmail: handleVerifyEmail,
      sendVerification: handleSendVerification,
      resetFlow: handleResetFlow,
      changePassword: handleChangePassword,
      refreshProfile: handleRefreshProfile,
    },
    ui: {
      openModal,
    },
  };
}
