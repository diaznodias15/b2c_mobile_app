import { useEffect, type ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from 'heroui-native';

import { onUnauthorized } from '@/api/axiosRequest';
import { useUserStore, useUIStore } from '@/store';
import { GlobalModals } from '@/features/auth/components/GlobalModals';

type AppShellProps = {
  children: ReactNode;
};

/**
 * Componente shell que monta los providers cross-cutting:
 *  - modales globales (logout, session expired, email unverified)
 *  - handler de 401 (via onUnauthorized)
 *  - sincronización del toast del store con el Toaster de HeroUI
 *
 * Vive dentro del Stack del root layout.
 */
export function AppShell({ children }: AppShellProps) {
  const signOut = useUserStore((s) => s.signOut);
  const showSessionExpired = useUIStore((s) => s.showSessionExpired);
  const toast = useUIStore((s) => s.toast);
  const clearToast = useUIStore((s) => s.clearToast);
  const { toast: toastManager } = useToast();

  // Suscribirse a 401 de axiosRequest.
  useEffect(() => {
    return onUnauthorized(() => {
      signOut().catch(() => {});
      showSessionExpired();
    });
  }, [signOut, showSessionExpired]);

  // Reflejar el toast del store en el Toaster de HeroUI.
  useEffect(() => {
    if (!toast) return;
    const variant =
      toast.type === 'success'
        ? 'success'
        : toast.type === 'error'
          ? 'danger'
          : 'default';
    const label = toast.title
      ? `${toast.title}${toast.message ? ` — ${toast.message}` : ''}`
      : toast.message;
    toastManager.show({
      variant,
      label,
    });
    // Limpiamos el toast del store después de encolarlo.
    const t = setTimeout(clearToast, 100);
    return () => clearTimeout(t);
  }, [toast, clearToast, toastManager]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {children}
      <GlobalModals />
    </SafeAreaView>
  );
}
