import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { getCertificates } from '../services/api';

export default function CertificatesScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchCertificates = async () => {
        if (user?.id) {
          const data = await getCertificates(user.id);
          setCertificates(data);
        }
        setLoading(false);
      };
      fetchCertificates();
    }, [user])
  );

  if (loading) {
    return <View className="flex-1 justify-center items-center bg-slate-50"><ActivityIndicator size="large" color="#ca8a04" /></View>;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Üst Header */}
      <View className="flex-row items-center p-5 bg-white shadow-sm z-10 border-b border-slate-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-xl font-extrabold text-slate-900 flex-1">Sertifikalarım 🏆</Text>
      </View>

      <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
        {certificates.length === 0 ? (
          <View className="items-center justify-center mt-20 px-5">
            <MaterialCommunityIcons name="certificate-outline" size={80} color="#cbd5e1" className="mb-4" />
            <Text className="text-lg font-bold text-slate-600 text-center mb-2">Henüz Sertifikan Yok</Text>
            <Text className="text-sm text-slate-400 text-center leading-5">Eğitim modüllerini ve quizleri başarıyla tamamlayarak ilk sertifikanı kazanabilirsin.</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Eğitimler')}
              className="mt-6 bg-sky-600 px-6 py-3 rounded-xl shadow-sm"
            >
              <Text className="text-white font-bold">Eğitimlere Git</Text>
            </TouchableOpacity>
          </View>
        ) : (
          certificates.map((cert, index) => (
            <View key={index} className="bg-white rounded-3xl mb-5 overflow-hidden shadow-md border border-yellow-200">
              {/* Sertifika Arka Planı ve Tasarımı */}
              <View className="bg-yellow-50 p-6 items-center border-b border-yellow-100 relative">
                {/* Süsleme Çizgileri */}
                <View className="absolute top-2 left-2 border-t-2 border-l-2 border-yellow-300 w-8 h-8 opacity-50" />
                <View className="absolute top-2 right-2 border-t-2 border-r-2 border-yellow-300 w-8 h-8 opacity-50" />
                <View className="absolute bottom-2 left-2 border-b-2 border-l-2 border-yellow-300 w-8 h-8 opacity-50" />
                <View className="absolute bottom-2 right-2 border-b-2 border-r-2 border-yellow-300 w-8 h-8 opacity-50" />

                <MaterialCommunityIcons name="medal" size={56} color="#eab308" className="mb-3 drop-shadow-md" />
                
                {/* İŞTE HATAYI ÇÖZDÜĞÜMÜZ SATIR BURASI: tracking-[0.2em] yerine tracking-widest kullandık */}
                <Text className="text-xs font-black text-yellow-600 uppercase tracking-widest mb-4">Başarı Sertifikası</Text>
                
                <Text className="text-2xl font-black text-slate-800 text-center mb-2 font-serif">{cert.userName}</Text>
                <Text className="text-sm text-slate-500 text-center italic mb-4">
                  aşağıdaki eğitim modülünü başarıyla tamamlamıştır:
                </Text>
                <Text className="text-lg font-extrabold text-sky-800 text-center leading-6 px-4">
                  {cert.title}
                </Text>
              </View>
              
              {/* Alt Bilgi Çubuğu */}
              <View className="bg-white p-4 flex-row justify-between items-center">
                <View>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mb-1">Sertifika ID</Text>
                  <Text className="text-xs font-mono text-slate-700 font-bold">{cert.certificateId}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mb-1">Veriliş Tarihi</Text>
                  <Text className="text-xs text-slate-700 font-bold">{cert.date}</Text>
                </View>
              </View>
            </View>
          ))
        )}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}