import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, type Href } from 'expo-router';
import { Button, Text } from 'heroui-native';

import { BrandPanel } from '../components/BrandPanel';
import { TextField } from '../components/TextField';
import { PasswordField } from '../components/PasswordField';
import { useAuth } from '../hooks/useAuth';
import { useConfigStore } from '@/store';
import { loginSchema, type LoginFormValues } from '../schemas';

export default function LoginScreen() {
  const router = useRouter();
  const { actions, isSubmitting } = useAuth();
  const appConfig = useConfigStore((s) => s.appConfig);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await actions.signIn({ email: values.email, password: values.password });
      router.replace('/');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pb-8">
          <BrandPanel title="Hola de nuevo" subtitle="Ingresa para continuar" />

          <View className="gap-4 mt-4">
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <TextField
                  label="Correo"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="usuario@correo.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  autoCapitalize="none"
                  returnKeyType="next"
                  required
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <PasswordField
                  label="Contraseña"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="••••••••"
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  required
                  error={fieldState.error?.message}
                  onSubmitEditing={onSubmit}
                />
              )}
            />

            {submitError ? (
              <View className="rounded-[14px] bg-danger/10 px-4 py-3">
                <Text className="text-sm text-danger">{submitError}</Text>
              </View>
            ) : null}

            <Button
              onPress={onSubmit}
              isDisabled={isSubmitting}
              className={`h-12 rounded-[14px] mt-2 ${
                isSubmitting ? 'bg-primary/50' : 'bg-primary'
              }`}
            >
              <Text className="text-base font-semibold text-primary-foreground">
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Text>
            </Button>

            <View className="items-center gap-3 mt-2">
              <Pressable
                onPress={() => router.push('/recuperar-contrasena' as Href)}
                hitSlop={8}
              >
                <Text className="text-sm text-primary">
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>
              <View className="flex-row items-center gap-1">
                <Text className="text-sm text-muted">¿No tienes cuenta?</Text>
                <Pressable
                  onPress={() => router.push('/registrarse' as Href)}
                  hitSlop={8}
                >
                  <Text className="text-sm font-medium text-primary">
                    Crear cuenta
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="flex-1" />

          {appConfig?.tx_company_rif ? (
            <View className="items-center mt-8">
              <Text className="text-xs text-muted">
                RIF: {appConfig.tx_company_rif}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
