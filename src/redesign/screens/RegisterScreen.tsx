import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Check, CircleAlert, Mail, Send, User, UserPlus } from 'lucide-react-native';

import { register, sendEmailVerification } from '@/api/services/auth.services';
import { useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { hexToRgba, type ThemeColors } from '@/theme/colors';
import {
  DOC_TYPES,
  GENDER_OPTIONS,
  isConfirmPasswordValid,
  isEmailValid,
  isNameValid,
  isPasswordValid,
  isVenezuelanPhoneValid,
  type DocType,
  type GenderValue,
} from '@/utils/validations';

import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { AuthHeader } from '../components/AuthHeader';
import { AuthTrustStrip } from '../components/AuthTrustStrip';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Surface } from '../ui/Surface';
import { TextField } from '../ui/TextField';
import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';
import { useReduceMotion } from '../ui/useReduceMotion';

const AREA_CODES = ['0412', '0414', '0416', '0422', '0424', '0426'];
const DOC_TYPE_LABELS: Record<DocType, string> = {
  V: 'Venezolano',
  E: 'Extranjero',
  P: 'Pasaporte',
  J: 'Jurídico',
  G: 'Gubernamental',
};

const onlyDigits = (text: string) => text.replace(/\D/g, '');

/**
 * Registro del rediseño. Misma lógica y mismo payload que `register.tsx` (validaciones de
 * `utils/validations.ts`, `register(...)` con el teléfono como `XXX-XXXX`, el registro NO
 * autentica: se muestra "Te enviamos un email" y se espera a que el usuario verifique). Cambia
 * la presentación y la ayuda al llenar:
 *
 *  - Formulario en tres bloques ("Tus datos", "Contacto", "Tu contraseña") en vez de una
 *    columna de nueve campos sin pausa.
 *  - Tipo de documento, género y operadora con **chips** visibles (un toque) en lugar de
 *    modales con lista.
 *  - **Errores junto a cada campo** en cuanto lo escrito no es válido (el original solo dejaba el
 *    botón deshabilitado sin decir por qué) y un aviso de qué falta bajo el botón.
 *  - Documento y teléfono aceptan solo dígitos.
 *  - Campos con etiqueta visible, 48 dp, autocompletado y mostrar/ocultar contraseña.
 *  - Corrige un voseo del original ("Repetí tu contraseña" → "Repite tu contraseña").
 */
