import { type ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

type AppShellProps = {
  children: ReactNode;
};

/**
 * AppShell minimal. Solo monta un SafeAreaView alrededor de los
 * hijos. Sin modales globales ni handler de 401 (entran en otra
 * fase cuando re-construyamos auth y el sistema de notificaciones).
 */
export function AppShell({ children }: AppShellProps) {
  return <SafeAreaView className="flex-1 bg-background">{children}</SafeAreaView>;
}
