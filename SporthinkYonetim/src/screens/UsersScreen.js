import React, { useState, useCallback } from 'react';
import { View, Text, SectionList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore'; 
import { getUsersList, getDepartmentAnalytics } from '../services/api';

export default function UsersScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  
  const [groupedUsers, setGroupedUsers] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Yöneticiler için Sekme (Tab) State'i: 'liste' veya 'analiz'
  const [activeTab, setActiveTab] = useState('liste');

  const isManager = user?.role === 'IK_YONETICI' || user?.role === 'DEPT_YONETICI';

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        // 1. Kullanıcı Listesini Çek
        const data = await getUsersList(user?.role, user?.department);
        
        const myProfile = data.find(u => u.id === user?.id);
        const otherUsers = data.filter(u => u.id !== user?.id);

        const finalGroups = [];
        if (myProfile) finalGroups.push({ title: 'PROFİLİM', data: [myProfile] });
        
        const deptGroups = otherUsers.reduce((acc, currentItem) => {
          const dept = currentItem.departman || 'Belirtilmemiş';
          const existingGroup = acc.find(group => group.title === dept);
          if (existingGroup) {
            existingGroup.data.push(currentItem);
          } else {
            acc.push({ title: dept, data: [currentItem] });
          }
          return acc;
        }, []);

        setGroupedUsers([...finalGroups, ...deptGroups]);

        // 2. Eğer Yöneticiyse Analiz Verilerini Çek
        if (isManager) {
          const aData = await getDepartmentAnalytics(user.role, user.department);
          setAnalyticsData(aData);
        }
        
        setLoading(false);
      };
      fetchData();
    }, [user])
  );

  const renderUserItem = ({ item }) => {
    const canSeeProgress = isManager || item.id === user?.id;

    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
        className="flex-row justify-between items-center bg-white p-4 rounded-2xl mb-3 shadow-sm border border-slate-100 mx-5"
      >
        <View className="flex-1 pr-2">
          <Text className="text-base font-bold text-slate-800">{item.ad} {item.soyad}</Text>
          <Text className="text-xs text-slate-500 mt-1 font-medium">{item.rol}</Text>
        </View>
        
        {canSeeProgress && (
          <View className={`px-3 py-1.5 rounded-full ${item.id === user?.id ? 'bg-indigo-100' : 'bg-sky-100'}`}>
            <Text className={`${item.id === user?.id ? 'text-indigo-600' : 'text-sky-600'} font-extrabold text-sm`}>
              %{item.tamamlanma_orani || 0}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View className="bg-slate-50 px-5 py-3 mb-2">
      <Text className="text-sm font-black text-slate-400 uppercase tracking-widest">{title}</Text>
    </View>
  );

  // === ANALİZ GÖRÜNÜMÜ RENDER FONKSİYONU ===
  const renderAnalytics = () => {
    if (analyticsData.length === 0) {
      return <Text className="text-center text-slate-500 mt-10">Henüz yeterli analiz verisi yok.</Text>;
    }

    if (user?.role === 'IK_YONETICI') {
      // İK GÖRÜNÜMÜ (Tüm Departmanlar)
      return (
        <ScrollView className="px-5 pt-4 pb-20" showsVerticalScrollIndicator={false}>
          <Text className="text-slate-500 font-medium mb-4">Şirket genelindeki departman performansları:</Text>
          {analyticsData.map((dept, index) => (
            <View key={index} className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm">
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-lg font-black text-slate-800">{dept.departman}</Text>
                  <Text className="text-xs text-slate-500 font-medium">{dept.personel_sayisi} Personel</Text>
                </View>
                <View className="bg-sky-50 px-3 py-1 rounded-lg border border-sky-100">
                  <Text className="text-sky-700 font-bold text-xs">{dept.ortalama_xp} Ort. XP</Text>
                </View>
              </View>
              
              <View className="w-full bg-slate-100 h-2.5 rounded-full mb-2 overflow-hidden">
                <View 
                  style={{ width: `${dept.ortalama_tamamlanma}%` }} 
                  className={`h-full rounded-full ${dept.ortalama_tamamlanma < 50 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                />
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Eğitim Tamamlama</Text>
                <Text className={`font-black ${dept.ortalama_tamamlanma < 50 ? 'text-orange-600' : 'text-emerald-600'}`}>
                  %{dept.ortalama_tamamlanma}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    } else {
      // DEPARTMAN YÖNETİCİSİ GÖRÜNÜMÜ (Kendi Ekibi)
      return (
        <ScrollView className="px-5 pt-4 pb-20" showsVerticalScrollIndicator={false}>
          <View className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-6 flex-row items-center">
            <Ionicons name="stats-chart" size={24} color="#059669" />
            <Text className="ml-3 flex-1 text-emerald-800 font-bold text-xs leading-5">
              Ekibinizin eğitim tamamlama ve başarı sıralamasını aşağıdan takip edebilirsiniz.
            </Text>
          </View>

          {analyticsData.map((person, index) => (
            <View key={index} className="bg-white p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm flex-row items-center relative overflow-hidden">
              {/* Liderlik Tacı (İlk Sıradaki İçin) */}
              {index === 0 && (
                <View className="absolute -right-3 -top-3 bg-yellow-100 w-12 h-12 rounded-full items-center justify-center border-2 border-yellow-200">
                  <Text className="text-lg mt-2 mr-2">👑</Text>
                </View>
              )}

              <View className="bg-slate-50 w-10 h-10 rounded-full items-center justify-center mr-4 border border-slate-200">
                <Text className="font-black text-slate-400">{index + 1}</Text>
              </View>
              
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-800">{person.ad_soyad}</Text>
                <Text className="text-[11px] text-slate-500 font-medium mb-2">{person.biten_egitim} Modül Tamamlandı • {person.xp} XP</Text>
                <View className="w-4/5 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <View style={{ width: `${person.tamamlama_orani}%` }} className="bg-sky-500 h-full rounded-full" />
                </View>
              </View>
              
              <View className="items-end mr-2">
                <Text className="text-sky-600 font-black text-lg">%{person.tamamlama_orani}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    }
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-slate-50"><ActivityIndicator size="large" color="#0284c7" /></View>;

  return (
    <View className="flex-1 bg-slate-50 pt-14">
      <View className="px-5 mb-4">
        <Text className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
          {user?.role === 'IK_YONETICI' ? 'Tüm Çalışanlar' : 'Ekip Rehberi'}
        </Text>
        <Text className="text-slate-500 font-medium">Şirket içi rozetleri ve istatistikleri görüntüle.</Text>
      </View>

      {/* YÖNETİCİLER İÇİN SEKME (TAB) KONTROLÜ */}
      {isManager && (
        <View className="mx-5 mb-4 bg-slate-200/50 p-1 rounded-xl flex-row">
          <TouchableOpacity 
            onPress={() => setActiveTab('liste')}
            className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'liste' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'liste' ? 'text-sky-700' : 'text-slate-500'}`}>Rehber Listesi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('analiz')}
            className={`flex-1 py-2.5 rounded-lg items-center flex-row justify-center ${activeTab === 'analiz' ? 'bg-white shadow-sm' : ''}`}
          >
            <MaterialCommunityIcons name="google-analytics" size={16} color={activeTab === 'analiz' ? '#0369a1' : '#64748b'} className="mr-1" />
            <Text className={`font-bold ${activeTab === 'analiz' ? 'text-sky-700' : 'text-slate-500'}`}>Analiz Raporu</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* İÇERİK: Tab seçimine göre liste veya analiz grafiklerini göster */}
      {activeTab === 'liste' ? (
        <SectionList
          sections={groupedUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderAnalytics()
      )}

    </View>
  );
}