import { Dimensions, FlatList, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { Carousel, Pagination } from 'react-native-reanimated-carousel';

import { BottomTabs } from '@/components/bottom-tabs';
import { DepartmentCard } from '@/components/DepartmentCard';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import { useConfigStore, useThemeColors } from '@/store/config.store';
import { useAdvertisingStore } from '@/store/advertising.store';
import { useDepartmentStore } from '@/store/department.store';

const SCREEN_WIDTH = Dimensions.get('window').width;
/** La publicidad mobile de la API (`tx_img_url_mobile`) viene en formato 1:1. */
const BANNER_SIZE = SCREEN_WIDTH - 48;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
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

        <WhyChooseUs colors={colors} />
      </ScrollView>
      <BottomTabs />
    </View>
  );
}
