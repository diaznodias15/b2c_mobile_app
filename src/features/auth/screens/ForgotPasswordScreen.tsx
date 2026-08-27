import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, type Href } from 'expo-router';
import { Button, Text } from 'heroui-native';
import { CheckCircle2 } from 'lucide-react-native';

import { BrandPanel } from '../components/BrandPanel';
import { TextField } from '../components/TextField';
import { PasswordField } from '../components/PasswordField';
import { PasswordStrength } from '../components/PasswordStrength';
import {
  resetEmailSchema,
  resetPinSchema,
  resetNewPasswordSchema,
  type ResetEmailFormValues,
  type ResetPinFormValues,
  type ResetNewPasswordFormValues,
} from '../schemas';
import {
  validateUser,
  validatePin,
  restorePassword,
} from '@/api/services/auth.services';

type Step = 'email' | 'pin' | 'password' | 'done';

type ResetState = {
  email: string;
  resetToken: string;
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [state, setState] = useState<ResetState>({ email: '', resetToken: '' });
  const [password, setPassword] = useState('');

  // Paso 1: email
  const emailForm = useForm<ResetEmailFormValues>({
    resolver: zodResolver(resetEmailSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });
  const onSubmitEmail = emailForm.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await validateUser({ email: values.email });
      setState((s) => ({ ...s, email: values.email }));
      setStep('pin');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo enviar el PIN');
    }
  });

  // Paso 2: PIN
  const pinForm = useForm<ResetPinFormValues>({
    resolver: zodResolver(resetPinSchema),
    defaultValues: { pin: '' },
    mode: 'onSubmit',
  });
  const onSubmitPin = pinForm.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const res = await validatePin({ email: state.email, pin: values.pin });
      setState((s) => ({ ...s, resetToken: res.data.resetToken }));
      setStep('password');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'PIN inválido');
    }
  });

  // Paso 3: nueva contraseña
  const passwordForm = useForm<ResetNewPasswordFormValues>({
    resolver: zodResolver(resetNewPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onBlur',
  });
  const onSubmitPassword = passwordForm.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await restorePassword({
        email: state.email,
        resetToken: state.resetToken,
        newPassword: values.newPassword,
      });
      setStep('done');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo restablecer');
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
          {/* Indicador de pasos */}
          <View className="flex-row items-center justify-center gap-2 pt-4 pb-2">
            {(['email', 'pin', 'password'] as const).map((s, i) => {
              const active = step === s || (step === 'done' && s === 'password');
              const passed = ['email', 'pin', 'password'].indexOf(step) > i;
              return (
                <View
                  key={s}
                  className={`h-1.5 flex-1 rounded-full ${
                    active || passed ? 'bg-primary' : 'bg-border'
                  }`}
                />
              );
            })}
          </View>

          {step === 'email' ? (
            <>
              <BrandPanel
                title="Recuperar contraseña"
                subtitle="Te enviaremos un PIN a tu correo"
              />
              <View className="gap-4 mt-4">
                <Controller
                  control={emailForm.control}
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
                      autoCapitalize="none"
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />
                {submitError ? (
                  <View className="rounded-[14px] bg-danger/10 px-4 py-3">
                    <Text className="text-sm text-danger">{submitError}</Text>
                  </View>
                ) : null}
                <Button
                  onPress={onSubmitEmail}
                  isDisabled={emailForm.formState.isSubmitting}
                  className="h-12 rounded-[14px] bg-primary mt-2"
                >
                  <Text className="text-base font-semibold text-primary-foreground">
                    {emailForm.formState.isSubmitting
                      ? 'Enviando...'
                      : 'Enviar PIN'}
                  </Text>
                </Button>
                <View className="items-center mt-2">
                  <Text
                    onPress={() => router.replace('/login' as Href)}
                    className="text-sm text-primary"
                  >
                    Volver a iniciar sesión
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {step === 'pin' ? (
            <>
              <BrandPanel
                title="Ingresa el PIN"
                subtitle={`Enviamos un código de 6 dígitos a ${state.email}`}
              />
              <View className="gap-4 mt-4">
                <Controller
                  control={pinForm.control}
                  name="pin"
                  render={({ field, fieldState }) => (
                    <TextField
                      label="PIN de 6 dígitos"
                      value={field.value}
                      onChangeText={(t) =>
                        field.onChange(t.replace(/\D/g, '').slice(0, 6))
                      }
                      onBlur={field.onBlur}
                      placeholder="000000"
                      keyboardType="number-pad"
                      required
                      maxLength={6}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                {submitError ? (
                  <View className="rounded-[14px] bg-danger/10 px-4 py-3">
                    <Text className="text-sm text-danger">{submitError}</Text>
                  </View>
                ) : null}
                <Button
                  onPress={onSubmitPin}
                  isDisabled={pinForm.formState.isSubmitting}
                  className="h-12 rounded-[14px] bg-primary mt-2"
                >
                  <Text className="text-base font-semibold text-primary-foreground">
                    {pinForm.formState.isSubmitting ? 'Validando...' : 'Continuar'}
                  </Text>
                </Button>
                <View className="items-center mt-2">
                  <Text
                    onPress={() => setStep('email')}
                    className="text-sm text-primary"
                  >
                    Reenviar PIN
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {step === 'password' ? (
            <>
              <BrandPanel
                title="Nueva contraseña"
                subtitle="Crea una contraseña segura"
              />
              <View className="gap-4 mt-4">
                <Controller
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field, fieldState }) => (
                    <View className="gap-1.5">
                      <PasswordField
                        label="Nueva contraseña"
                        value={field.value}
                        onChangeText={(t) => {
                          field.onChange(t);
                          setPassword(t);
                        }}
                        onBlur={field.onBlur}
                        placeholder="••••••••"
                        required
                        error={fieldState.error?.message}
                      />
                      <PasswordStrength password={password} />
                    </View>
                  )}
                />
                <Controller
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field, fieldState }) => (
                    <PasswordField
                      label="Confirmar contraseña"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="••••••••"
                      required
                      error={fieldState.error?.message}
                    />
                  )}
                />
                {submitError ? (
                  <View className="rounded-[14px] bg-danger/10 px-4 py-3">
                    <Text className="text-sm text-danger">{submitError}</Text>
                  </View>
                ) : null}
                <Button
                  onPress={onSubmitPassword}
                  isDisabled={passwordForm.formState.isSubmitting}
                  className="h-12 rounded-[14px] bg-primary mt-2"
                >
                  <Text className="text-base font-semibold text-primary-foreground">
                    {passwordForm.formState.isSubmitting
                      ? 'Guardando...'
                      : 'Restablecer'}
                  </Text>
                </Button>
              </View>
            </>
          ) : null}

          {step === 'done' ? (
            <View className="flex-1 items-center justify-center gap-4">
              <CheckCircle2 size={72} color="#16a34a" />
              <View className="items-center gap-2">
                <Text className="text-xl font-semibold text-foreground text-center">
                  Contraseña restablecida
                </Text>
                <Text className="text-sm text-muted text-center">
                  Ya puedes iniciar sesión con tu nueva contraseña.
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
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
