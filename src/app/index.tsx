import { Dimensions, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { Carousel, Pagination } from 'react-native-reanimated-carousel';

import { BottomTabs } from '@/components/bottom-tabs';
import { useConfigStore } from '@/store/config.store';
import { useAdvertisingStore } from '@/store/advertising.store';
import { useDepartmentStore } from '@/store/department.store';
import type { ThemeColors } from '@/theme/colors';
import type { Department } from '@/types/whitelabel';

const SCREEN_WIDTH = Dimensions.get('window').width;
/** La publicidad mobile de la API (`tx_img_url_mobile`) viene en formato 1:1. */
const BANNER_SIZE = SCREEN_WIDTH - 48;
const DEPARTMENT_CARD_WIDTH = (SCREEN_WIDTH - 24 * 2 - 12) / 2;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useConfigStore((s) => s.getThemeColors());
  const companyName = useConfigStore((s) => s.appConfig?.tx_company_name);
  const advertising = useAdvertisingStore((s) => s.advertising);
  const departments = useDepartmentStore((s) => s.departments);
  const router = useRouter();
  const carouselProgress = useSharedValue(0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.foreground }}>
            {companyName ?? 'Farmacia El Samán de Perijá'}
          </Text>
        </View>

        {advertising.length > 0 && (
          <View style={{ alignItems: 'center' }}>
            <Carousel
              style={{ width: BANNER_SIZE, height: BANNER_SIZE }}
              data={advertising}
              loop={advertising.length > 1}
              autoplay={advertising.length > 1}
              autoplayInterval={4500}
              onProgressChange={(p) => {
                carouselProgress.value = p;
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.tx_img_url_mobile }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 18,
                    backgroundColor: colors.section,
                  }}
                  contentFit="cover"
                />
              )}
            />
            {advertising.length > 1 && (
              <Pagination
                count={advertising.length}
                progress={carouselProgress}
                containerStyle={{ gap: 6, marginTop: 10 }}
                dotStyle={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.border,
                }}
                activeDotStyle={{ backgroundColor: colors.primary }}
              />
            )}
          </View>
        )}

        <View style={{ paddingHorizontal: 24, marginTop: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
            Departamentos
          </Text>
        </View>

        {departments.length > 0 ? (
          <FlatList
            data={departments}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            columnWrapperStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <DepartmentCard
                department={item}
                colors={colors}
                onPress={() => router.push('/departments')}
              />
            )}
          />
        ) : (
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>
              Todavía no hay departamentos cargados.
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomTabs />
    </View>
  );
}

const DEPARTMENT_CARD_HEIGHT = 168;

/**
 * Fake-gradient sin expo-linear-gradient: muchas franjas finas con opacidad
 * progresiva (curva ease-in fuerte) en vez de 2-3 bandas gruesas — con pocas
 * bandas se ven "escalones" duros; con ~24 el ojo lo percibe como un fade
 * suave. Exponente alto (2.6) + altura acotada (52%) para que la foto se
 * vea limpia arriba y el oscurecido quede marcado solo abajo, donde está
 * el texto — con una curva más plana (1.6) y más altura (70%) quedaba
 * parejo/neblinoso en vez de nítido.
 */
const SCRIM_BAND_COUNT = 28;
const SCRIM_HEIGHT_PERCENT = 52;
const SCRIM_MAX_OPACITY = 0.82;
const SCRIM_BAND_OPACITIES = Array.from({ length: SCRIM_BAND_COUNT }, (_, i) => {
  const t = (i + 1) / SCRIM_BAND_COUNT;
  return Math.pow(t, 2.6) * SCRIM_MAX_OPACITY;
});

function DepartmentCard({
  department,
  colors,
  onPress,
}: {
  department: Department;
  colors: ThemeColors;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: DEPARTMENT_CARD_WIDTH,
        height: DEPARTMENT_CARD_HEIGHT,
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: department.col_department ?? colors.section,
      }}
      accessibilityRole="button"
      accessibilityLabel={department.nb_department}
    >
      {department.tx_img_url && (
        <Image
          source={{ uri: department.tx_img_url }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
        />
      )}

      {/* Scrim de abajo: franjas finas, no bandas gruesas (ver comentario arriba) */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '70%',
          flexDirection: 'column',
        }}
      >
        {SCRIM_BAND_OPACITIES.map((opacity, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: `rgba(0,0,0,${opacity})` }} />
        ))}
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14 }}>
        <Text
          numberOfLines={2}
          style={{
            fontSize: 15.5,
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: 4,
          }}
        >
          {department.nb_department}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 11.5, fontWeight: '500', color: 'rgba(255,255,255,0.85)' }}>
            Ver productos
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>
            →
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