export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const showToast = useToastStore((s) => s.show);
  const reduceMotion = useReduceMotion();

  const [email, setEmail] = useState('');
  const [documentType, setDocumentType] = useState<DocType>('V');
  const [documentNumber, setDocumentNumber] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<GenderValue>(GENDER_OPTIONS[0].value);
  const [areaCode, setAreaCode] = useState(AREA_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El registro NO autentica: el email todavía no está verificado. En vez de redirigir a /login
  // de una, se muestra "Te enviamos un email" y se espera a que el usuario lo verifique.
  const [isRegistered, setIsRegistered] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const emailOk = isEmailValid(email);
  const docOk = /^\d{6,8}$/.test(documentNumber.trim());
  const nameOk = isNameValid(name);
  const phoneOk = isVenezuelanPhoneValid({ countryCode: '+58', areaCode, phoneNumber });
  const passwordOk = isPasswordValid(password);
  const confirmOk = isConfirmPasswordValid(password, confirmPassword);

  const canSubmit = emailOk && docOk && nameOk && phoneOk && passwordOk && confirmOk && acceptTerms && !isSubmitting;

  // Primer requisito pendiente, para decirlo bajo el botón cuando está deshabilitado.
  const firstMissing = !nameOk
    ? 'Escribe tu nombre completo'
    : !docOk
      ? 'Escribe tu número de documento'
      : !emailOk
        ? 'Escribe un correo válido'
        : !phoneOk
          ? 'Escribe tu teléfono (7 dígitos)'
          : !passwordOk
            ? 'Elige una contraseña que cumpla todos los requisitos'
            : !confirmOk
              ? 'Confirma tu contraseña'
              : !acceptTerms
                ? 'Acepta los términos y condiciones'
                : null;

  const handleRegister = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        document_type: documentType,
        document_id: Number(documentNumber.trim()),
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmPassword,
        id_gender: gender,
        country_code: '+58',
        area_code: areaCode,
        phone_number: `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`,
        terms_of_service: true,
      });
      setIsRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      await sendEmailVerification(email.trim());
      showToast('Te reenviamos el email de verificación');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo reenviar el email');
    } finally {
      setIsResending(false);
    }
  };

  if (isRegistered) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primaryOverlay,
              marginBottom: 20,
            }}
          >
            <Mail size={42} color={colors.primary} strokeWidth={1.6} />
          </View>
          <Txt variant="title" colors={colors} style={{ textAlign: 'center', marginBottom: 8 }}>
            Te enviamos un email
          </Txt>
          <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center', marginBottom: 28 }}>
            Revisa tu bandeja de entrada (y spam) para verificar tu cuenta antes de iniciar sesión.
          </Txt>

          <View style={{ width: '100%', gap: 10 }}>
            <Button
              label={isResending ? 'Enviando…' : 'Reenviar email'}
              variant="secondary"
              icon={Send}
              loading={isResending}
              onPress={handleResendVerification}
              colors={colors}
            />
            <Button
              label="Ya verifiqué, iniciar sesión"
              onPress={() => router.replace('/login')}
              colors={colors}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader
          title="Crea tu cuenta"
          subtitle="Completa tus datos para poder finalizar tus compras."
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
        />

        {/* Formulario: la primera tarjeta se superpone a la cabecera */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.duration(350)}
          style={{ paddingHorizontal: 16, marginTop: -32, gap: 16 }}
        >
        <Section title="Tus datos" colors={colors}>
          <TextField
            label="Nombre completo"
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre y apellido"
            icon={User}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            error={name.length > 0 && !nameOk ? 'Escribe tu nombre completo.' : null}
            colors={colors}
          />

          <View style={{ gap: 8 }}>
            <Txt variant="label" colors={colors}>
              Tipo de documento
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DOC_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={DOC_TYPE_LABELS[type]}
                  selected={documentType === type}
                  onPress={() => setDocumentType(type)}
                  colors={colors}
                />
              ))}
            </View>
          </View>

          <TextField
            label="Número de documento"
            value={documentNumber}
            onChangeText={(text) => setDocumentNumber(onlyDigits(text))}
            placeholder="12345678"
            keyboardType="number-pad"
            maxLength={8}
            error={documentNumber.length > 0 && !docOk ? 'Escribe entre 6 y 8 dígitos, sin puntos.' : null}
            colors={colors}
          />

          <View style={{ gap: 8 }}>
            <Txt variant="label" colors={colors}>
              Género
            </Txt>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {GENDER_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={gender === option.value}
                  onPress={() => setGender(option.value)}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        </Section>

        <Section title="Contacto" colors={colors}>
          <TextField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@ejemplo.com"
            icon={Mail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            error={email.length > 0 && !emailOk ? 'Escribe un correo válido, por ejemplo tucorreo@ejemplo.com.' : null}
            colors={colors}
          />

          <View style={{ gap: 8 }}>
            <Txt variant="label" colors={colors}>
              Teléfono (+58)
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {AREA_CODES.map((code) => (
                <Chip
                  key={code}
                  label={code}
                  selected={areaCode === code}
                  onPress={() => setAreaCode(code)}
                  colors={colors}
                />
              ))}
            </View>
            <TextField
              label="Número"
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(onlyDigits(text))}
              placeholder="1234567"
              keyboardType="number-pad"
              maxLength={7}
              autoComplete="tel-national"
              textContentType="telephoneNumber"
              error={phoneNumber.length > 0 && !phoneOk ? 'Escribe los 7 dígitos del número.' : null}
              colors={colors}
            />
          </View>
        </Section>

        <Section title="Tu contraseña" colors={colors}>
          <TextField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Crea una contraseña segura"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            colors={colors}
          />
          {password.length > 0 && <PasswordStrengthMeter password={password} colors={colors} />}

          <TextField
            label="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repite tu contraseña"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            error={confirmPassword.length > 0 && !confirmOk ? 'Las contraseñas no coinciden.' : null}
            colors={colors}
          />
        </Section>

        <Pressable
          onPress={() => setAcceptTerms((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptTerms }}
          accessibilityLabel="Acepto los términos y condiciones"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: MIN_TOUCH }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: acceptTerms ? colors.primary : colors.muted,
              backgroundColor: acceptTerms ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {acceptTerms && <Check size={16} color={colors.onPrimary} strokeWidth={3} />}
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="label" colors={colors} style={{ fontWeight: '500' }}>
              Acepto los términos y condiciones de uso.
            </Txt>
          </View>
        </Pressable>

        {error && (
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: hexToRgba(colors.danger, 0.1),
            }}
            accessibilityRole="alert"
          >
            <CircleAlert size={18} color={colors.danger} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Txt variant="label" colors={colors} style={{ fontWeight: '500' }}>
                {error}
              </Txt>
            </View>
          </View>
        )}

        <View style={{ gap: 8 }}>
          {!canSubmit && !isSubmitting && firstMissing && (
            <Txt variant="caption" color="muted" colors={colors} style={{ textAlign: 'center' }}>
              {firstMissing}
            </Txt>
          )}
          <Button
            label={isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            icon={UserPlus}
            loading={isSubmitting}
            disabled={!canSubmit && !isSubmitting}
            onPress={handleRegister}
            colors={colors}
          />
        </View>
        </Animated.View>

        <View style={{ marginTop: 28 }}>
          <AuthTrustStrip />
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 28, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Txt variant="caption" color="muted" colors={colors}>
              ¿Ya tienes cuenta?
            </Txt>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>
          <Button label="Iniciar sesión" variant="ghost" onPress={() => router.replace('/login')} colors={colors} />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

function Section({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <Surface colors={colors} radius={20} padding={20} style={{ gap: 16 }}>
      <Txt variant="section" colors={colors}>
        {title}
      </Txt>
      {children}
    </Surface>
  );
}
