import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { getUserDetails, assignTrainingToUser, removeTrainingFromUser } from '../services/api';

const BASE_URL = 'http://172.20.10.2:4000'; // IP ADRESİNİ KONTROL ETMEYİ UNUTMA

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params || {}; 
  const currentUser = useAuthStore((state) => state.user); 
  
  const [targetUser, setTargetUser] = useState(null);
  const [allTrainings, setAllTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  // KURŞUN GEÇİRMEZ VERİ ÇEKME MANTIĞI (Sonsuz Yüklemeyi Engeller)
  useEffect(() => {
    let isMounted = true; // Sayfa kapanırsa işlemi iptal etmek için güvenlik sübabı

    const fetchData = async () => {
      try {
        setLoading(true); // Yüklemeyi başlat

        if (!userId) {
          if (isMounted) setLoading(false);
          return;
        }
        
        const details = await getUserDetails(userId);
        
        if (!details || !details.user) {
          if (isMounted) setLoading(false);
          return;
        }

        const response = await fetch(`${BASE_URL}/api/admin/kullanici-egitim-durumu/${userId}`);
        
        // Eğer sunucu hata döndürdüyse (örn: 500) sessizce asılı kalmasın diye hata fırlatıyoruz
        if (!response.ok) {
          throw new Error('Eğitim durumu alınamadı');
        }

        const trainings = await response.json();
        
        if (isMounted) {
          setTargetUser(details.user);
          setAllTrainings(trainings || []);
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        // HATA OLSA DA OLMASA DA YÜKLEME EKRANINI ZORLA KAPAT
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false; // Temizlik (Memory leak önler)
    };
  }, [userId]);

  const handleToggleTraining = async (trainingId, isAssigned) => {
    try {
      if (isAssigned) {
        await removeTrainingFromUser(userId, trainingId);
        Alert.alert("Bilgi", "Eğitim personelden kaldırıldı.");
      } else {
        await assignTrainingToUser(userId, trainingId);
        Alert.alert("Başarılı", "Eğitim personele atandı! 🚀");
      }
      // İşlem sonrası güncel veriyi tekrar çek (Sadece AllTrainings'i güncellesin diye loading state'i ellemeden yapabiliriz ama şimdilik en temizi sayfayı yenilemek)
      const response = await fetch(`${BASE_URL}/api/admin/kullanici-egitim-durumu/${userId}`);
      if(response.ok) {
         const updatedTrainings = await response.json();
         setAllTrainings(updatedTrainings);
      }
    } catch (e) {
      Alert.alert("Hata", "İşlem yapılamadı.");
    }
  };

  // ----------------------------------------------------------------
  // 🔐 YETKİ VE GİZLİLİK MANTIĞI
  // ----------------------------------------------------------------
  const isOwnProfile = currentUser?.id === userId;
  const isIK = currentUser?.role === 'IK_YONETICI';
  const isSameDeptManager = currentUser?.role === 'DEPT_YONETICI' && currentUser?.department === targetUser?.departman;

  const canSeePrivateDetails = isOwnProfile || isIK || isSameDeptManager;
  const canManageTrainings = isIK || isSameDeptManager;

  const getBadgeInfo = (xp) => {
    if (xp >= 10000) return { name: "Efsane", color: "text-purple-600", bg: "bg-purple-100", icon: "crown" };
    if (xp >= 5000) return { name: "Elmas", color: "text-cyan-600", bg: "bg-cyan-100", icon: "gem" };
    if (xp >= 2500) return { name: "Altın", color: "text-yellow-600", bg: "bg-yellow-100", icon: "trophy" };
    if (xp >= 1000) return { name: "Gümüş", color: "text-slate-600", bg: "bg-slate-200", icon: "medal" };
    return { name: "Bronz", color: "text-orange-700", bg: "bg-orange-100", icon: "star" };
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="mt-4 text-slate-500 font-medium">Profil Yükleniyor...</Text>
      </View>
    );
  }

  if (!targetUser) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center p-5">
        <Ionicons name="person-remove-outline" size={64} color="#94a3b8" className="mb-4" />
        <Text className="text-lg font-bold text-slate-800 text-center">Kullanıcı verisi bulunamadı.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6 bg-sky-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const badge = getBadgeInfo(targetUser?.xp || 0);
  const streakCount = targetUser?.streak_count || 1;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Üst Profil Alanı (HERKESE AÇIK) */}
        <View className="bg-white p-6 items-center border-b border-slate-100 shadow-sm">
          <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-5 top-5 z-10 p-2">
            <Ionicons name="arrow-back" size={28} color="#1e293b" />
          </TouchableOpacity>
          <View className="w-24 h-24 bg-sky-600 rounded-full items-center justify-center mb-4 shadow-sm border-4 border-sky-100">
            <Text className="text-white text-4xl font-black">{targetUser?.ad?.charAt(0)}{targetUser?.soyad?.charAt(0)}</Text>
          </View>
          <Text className="text-2xl font-black text-slate-900">{targetUser?.ad} {targetUser?.soyad}</Text>
          <Text className="text-slate-500 font-medium">{targetUser?.departman} • {targetUser?.rol}</Text>
          
          <View className="flex-row mt-6 w-full justify-around border-t border-slate-50 pt-6">
            <View className="items-center">
              <Text className="text-xl font-black text-sky-600">{targetUser?.xp || 0}</Text>
              <Text className="text-xs text-slate-400 font-bold uppercase">Toplam XP</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-black text-emerald-600">{targetUser?.coin || 0}</Text>
              <Text className="text-xs text-slate-400 font-bold uppercase">Coin</Text>
            </View>
          </View>
        </View>

        {/* OYUNLAŞTIRMA ALANI (HERKESE AÇIK) */}
        <View className="p-5 flex-row justify-between">
          <View className={`w-[48%] p-4 rounded-2xl flex-row items-center shadow-sm border border-slate-100 ${badge.bg}`}>
            <FontAwesome5 name={badge.icon} size={24} color={badge.color.replace('text-', '').replace('-600', '') === 'yellow' ? '#ca8a04' : badge.color.replace('text-', '')} className="mr-3" />
            <View className="flex-1">
              <Text className="text-[10px] text-slate-500 font-bold uppercase">Mevcut Rozet</Text>
              <Text className={`font-black text-base ${badge.color}`}>{badge.name}</Text>
            </View>
          </View>

          <View className="w-[48%] bg-white p-4 rounded-2xl flex-row items-center shadow-sm border border-slate-100">
            <MaterialCommunityIcons name="fire" size={28} color="#ea580c" className="mr-3" />
            <View className="flex-1">
              <Text className="text-[10px] text-slate-400 font-bold uppercase">Günlük Seri</Text>
              <Text className="font-black text-slate-800 text-base">{streakCount} Gün</Text>
            </View>
          </View>
        </View>

        {/* -------------------------------------------------------- */}
        {/* ALT ALAN: EĞİTİMLER (SADECE YETKİLİLERE VE KENDİSİNE AÇIK) */}
        {/* -------------------------------------------------------- */}
        {canSeePrivateDetails ? (
          <View className="px-5 pb-5">
            <Text className="text-lg font-black text-slate-900 mb-4">Eğitim Durumu & Atama</Text>
            
            {allTrainings.map((item) => {
              const isCompleted = item.is_completed;
              const isAssigned = item.is_assigned; 

              let badgeText = "➖ ATANMADI";
              let badgeStyle = "text-slate-500 bg-slate-100";
              let cardOpacity = "opacity-60";

              if (isCompleted) {
                badgeText = "✓ TAMAMLANDI";
                badgeStyle = "text-emerald-600 bg-emerald-50";
                cardOpacity = "opacity-100";
              } else if (isAssigned) {
                badgeText = "⏳ DEVAM EDİYOR";
                badgeStyle = "text-orange-600 bg-orange-50";
                cardOpacity = "opacity-100";
              }

              return (
                <View key={item.id} className={`bg-white p-4 rounded-2xl mb-3 flex-row items-center justify-between border border-slate-100 shadow-sm ${cardOpacity}`}>
                  <View className="flex-1 pr-3">
                    <Text className={`font-bold text-base ${isAssigned || isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                      {item.title}
                    </Text>
                    
                    <View className="flex-row items-center mt-1.5">
                      <Text className={`text-[10px] font-black px-2 py-1 rounded-md tracking-wider ${badgeStyle}`}>
                        {badgeText}
                      </Text>
                    </View>

                    {isCompleted && canManageTrainings && (
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('PerformanceDetail', { userId, egitimId: item.id, egitimBaslik: item.title })}
                        className="mt-3 inline-self-start"
                      >
                        <Text className="text-sky-600 text-xs font-bold underline">📊 Performans Raporunu Gör</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {canManageTrainings && (
                    <TouchableOpacity 
                      onPress={() => handleToggleTraining(item.id, isAssigned)}
                      className={`px-4 py-2 rounded-xl border ${isAssigned ? 'bg-red-50 border-red-100' : 'bg-sky-600 border-sky-600'}`}
                    >
                      <Text className={`font-bold text-xs ${isAssigned ? 'text-red-600' : 'text-white'}`}>
                        {isAssigned ? 'Kaldır' : 'Ata'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('Certificates')}
              className="mt-6 bg-yellow-50 border border-yellow-200 p-5 rounded-3xl flex-row justify-center items-center shadow-sm mb-10"
            >
              <MaterialCommunityIcons name="certificate" size={24} color="#ca8a04" className="mr-2" />
              <Text className="font-bold text-yellow-700 text-lg">Sertifikaları Görüntüle</Text>
            </TouchableOpacity>

          </View>
        ) : (
          <View className="px-5 pb-5 mt-4 mb-10">
            <View className="bg-slate-100 p-8 rounded-3xl items-center border border-slate-200 border-dashed">
              <View className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Ionicons name="lock-closed" size={32} color="#94a3b8" />
              </View>
              <Text className="text-slate-700 font-extrabold text-lg text-center mb-2">Gizli Profil Verisi</Text>
              <Text className="text-slate-500 text-xs text-center leading-5 px-4 font-medium">
                Gizlilik politikaları gereği, diğer çalışanların aldığı eğitimleri ve sertifikalarını görüntüleme yetkiniz bulunmamaktadır.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}