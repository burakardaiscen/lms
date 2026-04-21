import React, { useState, useCallback } from 'react';
import { View, Text, SectionList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { getTrainings } from '../services/api';

export default function TrainingScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [groupedTrainings, setGroupedTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchMyTrainings = async () => {
        const data = await getTrainings(user?.id);
        
        const devamEdenler = data.filter(e => !e.is_completed);
        const tamamlananlar = data.filter(e => e.is_completed);

        const groupedData = [];
        if (devamEdenler.length > 0) {
          groupedData.push({ title: 'GÖREVLENDİRİLEN EĞİTİMLER', data: devamEdenler });
        }
        if (tamamlananlar.length > 0) {
          groupedData.push({ title: 'TAMAMLANAN EĞİTİMLER', data: tamamlananlar });
        }

        setGroupedTrainings(groupedData);
        setLoading(false);
      };
      fetchMyTrainings();
    }, [user])
  );

  const renderTrainingItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => {
        if (item.is_completed) {
          // TAMAMLANAN EĞİTİM İÇİN SEÇENEKLER (YENİ EKLENDİ)
          Alert.alert(
            "Eğitim Tamamlandı",
            "Bu eğitim modülü için ne yapmak istersin?",
            [
              { text: "Eğitimi Tekrar İzle", onPress: () => navigation.navigate('VideoPlayer', { training: item }) },
              { text: "Sertifikayı Göster", onPress: () => navigation.navigate('Certificates') },
              { text: "Vazgeç", style: "cancel" }
            ]
          );
        } else {
          // DEVAM EDEN EĞİTİM İÇİN DİREKT VİDEOYA GİT
          navigation.navigate('VideoPlayer', { training: item });
        }
      }}
      className={`bg-white p-5 rounded-3xl mb-4 mx-5 flex-row items-center border border-slate-100 shadow-sm ${item.is_completed ? 'opacity-80' : 'opacity-100'}`}
    >
      <View className={`w-14 h-14 rounded-full items-center justify-center mr-4 ${item.is_completed ? 'bg-emerald-100' : 'bg-sky-100'}`}>
        <Ionicons name={item.is_completed ? "checkmark-done" : "play"} size={28} color={item.is_completed ? "#059669" : "#0284c7"} className={item.is_completed ? "" : "ml-1"} />
      </View>
      <View className="flex-1">
        <Text className="font-extrabold text-slate-800 text-base mb-1">{item.title}</Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="time-outline" size={14} color="#64748b" />
          <Text className="text-slate-500 text-xs ml-1 mr-3 font-medium">{item.duration}</Text>
          <Ionicons name="star" size={14} color="#ea580c" />
          <Text className="text-orange-600 text-xs ml-1 font-bold">{item.xp} XP</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View className="px-6 py-3 mb-2 bg-slate-50">
      <Text className="text-xs font-black text-slate-400 tracking-widest">{title}</Text>
    </View>
  );

  if (loading) {
    return <View className="flex-1 justify-center items-center bg-slate-50"><ActivityIndicator size="large" color="#0284c7" /></View>;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 pt-5">
      <Text className="text-3xl font-extrabold text-slate-900 mb-2 px-5 tracking-tight">Eğitimlerim</Text>
      <Text className="text-slate-500 mb-6 px-5 font-medium leading-6">Sana atanan eğitimleri izle ve bilgi testlerini geçerek XP kazan.</Text>

      {groupedTrainings.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <Ionicons name="library-outline" size={64} color="#cbd5e1" className="mb-4" />
          <Text className="text-slate-500 text-center font-medium text-base">Şu an üzerine atanmış veya tamamladığın bir eğitim bulunmuyor.</Text>
        </View>
      ) : (
        <SectionList
          sections={groupedTrainings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTrainingItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}