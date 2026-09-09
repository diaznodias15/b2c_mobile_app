import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, ChevronLeft, Mail, Send, UserPlus } from 'lucide-react-native';

import { register, sendEmailVerification } from '@/api/services/auth.services';
import { useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
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
import type { ThemeColors } from '@/theme/colors';

const AREA_CODES = ['0412', '0414', '0416', '0422', '0424', '0426'];
const DOC_TYPE_LABELS: Record<DocType, string> = {
  V: 'Venezolano',
  E: 'Extranjero',
  P: 'Pasaporte',
  J: 'Jurídico',
  G: 'Gubernamental',
};
/** Letra que se muestra en el select cerrado; el nombre completo va en la lista del modal. */
const DOC_TYPE_SHORT_LABELS: Record<DocType, string> = {
  V: 'V',
  E: 'E',
  P: 'P',
  J: 'J',
  G: 'G',
};

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const showToast = useToastStore((s) => s.show);

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
  // El registro NO autentica (AUTH_WEB_FLOWS.md §2) — el email todavía
  // no está verificado. En vez de redirigir a /login de una, mostramos
  // esta pantalla ("Te enviamos un email") y esperamos a que el usuario
  // lo verifique por su cuenta.
  const [isRegistered, setIsRegistered] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isDocTypeModalOpen, setIsDocTypeModalOpen] = useState(false);

  const canSubmit =
    isEmailValid(email) &&
    /^\d{6,8}$/.test(documentNumber.trim()) &&
    isNameValid(name) &&
    isVenezuelanPhoneValid({ countryCode: '+58', areaCode, phoneNumber }) &&
    isPasswordValid(password) &&
    isConfirmPasswordValid(password, confirmPassword) &&
    acceptTerms &&
    !isSubmitting;

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
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primaryOverlaySoft,
              marginBottom: 20,
            }}
          >
            <Mail size={40} color={colors.primary} strokeWidth={1.6} />
          </View>
          <Text
            style={{
              fontSize: 19,
              fontWeight: '700',
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Te enviamos un email
          </Text>
          <Text
            style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 28 }}
          >
            Revisá tu bandeja de entrada (y spam) para verificar tu cuenta antes de iniciar
            sesión.
          </Text>

          <Pressable
            onPress={handleResendVerification}
            disabled={isResending}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 999,
              backgroundColor: colors.section,
              opacity: isResending ? 0.7 : 1,
              marginBottom: 16,
            }}
            accessibilityRole="button"
            accessibilityLabel="Reenviar email"
          >
            {isResending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Send size={16} color={colors.primary} />
            )}
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
              {isResending ? 'Enviando…' : 'Reenviar email'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/login')}
            accessibilityRole="button"
            accessibilityLabel="Ir a iniciar sesión"
          >
            <Text style={{ fontSize: 14, color: colors.muted }}>
              Ya verifiqué —{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Iniciar sesión</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
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

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 60,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.foreground, marginBottom: 6 }}>
          Crear cuenta
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 24 }}>
          Completá tus datos para poder finalizar tus compras.
        </Text>

        <Field label="Correo electrónico" colors={colors}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={colors.muted}
            style={inputStyle(colors)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </Field>

        <Field label="Nombre completo" colors={colors}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre y apellido"
            placeholderTextColor={colors.muted}
            style={inputStyle(colors)}
          />
        </Field>

        <Field label="Tipo y número de documento" colors={colors}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => setIsDocTypeModalOpen(true)}
              style={[
                inputStyle(colors),
                {
                  width: 104,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Tipo de documento"
            >
              <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: '600' }}>
                {DOC_TYPE_SHORT_LABELS[documentType]}
              </Text>
              <ChevronDown size={16} color={colors.muted} />
            </Pressable>
            <TextInput
              value={documentNumber}
              onChangeText={setDocumentNumber}
              placeholder="12345678"
              placeholderTextColor={colors.muted}
              style={[inputStyle(colors), { flex: 1 }]}
              keyboardType="number-pad"
            />
          </View>
        </Field>

        <Modal
          visible={isDocTypeModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDocTypeModalOpen(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'center',
              paddingHorizontal: 32,
            }}
            onPress={() => setIsDocTypeModalOpen(false)}
          >
            <Pressable
              style={{ backgroundColor: colors.background, borderRadius: 16, paddingVertical: 8 }}
              onPress={() => {}}
            >
              {DOC_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => {
                    setDocumentType(type);
                    setIsDocTypeModalOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    paddingHorizontal: 18,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={DOC_TYPE_LABELS[type]}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      color: colors.foreground,
                      fontWeight: documentType === type ? '700' : '400',
                    }}
                  >
                    {DOC_TYPE_LABELS[type]}
                  </Text>
                  {documentType === type && <Check size={18} color={colors.primary} />}
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        <Field label="Género" colors={colors}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {GENDER_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                active={gender === option.value}
                onPress={() => setGender(option.value)}
                colors={colors}
              />
            ))}
          </View>
        </Field>

        <Field label="Teléfono" colors={colors}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[inputStyle(colors), { width: 56, alignItems: 'center' }]}>
              <Text style={{ fontSize: 15, color: colors.foreground }}>+58</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 150 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {AREA_CODES.map((code) => (
                  <Chip
                    key={code}
                    label={code}
                    active={areaCode === code}
                    onPress={() => setAreaCode(code)}
                    colors={colors}
                  />
                ))}
              </View>
            </ScrollView>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="1234567"
              placeholderTextColor={colors.muted}
              style={[inputStyle(colors), { flex: 1 }]}
              keyboardType="number-pad"
              maxLength={7}
            />
          </View>
        </Field>

        <Field label="Contraseña" colors={colors}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="8-40 caract., mayúscula, número y especial"
            placeholderTextColor={colors.muted}
            style={inputStyle(colors)}
            secureTextEntry
            autoCapitalize="none"
          />
        </Field>

        <Field label="Confirmar contraseña" colors={colors}>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repetí tu contraseña"
            placeholderTextColor={colors.muted}
            style={inputStyle(colors)}
            secureTextEntry
            autoCapitalize="none"
          />
        </Field>

        <Pressable
          onPress={() => setAcceptTerms((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptTerms }}
          accessibilityLabel="Acepto los términos y condiciones"
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 1.5,
              borderColor: acceptTerms ? colors.primary : colors.border,
              backgroundColor: acceptTerms ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {acceptTerms && <Check size={14} color={colors.onPrimary} strokeWidth={3} />}
          </View>
          <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>
            Acepto los términos y condiciones de uso.
          </Text>
        </Pressable>

        {error && (
          <Text style={{ fontSize: 13, color: colors.danger, marginTop: 12 }}>{error}</Text>
        )}

        <Pressable
          onPress={handleRegister}
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
          accessibilityLabel="Crear cuenta"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <UserPlus size={18} color={canSubmit ? colors.onPrimary : colors.muted} />
          )}
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: canSubmit ? colors.onPrimary : colors.muted,
            }}
          >
            {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/login')}
          style={{ marginTop: 20, alignItems: 'center', marginBottom: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Ya tengo cuenta"
        >
          <Text style={{ fontSize: 14, color: colors.muted }}>
            ¿Ya tenés cuenta? <Text style={{ color: colors.primary, fontWeight: '700' }}>Iniciá sesión</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  colors,
  children,
}: {
  label: string;
  colors: ThemeColors;
  children: ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: active ? colors.primary : colors.section,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: active ? colors.onPrimary : colors.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function inputStyle(colors: ThemeColors) {
  return {
    backgroundColor: colors.section,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.foreground,
  };
}
