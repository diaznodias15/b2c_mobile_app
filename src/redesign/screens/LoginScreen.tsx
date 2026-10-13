import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CircleAlert, LogIn, Mail, Lock, Send } from 'lucide-react-native';

import { login, sendEmailVerification } from '@/api/services/auth.services';
import { useSafePush } from '@/hooks/useSafePush';
import { useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';
import { hexToRgba, isLightColor } from '@/theme/colors';
import { LOGO_DARK as LOGO_DARK_URI, LOGO_LIGHT as LOGO_LIGHT_URI } from '@/utils/localImages.generated';
import { isEmailValid } from '@/utils/validations';

import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { TextField } from '../ui/TextField';
import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';

const LOGO_LIGHT = { uri: LOGO_LIGHT_URI };
const LOGO_DARK = { uri: LOGO_DARK_URI };

/**
 * Mensaje EXACTO que devuelve el backend cuando el email no está verificado — se matchea por
 * texto porque `axiosRequest` no propaga el status HTTP en el Error que lanza, solo el `message`
 * limpio del backend.
 */
const UNVERIFIED_EMAIL_MESSAGE = 'Correo electrónico no verificado';

/**
 * Inicio de sesión del rediseño. Misma lógica que `login.tsx` (validación mínima: email válido y
 * contraseña no vacía — la fuerza se valida solo en el registro; `signIn` + volver atrás o ir al
 * inicio; reenvío del email de verificación cuando el backend dice que no está verificado) con
 * otra presentación:
 *
 *  - Campos con etiqueta visible, 48 dp, y botón de mostrar/ocultar de 48 dp.
 *  - Autocompletado de correo/contraseña para el gestor del sistema.
 *  - Enter en la contraseña envía el formulario.
 *  - El error es un aviso con icono (y se anuncia al lector de pantalla) en vez de una línea
 *    suelta de 13 px.
 *  - Volver de 48 dp dentro del flujo (no flotando) y "Regístrate" como control de 48 dp.
 */
export default function LoginScreen() {
  const router = useRouter();
  const push = useSafePush();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
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

  const handleLogin = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsUnverified(false);
    setIsSubmitting(true);
    try {
      const { token, ...user } = await login({ email: email.trim(), password });
      await signIn(user, token);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
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
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignSelf: 'flex-start' }}>
          <IconButton
            icon={ChevronLeft}
            label="Volver"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            colors={colors}
          />
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: 20, paddingVertical: 16 }}>
          <Image
            source={isLightColor(colors.background) ? LOGO_LIGHT : LOGO_DARK}
            style={{ width: 140, height: 42, alignSelf: 'center' }}
            resizeMode="contain"
          />

          <View style={{ gap: 6 }}>
            <Txt variant="title" colors={colors} style={{ fontSize: 26, lineHeight: 32 }}>
              Iniciar sesión
            </Txt>
            <Txt variant="body" color="muted" colors={colors}>
              Ingresa con tu cuenta para continuar con tu compra.
            </Txt>
          </View>

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
            loading={isSubmitting}
            disabled={!canSubmit && !isSubmitting}
            onPress={handleLogin}
            colors={colors}
          />

          <Pressable
            onPress={() => push('/register')}
            accessibilityRole="button"
            accessibilityLabel="Crear cuenta"
            style={{ minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
          >
            <Txt variant="body" color="muted" colors={colors}>
              ¿No tienes cuenta?{' '}
              <Txt variant="body" color="primary" colors={colors} style={{ fontWeight: '700' }}>
                Regístrate
              </Txt>
            </Txt>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
