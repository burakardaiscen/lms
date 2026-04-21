import React, { useState, useCallback } from 'react';
import { View, Text, SectionList, ActivityIndicator, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore'; 
import { getUsersList, getDepartmentAnalytics } from '../services/api';

// Sporthink Tema Kırmızısı (Logonun Kırmızı Pin İkonundan Esinlenildi)
const SPORTHINK_RED = '#e3342f';

export default function UsersScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  
  const [groupedUsers, setGroupedUsers] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('liste');
  // DRILL-DOWN: Hangi departmanın içine girildiğini tutan state
  const [selectedDept, setSelectedDept] = useState(null); 

  const isIK = user?.role === 'IK_YONETICI';
  const isManager = isIK || user?.role === 'DEPT_YONETICI';

  useFocusEffect(
    useCallback(() => {
      let isMounted = true; 

      const fetchData = async () => {
        setLoading(true);
        try {
          const data = await getUsersList(user?.role, user?.department);
          if (!isMounted) return;

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

          if (isManager) {
            const aData = await getDepartmentAnalytics(user.role, user.department);
            if (isMounted) setAnalyticsData(aData);
          }
        } catch (error) {
          console.error("Kullanıcılar çekilemedi:", error);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchData();
      
      return () => { isMounted = false; };
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
          <Text className="text-base font-bold text-slate-900">{item.ad} {item.soyad}</Text>
          <Text className="text-xs text-slate-500 mt-1 font-medium">{item.rol}</Text>
        </View>
        
        {canSeeProgress && (
          // Vurgu rengini Kırmızı yaptık
          <View className={`px-3 py-1.5 rounded-full ${item.id === user?.id ? 'bg-red-100' : 'bg-red-50'}`}>
            <Text className={`${item.id === user?.id ? 'text-red-700' : 'text-red-600'} font-extrabold text-sm`}>
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

    if (isIK) {
      // -------------------------------------------------------------
      // DRILL-DOWN: İK yöneticisi bir departmana tıkladıysa o departmanın detayını göster
      // -------------------------------------------------------------
      if (selectedDept) {
        const deptUsers = groupedUsers.find(g => g.title === selectedDept)?.data || [];
        
        return (
          <View className="flex-1 px-5 pt-2">
            <TouchableOpacity 
              onPress={() => setSelectedDept(null)}
              className="flex-row items-center mb-4 py-2"
            >
              {/* İkon rengi Kırmızı oldu */}
              <Ionicons name="arrow-back" size={20} color={SPORTHINK_RED} />
              <Text className="ml-2 text-red-700 font-bold text-sm">Departman Özetine Dön</Text>
            </TouchableOpacity>
            
            {/* Arka plan Kırmızı varyasyonu oldu */}
            <View className="bg-red-50 p-4 rounded-2xl mb-4 border border-red-100 flex-row items-center">
              <MaterialCommunityIcons name="account-group-outline" size={24} color={SPORTHINK_RED} />
              <Text className="ml-3 text-red-900 font-black text-base flex-1">{selectedDept} Ekibi Detayı</Text>
            </View>
            
            <FlatList
              data={deptUsers}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
                  className="bg-white p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm flex-row items-center relative overflow-hidden"
                >
                  <View className="bg-slate-50 w-10 h-10 rounded-full items-center justify-center mr-4 border border-slate-200">
                    <Text className="font-black text-slate-400">{index + 1}</Text>
                  </View>
                  
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-bold text-slate-900">{item.ad} {item.soyad}</Text>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.rol}</Text>
                    
                    <View className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <View 
                        style={{ width: `${item.tamamlanma_orani || 0}%` }} 
                        // İlerleme barı rengi Kırmızı varyasyonları oldu
                        className={`h-full rounded-full ${(item.tamamlanma_orani || 0) < 50 ? 'bg-orange-400' : 'bg-red-500'}`} 
                      />
                    </View>
                  </View>
                  
                  <View className="items-end justify-center">
                    <Text className={`font-black text-lg ${(item.tamamlanma_orani || 0) < 50 ? 'text-orange-600' : 'text-red-600'}`}>
                      %{item.tamamlanma_orani || 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </View>
        );
      }

      // -------------------------------------------------------------
      // İK GÖRÜNÜMÜ (Tüm Departmanlar - Makro Görünüm)
      // -------------------------------------------------------------
      return (
        <ScrollView className="px-5 pt-4 pb-20" showsVerticalScrollIndicator={false}>
          <Text className="text-slate-500 font-medium mb-4">Detayını görmek istediğiniz departmana tıklayın:</Text>
          {analyticsData.map((dept, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => setSelectedDept(dept.departman)} 
              activeOpacity={0.7}
              className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm"
            >
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-lg font-black text-slate-900">{dept.departman}</Text>
                  <Text className="text-xs text-slate-500 font-medium">{dept.personel_sayisi} Personel</Text>
                </View>
                <View className="flex-row items-center">
                  {/* XP rozeti Kırmızı varyasyonları oldu */}
                  <View className="bg-red-50 px-3 py-1 rounded-lg border border-red-100 mr-2">
                    <Text className="text-red-700 font-bold text-xs">{dept.ortalama_xp} Ort. XP</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </View>
              </View>
              
              <View className="w-full bg-slate-100 h-2.5 rounded-full mb-2 overflow-hidden">
                <View 
                  style={{ width: `${dept.ortalama_tamamlanma}%` }} 
                  className={`h-full rounded-full ${dept.ortalama_tamamlanma < 50 ? 'bg-orange-500' : 'bg-red-600'}`} 
                />
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Eğitim Tamamlama</Text>
                <Text className={`font-black ${dept.ortalama_tamamlanma < 50 ? 'text-orange-600' : 'text-red-700'}`}>
                  %{dept.ortalama_tamamlanma}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    } else {
      // -------------------------------------------------------------
      // DEPARTMAN YÖNETİCİSİ GÖRÜNÜMÜ (Kendi Ekibi)
      // -------------------------------------------------------------
      return (
        <ScrollView className="px-5 pt-4 pb-20" showsVerticalScrollIndicator={false}>
          {/* Bilgi bannerı arka plan Kırmızı varyasyonu oldu */}
          <View className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-6 flex-row items-center">
            <Ionicons name="stats-chart" size={24} color={SPORTHINK_RED} />
            <Text className="ml-3 flex-1 text-red-900 font-bold text-xs leading-5">
              Ekibinizin eğitim tamamlama ve başarı sıralamasını aşağıdan takip edebilirsiniz.
            </Text>
          </View>

          {analyticsData.map((person, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => navigation.navigate('UserProfile', { userId: person.kullanici_id })} 
              activeOpacity={0.7}
              className="bg-white p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm flex-row items-center relative overflow-hidden"
            >
              {index === 0 && (
                <View className="absolute -right-3 -top-3 bg-yellow-100 w-12 h-12 rounded-full items-center justify-center border-2 border-yellow-200">
                  <Text className="text-lg mt-2 mr-2">👑</Text>
                </View>
              )}

              <View className="bg-slate-50 w-10 h-10 rounded-full items-center justify-center mr-4 border border-slate-200">
                <Text className="font-black text-slate-400">{index + 1}</Text>
              </View>
              
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900">{person.ad_soyad}</Text>
                <Text className="text-[11px] text-slate-500 font-medium mb-2">{person.biten_egitim} Modül Tamamlandı • {person.xp} XP</Text>
                <View className="w-4/5 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  {/* İlerleme barı Kırmızı oldu */}
                  <View style={{ width: `${person.tamamlama_orani}%` }} className="bg-red-500 h-full rounded-full" />
                </View>
              </View>
              
              <View className="items-end mr-2">
                {/* Yüzde metni Kırmızı oldu */}
                <Text className="text-red-600 font-black text-lg">%{person.tamamlama_orani}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator size="large" color={SPORTHINK_RED} /></View>;

  return (
    <View className="flex-1 bg-white pt-14">
      <View className="px-5 mb-4">
        <Text className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
          {user?.role === 'IK_YONETICI' ? 'Tüm Çalışanlar' : 'Ekip Rehberi'}
        </Text>
        <Text className="text-slate-500 font-medium">Şirket içi rozetleri ve istatistikleri görüntüle.</Text>
      </View>

      {/* YÖNETİCİLER İÇİN SEKME (TAB) KONTROLÜ - Teması Kırmızı varyasyonu oldu */}
      {isManager && (
        <View className="mx-5 mb-4 bg-slate-100 p-1 rounded-xl flex-row">
          <TouchableOpacity 
            onPress={() => { setActiveTab('liste'); setSelectedDept(null); }} 
            className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'liste' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'liste' ? 'text-red-700' : 'text-slate-500'}`}>Rehber Listesi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('analiz')}
            className={`flex-1 py-2.5 rounded-lg items-center flex-row justify-center ${activeTab === 'analiz' ? 'bg-white shadow-sm' : ''}`}
          >
            {/* İkon rengi Kırmızı varyasyonu oldu */}
            <MaterialCommunityIcons name="google-analytics" size={16} color={activeTab === 'analiz' ? SPORTHINK_RED : '#64748b'} className="mr-1" />
            <Text className={`font-bold ${activeTab === 'analiz' ? 'text-red-700' : 'text-slate-500'}`}>Analiz Raporu</Text>
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