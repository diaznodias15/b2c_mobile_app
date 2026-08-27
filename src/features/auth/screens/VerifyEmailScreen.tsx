import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Button, Text } from 'heroui-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';

import { useAuth } from '../hooks/useAuth';

type Status = 'verifying' | 'success' | 'already' | 'error';

/**
 * Pantalla que maneja el deep link de verificación de correo.
 * Ruta: /cuenta/verificar-correo/:id/:token
 *
 * Cuando el usuario toca el link en su correo, se abre esta pantalla,
 * llama al backend y muestra el resultado.
 */
export default function VerifyEmailScreen() {
  const { id, token } = useLocalSearchParams<{ id?: string; token?: string }>();
  const router = useRouter();
  const { actions } = useAuth();
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !token) {
      setStatus('error');
      setErrorMessage('El enlace de verificación es inválido o está incompleto');
      return;
    }

    let cancelled = false;
    actions
      .verifyEmail(id, token)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.verified) {
          setStatus('success');
        } else {
          // El backend podría indicar "ya verificado" o un error suave.
          setStatus('already');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'No se pudo verificar');
      });

    return () => {
      cancelled = true;
    };
  }, [id, token, actions]);

  return (
    <View className="flex-1 bg-background items-center justify-center px-6 gap-6">
      {status === 'verifying' ? (
        <>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text className="text-base text-foreground text-center">
            Verificando tu correo...
          </Text>
        </>
      ) : null}

      {status === 'success' ? (
        <>
          <CheckCircle2 size={72} color="#16a34a" />
          <View className="items-center gap-2">
            <Text className="text-xl font-semibold text-foreground text-center">
              Correo verificado
            </Text>
            <Text className="text-sm text-muted text-center">
              Ya puedes iniciar sesión con tu cuenta.
            </Text>
          </View>
          <Button
            onPress={() => router.replace('/login' as Href)}
            className="h-12 px-8 rounded-[14px] bg-primary"
          >
            <Text className="text-base font-semibold text-primary-foreground">
              Iniciar sesión
            </Text>
          </Button>
        </>
      ) : null}

      {status === 'already' ? (
        <>
          <CheckCircle2 size={72} color="#0f766e" />
          <View className="items-center gap-2">
            <Text className="text-xl font-semibold text-foreground text-center">
              Tu correo ya estaba verificado
            </Text>
            <Text className="text-sm text-muted text-center">
              Puedes iniciar sesión directamente.
            </Text>
          </View>
          <Button
            onPress={() => router.replace('/login' as Href)}
            className="h-12 px-8 rounded-[14px] bg-primary"
          >
            <Text className="text-base font-semibold text-primary-foreground">
              Iniciar sesión
            </Text>
          </Button>
        </>
      ) : null}

      {status === 'error' ? (
        <>
          <XCircle size={72} color="#dc2626" />
          <View className="items-center gap-2">
            <Text className="text-xl font-semibold text-foreground text-center">
              No pudimos verificar
            </Text>
            <Text className="text-sm text-muted text-center">
              {errorMessage ?? 'El enlace puede haber expirado.'}
            </Text>
          </View>
          <View className="flex-row gap-3">
            <Button
              onPress={() => router.replace('/login' as Href)}
              className="h-12 px-6 rounded-[14px] bg-surface border border-border"
            >
              <Text className="text-base font-medium text-foreground">
                Volver
              </Text>
            </Button>
            <Button
              onPress={() => router.replace('/registrarse' as Href)}
              className="h-12 px-6 rounded-[14px] bg-primary"
            >
              <Text className="text-base font-semibold text-primary-foreground">
                Registrarme
              </Text>
            </Button>
          </View>
        </>
      ) : null}
    </View>
  );
}
