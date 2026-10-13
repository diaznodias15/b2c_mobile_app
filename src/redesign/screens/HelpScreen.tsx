import { type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react-native';

import { useRefreshControl } from '@/hooks/useRefreshControl';
import { selectEffectiveBranch, useBranchStore } from '@/store/branch.store';
import { useConfigStore, useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import type { ThemeColors } from '@/theme/colors';
import { buildMailtoUrl, buildTelUrl, buildWhatsAppUrl } from '@/utils/contact';

import { BottomTabs } from '../components/bottom-tabs';
import { Surface } from '../ui/Surface';
import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';

/**
 * Ayuda del rediseño (antes un placeholder con solo el título). Reúne lo que una persona
 * necesita para resolver una duda sobre su compra, **leído de la config del backend** (nada
 * inventado): WhatsApp, teléfono y correo de la empresa, y los datos de la sede activa
 * (dirección, horario, teléfono). Cada canal solo aparece si el backend lo trae.
 *
 * El WhatsApp usa `tx_whatsapp_contact_phone` (o, en su defecto, el teléfono de la empresa) con
 * el mensaje inicial `tx_whatsapp_default_message` si existe; los números se normalizan a
 * formato internacional (ver `utils/contact.ts`).
 */
export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const refreshControl = useRefreshControl();
  const showToast = useToastStore((s) => s.show);
  const appConfig = useConfigStore((s) => s.appConfig);
  const branch = useBranchStore(selectEffectiveBranch);

  const companyPhone = appConfig?.tx_company_phone;
  const whatsappPhone = appConfig?.tx_whatsapp_contact_phone || appConfig?.tx_company_whatsapp || companyPhone;
  const whatsappUrl = buildWhatsAppUrl(whatsappPhone, appConfig?.tx_whatsapp_default_message);
  const telUrl = buildTelUrl(companyPhone);
  const mailUrl = buildMailtoUrl(appConfig?.tx_company_email);

  const open = (url: string, failure: string) => {
    Linking.openURL(url).catch(() => showToast(failure));
  };

  const hasChannels = !!(whatsappUrl || telUrl || mailUrl);
  const workingHours = branch?.tx_working_hours?.trim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, gap: 20, paddingBottom: 32 }}
      >
        <View style={{ gap: 4 }}>
          <Txt variant="title" colors={colors}>
            Ayuda
          </Txt>
          <Txt variant="body" color="muted" colors={colors}>
            ¿Tienes una duda sobre tu pedido o un producto? Escríbenos o llámanos.
          </Txt>
        </View>

        {hasChannels ? (
          <Surface colors={colors} padding={0} style={{ overflow: 'hidden' }}>
            {whatsappUrl && (
              <ContactRow
                icon={<MessageCircle size={22} color="#128C7E" />}
                tint="rgba(37, 211, 102, 0.14)"
                label="Escríbenos por WhatsApp"
                value={whatsappPhone ?? ''}
                onPress={() => open(whatsappUrl, 'No pudimos abrir WhatsApp.')}
                colors={colors}
              />
            )}
            {telUrl && (
              <ContactRow
                icon={<Phone size={22} color={colors.primary} />}
                tint={colors.primaryOverlay}
                label="Llámanos"
                value={companyPhone ?? ''}
                onPress={() => open(telUrl, 'No pudimos abrir el teléfono.')}
                colors={colors}
                bordered={!!whatsappUrl}
              />
            )}
            {mailUrl && (
              <ContactRow
                icon={<Mail size={22} color={colors.primary} />}
                tint={colors.primaryOverlay}
                label="Escríbenos un correo"
                value={appConfig?.tx_company_email ?? ''}
                onPress={() => open(mailUrl, 'No pudimos abrir el correo.')}
                colors={colors}
                bordered={!!(whatsappUrl || telUrl)}
              />
            )}
          </Surface>
        ) : (
          <Surface colors={colors} padding={16}>
            <Txt variant="body" color="muted" colors={colors}>
              Por ahora no hay canales de contacto disponibles. Intenta de nuevo más tarde.
            </Txt>
          </Surface>
        )}

        {branch && (
          <View style={{ gap: 8 }}>
            <Txt variant="section" colors={colors}>
              Tu sede
            </Txt>
            <Surface colors={colors} padding={16} style={{ gap: 14 }}>
              <Txt variant="label" colors={colors} style={{ fontWeight: '800' }}>
                {branch.tx_alias ?? branch.nb_branch}
              </Txt>
              {branch.tx_address ? (
                <DetailLine icon={<MapPin size={18} color={colors.muted} />} text={branch.tx_address} colors={colors} />
              ) : null}
              {workingHours ? (
                <DetailLine icon={<Clock size={18} color={colors.muted} />} text={workingHours} colors={colors} />
              ) : null}
              {branch.tx_phone ? (
                <DetailLine icon={<Phone size={18} color={colors.muted} />} text={branch.tx_phone} colors={colors} />
              ) : null}
            </Surface>
          </View>
        )}

        {appConfig?.tx_company_name || appConfig?.tx_company_rif ? (
          <Txt variant="caption" color="muted" colors={colors} style={{ textAlign: 'center' }}>
            {[appConfig?.tx_company_name, appConfig?.tx_company_rif ? `RIF: ${appConfig.tx_company_rif}` : null]
              .filter(Boolean)
              .join(' · ')}
          </Txt>
        ) : null}
      </ScrollView>
      <BottomTabs />
    </View>
  );
}

function ContactRow({
  icon,
  tint,
  label,
  value,
  onPress,
  colors,
  bordered,
}: {
  icon: ReactNode;
  tint: string;
  label: string;
  value: string;
  onPress: () => void;
  colors: ThemeColors;
  bordered?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${value}`}
      style={({ pressed }) => ({
        minHeight: 68,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        borderTopWidth: bordered ? 1 : 0,
        borderTopColor: colors.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: MIN_TOUCH - 4,
          height: MIN_TOUCH - 4,
          borderRadius: 12,
          backgroundColor: tint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="label" colors={colors}>
          {label}
        </Txt>
        <Txt variant="caption" color="muted" colors={colors} numberOfLines={1}>
          {value}
        </Txt>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </Pressable>
  );
}

function DetailLine({ icon, text, colors }: { icon: ReactNode; text: string; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ marginTop: 1 }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Txt variant="label" colors={colors} style={{ fontWeight: '500' }}>
          {text}
        </Txt>
      </View>
    </View>
  );
}
