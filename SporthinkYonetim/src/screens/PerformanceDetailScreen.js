import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const BASE_URL = 'http://192.168.1.104:4000'; // IP adresini kontrol et

export default function PerformanceDetailScreen({ route, navigation }) {
  const { userId, egitimId, egitimBaslik } = route.params;
  const [performans, setPerformans] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformans = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/admin/egitim-performans/${userId}/${egitimId}`);
        const data = await res.json();
        setPerformans(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformans();
  }, [userId, egitimId]);

  if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#0284c7" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center p-5 bg-white border-b border-slate-100 shadow-sm z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 flex-1" numberOfLines={1}>Performans Raporu</Text>
      </View>

      <ScrollView className="p-5">
        <View className="bg-sky-600 p-6 rounded-3xl shadow-sm mb-6 items-center">
          <MaterialCommunityIcons name="google-analytics" size={48} color="white" className="mb-2" />
          <Text className="text-white text-lg font-bold text-center mt-2">{egitimBaslik}</Text>
          <Text className="text-sky-200 text-sm font-medium mt-1">Eğitim Analitiği</Text>
        </View>

        {performans?.message ? (
          <View className="bg-orange-50 border border-orange-200 p-6 rounded-2xl items-center">
            <Ionicons name="warning" size={32} color="#ea580c" className="mb-2" />
            <Text className="text-orange-800 font-bold text-center">Detaylı Veri Bulunamadı</Text>
            <Text className="text-orange-600 text-center text-xs mt-2">
              Bu eğitim, performans takip sistemi kurulmadan önce tamamlandığı için izleme detayı kaydedilmemiştir.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm border border-slate-100">
              <Text className="text-slate-400 text-xs font-bold uppercase mb-1">İzleme Süresi</Text>
              <Text className="text-2xl font-black text-slate-800">{performans?.video_izleme_suresi || 0} Dk</Text>
            </View>
            
            <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm border border-slate-100">
              <Text className="text-slate-400 text-xs font-bold uppercase mb-1">İleri Sarma</Text>
              <Text className={`text-2xl font-black ${performans?.video_atlama_sayisi > 3 ? 'text-red-500' : 'text-emerald-500'}`}>
                {performans?.video_atlama_sayisi || 0} Kez
              </Text>
            </View>

            <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm border border-slate-100">
              <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Quiz Skoru</Text>
              <Text className="text-2xl font-black text-sky-600">% {performans?.en_yuksek_quiz_puani || 0}</Text>
            </View>

            <View className="w-[48%] bg-white p-4 rounded-2xl mb-4 shadow-sm border border-slate-100">
              <Text className="text-slate-400 text-xs font-bold uppercase mb-1">Quiz Denemesi</Text>
              <Text className="text-2xl font-black text-slate-800">{performans?.quiz_deneme_sayisi || 0} Kez</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}