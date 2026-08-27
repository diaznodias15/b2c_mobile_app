import { useEffect } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Button, Text } from 'heroui-native';

import { useUIStore } from '@/store';
import { useAuth } from '../hooks/useAuth';
import { useRouter, type Href } from 'expo-router';

/**
 * Modales globales controlados por useUIStore.activeModal:
 *  - logout: confirma cierre de sesión
 *  - sessionExpired: avisa que la sesión expiró y manda al login
 *  - emailUnverified: reenvía correo de verificación
 *
 * Se monta una sola vez en el root layout.
 */
export function GlobalModals() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const { actions, isSubmitting } = useAuth();
  const router = useRouter();

  // sessionExpired: al cerrarse, navegar al login
  useEffect(() => {
    if (activeModal === 'sessionExpired') {
      // Solo navegamos cuando se cierre el modal
    }
  }, [activeModal]);

  const handleSessionExpiredDismiss = () => {
    closeModal();
    router.replace('/login' as Href);
  };

  return (
    <>
      {/* Modal: Logout */}
      <Modal
        visible={activeModal === 'logout'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-[20px] bg-surface p-6 gap-4">
            <Text className="text-lg font-semibold text-foreground">
              ¿Cerrar sesión?
            </Text>
            <Text className="text-sm text-muted">
              Tendrás que volver a ingresar para usar la app.
            </Text>
            <View className="flex-row justify-end gap-2 mt-2">
              <Pressable
                onPress={closeModal}
                className="h-10 px-4 items-center justify-center rounded-[14px] bg-section"
                disabled={isSubmitting}
              >
                <Text className="text-sm font-medium text-foreground">
                  Cancelar
                </Text>
              </Pressable>
              <Button
                onPress={async () => {
                  await actions.signOut();
                  closeModal();
                  router.replace('/login' as Href);
                }}
                isDisabled={isSubmitting}
                className="h-10 px-4 rounded-[14px] bg-danger"
              >
                <Text className="text-sm font-medium text-primary-foreground">
                  {isSubmitting ? 'Cerrando...' : 'Cerrar sesión'}
                </Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Session Expired (401) */}
      <Modal
        visible={activeModal === 'sessionExpired'}
        transparent
        animationType="fade"
        onRequestClose={handleSessionExpiredDismiss}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-[20px] bg-surface p-6 gap-4">
            <Text className="text-lg font-semibold text-foreground">
              Tu sesión expiró
            </Text>
            <Text className="text-sm text-muted">
              Vuelve a iniciar sesión para continuar.
            </Text>
            <View className="flex-row justify-end mt-2">
              <Button
                onPress={handleSessionExpiredDismiss}
                className="h-10 px-4 rounded-[14px] bg-primary"
              >
                <Text className="text-sm font-medium text-primary-foreground">
                  Iniciar sesión
                </Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Email Unverified (al fallar login con 403) */}
      <Modal
        visible={activeModal === 'emailUnverified'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full max-w-sm rounded-[20px] bg-surface p-6 gap-4">
            <Text className="text-lg font-semibold text-foreground">
              Verifica tu correo
            </Text>
            <Text className="text-sm text-muted">
              Para continuar necesitas verificar tu correo. Te enviaremos
              un enlace de confirmación.
            </Text>
            <View className="flex-row justify-end gap-2 mt-2">
              <Pressable
                onPress={closeModal}
                className="h-10 px-4 items-center justify-center rounded-[14px] bg-section"
                disabled={isSubmitting}
              >
                <Text className="text-sm font-medium text-foreground">
                  Más tarde
                </Text>
              </Pressable>
              <Button
                onPress={async () => {
                  try {
                    await actions.sendVerification();
                  } catch {
                    // El toast se encarga
                  } finally {
                    closeModal();
                  }
                }}
                isDisabled={isSubmitting}
                className="h-10 px-4 rounded-[14px] bg-primary"
              >
                <Text className="text-sm font-medium text-primary-foreground">
                  {isSubmitting ? 'Enviando...' : 'Reenviar'}
                </Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
