import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import YoutubePlayer from "react-native-youtube-iframe"; // YOUTUBE MOTORU EKLENDİ
import { getTrainingContent } from '../services/api';

export default function VideoPlayerScreen({ route, navigation }) {
  const { training } = route.params; 
  
  const [contentList, setContentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getTrainingContent(training.id);
        setContentList(data);
      } catch (error) {
        console.error("Veri hatası:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [training.id]);

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
      // İstersen video bitince otomatik sonraki adıma geçmesini de buraya yazabiliriz
    }
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text className="text-sky-400 mt-4 font-bold">Eğitim Yükleniyor...</Text>
      </View>
    );
  }

  if (contentList.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center p-5">
        <Ionicons name="alert-circle-outline" size={64} color="#475569" className="mb-4" />
        <Text className="text-white font-bold text-lg text-center">Bu eğitime ait içerik bulunamadı.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6 bg-sky-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentItem = contentList[currentIndex];
  // URL'den YouTube ID'sini çıkaran basit bir Regex fonksiyonu
  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url; // Eğer zaten ID olarak (MF0aDsdpnhA) girilmişse direkt onu döndürür
  };

  const videoId = currentItem?.tip === 'video' ? getYoutubeId(currentItem.video_url) : null;
  const isLastStep = currentIndex === contentList.length - 1;
  const progressPercent = ((currentIndex + 1) / contentList.length) * 100;

  const handleNext = () => {
    setPlaying(false); // Adım geçerken videoyu durdur
    if (isLastStep) {
      navigation.replace('Quiz', { egitim: training });
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Üst İlerleme Barı */}
      <View className="bg-white px-5 py-4 shadow-sm border-b border-slate-100 flex-row items-center z-10">
        <TouchableOpacity onPress={() => { setPlaying(false); navigation.goBack(); }} className="mr-4">
          <Ionicons name="close" size={28} color="#1e293b" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">
            İlerleme: %{Math.round(progressPercent)}
          </Text>
          <View className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <View className="h-full bg-sky-500 rounded-full" style={{ width: `${progressPercent}%` }} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {currentItem.tip === 'video' ? (
          /* YOUTUBE OYNATICI ALANI */
          <View className="bg-black w-full shadow-md" style={{ height: Dimensions.get('window').width * 0.56 }}>
            {videoId ? (
              <YoutubePlayer
                height={"100%"}
                play={playing}
                videoId={videoId}
                onChangeState={onStateChange}
                forceAndroidAutoplay={false}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="warning-outline" size={32} color="#94a3b8" />
                <Text className="text-white/50 text-xs mt-2">Geçerli bir YouTube linki bulunamadı.</Text>
              </View>
            )}
          </View>
        ) : (
          /* SLAYT TASARIMI */
          <View className="flex-1 p-6">
            <View className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 min-h-[400px] justify-center">
              <View className="bg-amber-50 w-14 h-14 rounded-2xl items-center justify-center mb-8 border border-amber-100">
                <MaterialCommunityIcons name="lightbulb-on" size={32} color="#d97706" />
              </View>
              <Text className="text-3xl font-black text-slate-900 mb-6 leading-[42px]">
                {currentItem.slide_baslik}
              </Text>
              <View className="w-16 h-1.5 bg-sky-500 mb-8 rounded-full shadow-sm" />
              <Text className="text-slate-600 text-lg leading-8 font-medium">
                {currentItem.slide_metin}
              </Text>
            </View>
          </View>
        )}

        {/* Bilgilendirme Bannerı */}
        <View className="p-6">
          <View className="bg-sky-50 p-4 rounded-2xl flex-row items-center border border-sky-100">
            <Ionicons name="information-circle" size={24} color="#0284c7" />
            <Text className="ml-3 text-sky-800 text-xs font-bold flex-1 leading-5">
              {currentItem.tip === 'video' 
                ? "Videoyu izlerken önemli noktaları not almayı unutma. 'Sıradaki Adım' butonu ile ilerleyebilirsin." 
                : "Slaytı dikkatle okuyun. Bilgi testinde bu içeriklerden sorumlusunuz."}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Alt Kontrol Butonları */}
      <View className="p-6 bg-white border-t border-slate-100 flex-row justify-between shadow-lg">
        <TouchableOpacity 
          onPress={() => { setPlaying(false); currentIndex > 0 && setCurrentIndex(currentIndex - 1); }} 
          className={`w-14 h-14 items-center justify-center rounded-2xl border ${currentIndex === 0 ? 'border-slate-100 opacity-20' : 'border-slate-200 bg-white'}`}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleNext}
          className={`flex-1 ml-4 h-14 flex-row items-center justify-center rounded-2xl shadow-sm ${isLastStep ? 'bg-emerald-600' : 'bg-sky-600'}`}
        >
          <Text className="text-white font-black text-base mr-2 tracking-wide">
            {isLastStep ? "TESTE BAŞLA" : "SONRAKİ ADIM"}
          </Text>
          <Ionicons name={isLastStep ? "school" : "arrow-forward"} size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}