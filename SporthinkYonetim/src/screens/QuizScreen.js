import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { getQuizQuestions, submitQuizResult } from '../services/api';

export default function QuizScreen({ route, navigation }) {
  // Video ekranından gelen parametreleri dinamik alıyoruz (Eski ve yeni sisteme tam uyumlu)
  const egitimId = route.params?.egitimId || route.params?.egitim?.id || route.params?.egitim?.egitim_id;
  const egitimBaslik = route.params?.egitimBaslik || route.params?.egitim?.title || "Eğitim Quizi";
  const xp = route.params?.xp || route.params?.egitim?.xp || 0;

  const user = useAuthStore(state => state.user);
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (egitimId) {
      fetchQuestions();
    } else {
      setLoading(false); // ID yoksa yüklemeyi durdur
    }
  }, [egitimId]);

  const fetchQuestions = async () => {
    try {
      const data = await getQuizQuestions(egitimId);
      setQuestions(data || []);
    } catch (error) {
      console.error("Soru çekme hatası:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (choice) => {
    let newScore = score;
    if (choice === questions[currentIndex].dogru_cevap) {
      newScore += 1;
      setScore(newScore);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz(newScore, questions.length);
    }
  };

  const finishQuiz = async (finalScore, totalQuestions) => {
    try {
      const res = await submitQuizResult(user.id, egitimId, finalScore, totalQuestions, xp);
      Alert.alert("Sonuç", res.message || "Eğitimi tamamladın!", [
        { text: "Harika!", onPress: () => navigation.navigate('Ana Sayfa') }
      ]);
    } catch (err) {
      Alert.alert("Başarısız", err.message || "Bir hata oluştu", [
        { text: "Geri Dön", onPress: () => navigation.goBack() }
      ]);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#0284c7" className="mt-20" />;

  // İŞTE SENİN EFSANE B PLANI (Soru yoksa doğrudan XP verip bitiren zekice kurgu)
  if (questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center p-5">
        <View className="bg-white p-8 rounded-3xl items-center shadow-sm border border-slate-100 w-full">
          <View className="bg-emerald-100 p-4 rounded-full mb-4">
            <Ionicons name="checkmark-done" size={64} color="#059669" />
          </View>
          <Text className="text-2xl font-black text-slate-800 text-center mb-2">Eğitim Tamamlandı!</Text>
          <Text className="text-slate-500 text-center mb-8 font-medium leading-6">
            Bu eğitim için henüz bir sınav tanımlanmamış. Videoyu/Slaytı başarıyla bitirdiğin için tebrikler, XP'ni doğrudan alabilirsin!
          </Text>
          <TouchableOpacity 
            onPress={() => finishQuiz(1, 1)} 
            className="bg-sky-600 w-full py-4 rounded-2xl items-center shadow-sm"
          >
            <Text className="text-white font-bold text-lg">XP'yi Kap ve Bitir</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentSoru = questions[currentIndex];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 p-5">
      <View className="mb-8 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sky-600 font-bold uppercase text-xs mb-1 tracking-widest">Soru {currentIndex + 1} / {questions.length}</Text>
          <Text className="text-xl font-black text-slate-900 leading-7">{egitimBaslik}</Text>
        </View>
        <View className="bg-orange-100 px-3 py-1 rounded-full ml-2">
          <Text className="text-orange-600 font-bold text-xs">{xp} XP</Text>
        </View>
      </View>

      <View className="w-full bg-slate-200 h-2 rounded-full mb-8 overflow-hidden">
        <View style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} className="bg-sky-600 h-full rounded-full" />
      </View>

      <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
        <Text className="text-lg font-bold text-slate-800 leading-7">{currentSoru.soru_metni}</Text>
      </View>

      {['A', 'B', 'C', 'D'].map((key) => {
        const secenekMetni = currentSoru[`secenek_${key.toLowerCase()}`];
        // Eğer D şıkkı boşsa uygulamayı patlatmasın diye ufak bir koruma (Sadece dolu şıkları gösterir)
        if (!secenekMetni) return null; 

        return (
          <TouchableOpacity 
            key={key}
            onPress={() => handleAnswer(key)}
            className="bg-white p-5 rounded-2xl mb-4 border border-slate-100 flex-row items-center shadow-sm active:bg-sky-50"
          >
            <View className="w-10 h-10 bg-sky-50 rounded-full items-center justify-center mr-4 border border-sky-100">
              <Text className="text-sky-600 font-extrabold text-lg">{key}</Text>
            </View>
            <Text className="text-slate-700 font-medium flex-1 text-base">{secenekMetni}</Text>
          </TouchableOpacity>
        );
      })}
    </SafeAreaView>
  );
}