import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addPersonnel, addTraining } from '../services/api';

export default function AdminPanelScreen() {
  const [tab, setTab] = useState('personnel'); 
  
  const [pForm, setPForm] = useState({ ad: '', soyad: '', email: '', sifre: '123456', rol: 'Çalışan', departman: '' });
  const [eForm, setEForm] = useState({ baslik: '', aciklama: '', sure: '', xp: '', videoUrl: '' }); // YENİ: Eğitim Formu
  
  const handleAddUser = async () => {
    if (!pForm.email || !pForm.ad) return Alert.alert("Eksik", "Ad ve Email zorunlu.");
    try {
      await addPersonnel(pForm);
      Alert.alert("Başarılı", "Personel eklendi.");
      setPForm({ ad: '', soyad: '', email: '', sifre: '123456', rol: 'Çalışan', departman: '' });
    } catch(e) { Alert.alert("Hata", "Eklenemedi"); }
  };

  const handleAddTraining = async () => {
    if (!eForm.baslik || !eForm.videoUrl) return Alert.alert("Eksik", "Başlık ve Video URL zorunlu.");
    try {
      await addTraining({ ...eForm, xp: parseInt(eForm.xp) || 50 });
      Alert.alert("Başarılı", "Eğitim kataloğa eklendi.");
      setEForm({ baslik: '', aciklama: '', sure: '', xp: '', videoUrl: '' });
    } catch(e) { Alert.alert("Hata", "Eğitim eklenemedi"); }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-5 bg-white border-b border-slate-100">
        <Text className="text-2xl font-black text-slate-900">IK Yönetici Paneli 👑</Text>
      </View>

      <View className="flex-row p-4">
        <TouchableOpacity onPress={() => setTab('personnel')} className={`flex-1 p-3 rounded-xl items-center ${tab === 'personnel' ? 'bg-sky-600' : 'bg-white'}`}>
          <Text className={`font-bold ${tab === 'personnel' ? 'text-white' : 'text-slate-500'}`}>Personel Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('training')} className={`flex-1 p-3 rounded-xl items-center ml-2 ${tab === 'training' ? 'bg-sky-600' : 'bg-white'}`}>
          <Text className={`font-bold ${tab === 'training' ? 'text-white' : 'text-slate-500'}`}>Eğitim Ekle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="px-5">
        {tab === 'personnel' ? (
          <View className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-10">
            <TextInput className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-100" placeholder="Ad" value={pForm.ad} onChangeText={(t) => setPForm({...pForm, ad: t})} />
            <TextInput className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-100" placeholder="Soyad" value={pForm.soyad} onChangeText={(t) => setPForm({...pForm, soyad: t})} />
            <TextInput className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-100" placeholder="Email" value={pForm.email} onChangeText={(t) => setPForm({...pForm, email: t})} />
            <TextInput className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-100" placeholder="Departman (Örn: IT)" value={pForm.departman} onChangeText={(t) => setPForm({...pForm, departman: t})} />
            <TouchableOpacity onPress={handleAddUser} className="bg-emerald-600 p-4 rounded-xl items-center mt-2 shadow-sm">
              <Text className="text-white font-bold">Personeli Sisteme Kaydet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-10">
            <TextInput className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-100" placeholder="Eğitim Başlığı" value={eForm.baslik} onChangeText={(t) => setEForm({...eForm, baslik: t})} />
            <TextInput className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-100" placeholder="Kısa Açıklama" value={eForm.aciklama} onChangeText={(t) => setEForm({...eForm, aciklama: t})} />
            <TextInput className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-100" placeholder="Süre (Örn: 15 Dk)" value={eForm.sure} onChangeText={(t) => setEForm({...eForm, sure: t})} />
            <TextInput className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-100" placeholder="Kazanılacak XP (Örn: 100)" keyboardType="numeric" value={eForm.xp} onChangeText={(t) => setEForm({...eForm, xp: t})} />
            <TextInput className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-100" placeholder="Video MP4 URL'si" value={eForm.videoUrl} onChangeText={(t) => setEForm({...eForm, videoUrl: t})} />
            <TouchableOpacity onPress={handleAddTraining} className="bg-sky-600 p-4 rounded-xl items-center mt-2 shadow-sm">
              <Text className="text-white font-bold">Eğitimi Kataloğa Ekle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}