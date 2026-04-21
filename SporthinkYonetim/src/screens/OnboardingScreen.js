import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Sporthink Academy\'ye Hoş Geldin!',
    description: 'Şirket içi eğitimlerin, kariyer yolculuğun ve kişisel gelişimin için tek bir platform.',
    icon: () => <Ionicons name="school" size={120} color="#0284c7" />,
    color: 'bg-sky-50'
  },
  {
    id: '2',
    title: 'Eğitimleri İzle, XP Kazan',
    description: 'Kendi departmanına özel video eğitimleri tamamla, seviyeni yükselt ve şirketin en iyisi ol.',
    icon: () => <Ionicons name="play-circle" size={120} color="#059669" />,
    color: 'bg-emerald-50'
  },
  {
    id: '3',
    title: 'Oyunlaştırma ve Ödül Pazarı',
    description: 'Topladığın Coin\'lerle liderlik tablosuna tırman ve ödül pazarından ekstra izin, sinema bileti gibi ödüller kap!',
    icon: () => <FontAwesome5 name="store" size={100} color="#ea580c" />,
    color: 'bg-orange-50'
  },
  {
    id: '4',
    title: 'Sana Özel AI Asistan',
    description: 'Sistemle veya eğitimlerle ilgili bir sorun mu var? Yapay zeka asistanımız 7/24 sorularını yanıtlamaya hazır.',
    icon: () => <MaterialCommunityIcons name="robot-excited" size={120} color="#4f46e5" />,
    color: 'bg-indigo-50'
  }
];

export default function OnboardingScreen() {
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding(); // Son slaytta "Başla"ya basınca state'i günceller ve Login'e atar
    }
  };

  const renderItem = ({ item }) => (
    <View style={{ width }} className={`flex-1 items-center justify-center p-8 ${item.color}`}>
      <View className="bg-white p-10 rounded-full shadow-sm mb-10 border border-slate-100">
        {item.icon()}
      </View>
      <Text className="text-3xl font-black text-slate-900 text-center mb-4 tracking-tight">{item.title}</Text>
      <Text className="text-base text-slate-600 text-center leading-6 font-medium px-4">{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-3 flex-row justify-end p-5 absolute top-10 right-0 z-10 w-full">
        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={completeOnboarding} className="bg-white/50 px-4 py-2 rounded-full">
            <Text className="text-slate-500 font-bold">Atla</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-[3]">
        <FlatList 
          data={SLIDES}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          ref={slidesRef}
        />
      </View>

      <View className="flex-1 bg-white items-center justify-between p-8 pb-10">
        <View className="flex-row h-2">
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [10, 25, 10], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return <Animated.View style={{ width: dotWidth, opacity }} key={i.toString()} className="h-2.5 bg-sky-600 rounded-full mx-1" />;
          })}
        </View>

        <TouchableOpacity 
          onPress={scrollToNext} 
          className="bg-sky-600 w-full p-4 rounded-2xl items-center shadow-sm"
        >
          <Text className="text-white text-lg font-bold">
            {currentIndex === SLIDES.length - 1 ? 'Hemen Başla' : 'İleri'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}