import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CircleAlert, Lock, LogIn, Mail, Send } from 'lucide-react-native';

import { login, sendEmailVerification } from '@/api/services/auth.services';
import { useSafePush } from '@/hooks/useSafePush';
import { useConfigStore, useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';
import { hexToRgba } from '@/theme/colors';
import { isEmailValid } from '@/utils/validations';

import { AuthHeader } from '../components/AuthHeader';
import { AuthTrustStrip } from '../components/AuthTrustStrip';
import { Button } from '../ui/Button';
import { LinkButton } from '../ui/LinkButton';
import { Surface } from '../ui/Surface';
import { TextField } from '../ui/TextField';
import { Txt } from '../ui/Txt';
import { useReduceMotion } from '../ui/useReduceMotion';

/**
 * Mensaje EXACTO que devuelve el backend cuando el email no está verificado — se matchea por
 * texto porque `axiosRequest` no propaga el status HTTP en el Error que lanza, solo el `message`
 * limpio del backend.
 */
const UNVERIFIED_EMAIL_MESSAGE = 'Correo electrónico no verificado';

/**
 * Inicio de sesión del rediseño. **Misma lógica que antes** (validación mínima: email válido y
 * contraseña no vacía — la fuerza se valida solo en el registro; `signIn` + volver atrás o ir al
 * inicio; reenvío del email de verificación cuando el backend dice que no está verificado).
 *
 * Presentación, pensada para dar confianza y empujar la conversión (patrón "conversión + confianza"
 * recomendado para farmacias):
 *  - **Cabecera de marca** (`AuthHeader`, compartida con el registro), con la descripción de la empresa
 *    si el backend la manda.
 *  - **Tarjeta de formulario** que se superpone a la cabecera, con entrada suave (sin ella si el sistema
 *    pide reducir movimiento).
 *  - **Sello de confianza** (`AuthTrustStrip`).
 *  - **Salidas claras**: "Crear cuenta" como botón (no un enlace de 14 px), "Seguir explorando sin cuenta"
 *    (se puede comprar como invitado hasta el checkout) y "Necesito ayuda para ingresar" que lleva a Ayuda
 *    (la app aún no tiene recuperación de contraseña, así que ahí están los canales de contacto).
 *  - Campos con etiqueta visible, 48 dp, autocompletado, mostrar/ocultar contraseña y Enter envía.
 */
export default function LoginScreen() {
  const router = useRouter();
  const push = useSafePush();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const reduceMotion = useReduceMotion();
  const tagline = useConfigStore((s) => s.appConfig?.tx_company_description);
  const signIn = useUserStore((s) => s.signIn);
  const showToast = useToastStore((s) => s.show);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // El login no re-valida fuerza de contraseña, solo que no esté vacía.
  const canSubmit = isEmailValid(email) && password.length > 0 && !isSubmitting;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const handleLogin = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsUnverified(false);
    setIsSubmitting(true);
    try {
      const { token, ...user } = await login({ email: email.trim(), password });
      await signIn(user, token);
      goBack();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión';
      setError(message);
      setIsUnverified(message === UNVERIFIED_EMAIL_MESSAGE);
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader
          title="Bienvenido de nuevo"
          subtitle={tagline ? `${tagline} Ingresa para continuar con tu compra.` : 'Ingresa para continuar con tu compra.'}
          onBack={goBack}
        />

        {/* Formulario: se superpone a la cabecera */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.duration(350)}
          style={{ paddingHorizontal: 16, marginTop: -32 }}
        >
          <Surface colors={colors} radius={20} padding={20} style={{ gap: 18 }}>
            <TextField
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="tucorreo@ejemplo.com"
              icon={Mail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              colors={colors}
            />

            <TextField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              icon={Lock}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              colors={colors}
            />

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

            {isUnverified && (
              <Button
                label={isResending ? 'Enviando…' : 'Reenviar email de verificación'}
                variant="secondary"
                icon={Send}
                loading={isResending}
                onPress={handleResendVerification}
                colors={colors}
              />
            )}

            <Button
              label={isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
              icon={LogIn}
              height={52}
              loading={isSubmitting}
              disabled={!canSubmit && !isSubmitting}
              onPress={handleLogin}
              colors={colors}
            />
          </Surface>
        </Animated.View>

        <View style={{ marginTop: 24 }}>
          <AuthTrustStrip />
        </View>

        {/* Salidas */}
        <View style={{ paddingHorizontal: 16, marginTop: 28, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Txt variant="caption" color="muted" colors={colors}>
              ¿Primera vez aquí?
            </Txt>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          <Button label="Crear cuenta" variant="ghost" onPress={() => push('/register')} colors={colors} />

          <View style={{ alignItems: 'center' }}>
            <LinkButton label="Seguir explorando sin cuenta" onPress={goBack} colors={colors} />
            <LinkButton label="Necesito ayuda para ingresar" onPress={() => router.replace('/help')} colors={colors} />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

