import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, EyeOff, Lock, LogIn, Mail, Send } from 'lucide-react-native';

import { login, sendEmailVerification } from '@/api/services/auth.services';
import { useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';
import { isEmailValid } from '@/utils/validations';
import { isLightColor, type ThemeColors } from '@/theme/colors';

const LOGO_LIGHT = require('../../assets/images/logo-light.webp');
const LOGO_DARK = require('../../assets/images/logo-dark.webp');

/**
 * Mensaje EXACTO que devuelve el backend cuando el email no está
 * verificado (AUTH_WEB_FLOWS.md §1) — se matchea por texto porque
 * `axiosRequest` no propaga el status HTTP en el Error que lanza, solo
 * el `message` limpio del backend.
 */
const UNVERIFIED_EMAIL_MESSAGE = 'Correo electrónico no verificado';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const signIn = useUserStore((s) => s.signIn);
  const showToast = useToastStore((s) => s.show);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // isPasswordValid(value, false) acá — el login no debe re-validar
  // fuerza de contraseña, solo que no esté vacía; eso es cosa del
  // registro (donde sí importa que el usuario elija una segura).
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
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={{
          position: 'absolute',
          top: insets.top + 10,
          left: 16,
          zIndex: 1,
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.section,
        }}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={8}
      >
        <ChevronLeft size={22} color={colors.foreground} />
      </Pressable>

      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: insets.top + 60,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={isLightColor(colors.background) ? LOGO_LIGHT : LOGO_DARK}
          style={{ width: 140, height: 42, alignSelf: 'center', marginBottom: 28 }}
          contentFit="contain"
        />

        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.foreground, marginBottom: 6 }}>
          Iniciar sesión
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 32 }}>
          Ingresá con tu cuenta para continuar con tu compra.
        </Text>

        <FieldLabel colors={colors}>Correo electrónico</FieldLabel>
        <View style={inputRowStyle(colors)}>
          <Mail size={18} color={colors.muted} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, fontSize: 15, color: colors.foreground, paddingVertical: 12 }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            accessibilityLabel="Correo electrónico"
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <FieldLabel colors={colors}>Contraseña</FieldLabel>
        </View>
        <View style={inputRowStyle(colors)}>
          <Lock size={18} color={colors.muted} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, fontSize: 15, color: colors.foreground, paddingVertical: 12 }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            accessibilityLabel="Contraseña"
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.muted} />
            ) : (
              <Eye size={18} color={colors.muted} />
            )}
          </Pressable>
        </View>

        {error && (
          <Text style={{ fontSize: 13, color: colors.danger, marginTop: 12 }}>{error}</Text>
        )}

        {isUnverified && (
          <Pressable
            onPress={handleResendVerification}
            disabled={isResending}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 10,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: colors.primaryOverlaySoft,
              opacity: isResending ? 0.7 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel="Reenviar email de verificación"
          >
            {isResending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Send size={15} color={colors.primary} />
            )}
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
              {isResending ? 'Enviando…' : 'Reenviar email de verificación'}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleLogin}
          disabled={!canSubmit}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 50,
            borderRadius: 12,
            backgroundColor: canSubmit ? colors.primary : colors.border,
            marginTop: 24,
          }}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <LogIn size={18} color={canSubmit ? colors.onPrimary : colors.muted} />
          )}
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: canSubmit ? colors.onPrimary : colors.muted,
            }}
          >
            {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/register')}
          style={{ marginTop: 20, alignItems: 'center' }}
          accessibilityRole="button"
          accessibilityLabel="Crear cuenta"
        >
          <Text style={{ fontSize: 14, color: colors.muted }}>
            ¿No tenés cuenta?{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Registrate</Text>
          </Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

function FieldLabel({ children, colors }: { children: string; colors: ThemeColors }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 }}>
      {children}
    </Text>
  );
}

function inputRowStyle(colors: ThemeColors) {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: colors.section,
    borderRadius: 12,
    paddingHorizontal: 14,
  };
}
