import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, type Href } from 'expo-router';
import { Button, Text } from 'heroui-native';

import { BrandPanel } from '../components/BrandPanel';
import { TextField } from '../components/TextField';
import { PasswordField } from '../components/PasswordField';
import { PhoneField } from '../components/PhoneField';
import { PasswordStrength } from '../components/PasswordStrength';
import { useAuth } from '../hooks/useAuth';
import { signUpSchema, type SignUpFormValues } from '../schemas';
import { DOC_TYPES, GENDERS } from '@/utils/validations';

const DOC_LABELS: Record<(typeof DOC_TYPES)[number], string> = {
  V: 'Venezolano',
  E: 'Extranjero',
  P: 'Pasaporte',
};

const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  M: 'Masculino',
  F: 'Femenino',
  OTRO: 'Otro',
};

function ChipGroup<T extends string>({
  options,
  labels,
  value,
  onChange,
  error,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T | '';
  onChange: (v: T) => void;
  error?: string;
}) {
  return (
    <View className="gap-1.5">
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              className={`px-3 h-9 items-center justify-center rounded-full border ${
                active
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-border'
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                className={`text-sm ${
                  active ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {labels[opt]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="text-xs text-danger">{error}</Text> : null}
    </View>
  );
}

export default function SignUpScreen() {
  const router = useRouter();
  const { actions, isSubmitting } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  const { control, handleSubmit, watch, setValue } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      documentType: 'V',
      documentNumber: '',
      name: '',
      gender: 'M',
      countryCode: '+58',
      areaCode: '0412',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      // Zod exige literal true; lo seteamos desde el checkbox handler.
      acceptTerms: false as unknown as true,
    },
    mode: 'onBlur',
  });

  const areaCode = watch('areaCode');

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await actions.register({
        email: values.email,
        documentType: values.documentType,
        documentNumber: values.documentNumber,
        name: values.name,
        gender: values.gender,
        countryCode: values.countryCode,
        areaCode: values.areaCode,
        phoneNumber: values.phoneNumber,
        password: values.password,
        acceptTerms: values.acceptTerms,
      });
      router.replace('/verificar-correo' as Href);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo crear la cuenta');
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6">
          <BrandPanel
            title="Crea tu cuenta"
            subtitle="Completa tus datos para empezar"
          />

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
                  required
                  error={fieldState.error?.message}
                />
              )}
            />

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-medium text-foreground">
                  Tipo de documento
                </Text>
                <Text className="text-sm text-danger">*</Text>
              </View>
              <Controller
                control={control}
                name="documentType"
                render={({ field, fieldState }) => (
                  <ChipGroup
                    options={DOC_TYPES}
                    labels={DOC_LABELS}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </View>

            <Controller
              control={control}
              name="documentNumber"
              render={({ field, fieldState }) => (
                <TextField
                  label="Número de documento"
                  value={field.value}
                  onChangeText={(t) => field.onChange(t.replace(/\D/g, '').slice(0, 12))}
                  onBlur={field.onBlur}
                  placeholder="12345678"
                  keyboardType="number-pad"
                  required
                  maxLength={12}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  label="Nombre completo"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="María Pérez"
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  required
                  error={fieldState.error?.message}
                />
              )}
            />

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-medium text-foreground">
                  Género
                </Text>
                <Text className="text-sm text-danger">*</Text>
              </View>
              <Controller
                control={control}
                name="gender"
                render={({ field, fieldState }) => (
                  <ChipGroup
                    options={GENDERS}
                    labels={GENDER_LABELS}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </View>

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field, fieldState }) => (
                <PhoneField
                  areaCode={areaCode}
                  phoneNumber={field.value}
                  onAreaCodeChange={(v) =>
                    setValue('areaCode', v as SignUpFormValues['areaCode'], {
                      shouldValidate: true,
                    })
                  }
                  onPhoneNumberChange={field.onChange}
                  phoneNumberError={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <View className="gap-1.5">
                  <PasswordField
                    label="Contraseña"
                    value={field.value}
                    onChangeText={(t) => {
                      field.onChange(t);
                      setPassword(t);
                    }}
                    onBlur={field.onBlur}
                    placeholder="••••••••"
                    autoComplete="password"
                    textContentType="password"
                    required
                    error={fieldState.error?.message}
                  />
                  <PasswordStrength password={password} />
                </View>
              )}
            />

            <Controller
              control={control}
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

            <Controller
              control={control}
              name="acceptTerms"
              render={({ field, fieldState }) => (
                <View className="gap-1">
                  <View className="flex-row items-start gap-2">
                    <Pressable
                      onPress={() => field.onChange(!field.value)}
                      hitSlop={8}
                      className="mt-0.5"
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: field.value }}
                    >
                      <View
                        className={`w-5 h-5 rounded border items-center justify-center ${
                          field.value
                            ? 'bg-primary border-primary'
                            : 'bg-surface border-border'
                        }`}
                      >
                        {field.value ? (
                          <Text className="text-primary-foreground text-xs">
                            ✓
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                    <View className="flex-1 flex-row flex-wrap">
                      <Text className="text-sm text-foreground">
                        Acepto los{' '}
                      </Text>
                      <Pressable
                        onPress={() => router.push('/terminos-y-condiciones' as Href)}
                      >
                        <Text className="text-sm text-primary">
                          términos y condiciones
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  {fieldState.error ? (
                    <Text className="text-xs text-danger">
                      {fieldState.error.message}
                    </Text>
                  ) : null}
                </View>
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
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              </Text>
            </Button>

            <View className="items-center mt-2">
              <View className="flex-row items-center gap-1">
                <Text className="text-sm text-muted">¿Ya tienes cuenta?</Text>
                <Pressable
                  onPress={() => router.push('/login' as Href)}
                  hitSlop={8}
                >
                  <Text className="text-sm font-medium text-primary">
                    Ingresar
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
