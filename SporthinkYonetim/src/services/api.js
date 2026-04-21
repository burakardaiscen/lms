// src/services/api.js

const BASE_URL = 'http://172.20.10.2:4000'; // IP adresini kontrol et

// 1. Gerçek Dashboard İstatistikleri (Backend'den çekilir)
export const getDashboardStats = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/dashboard/${userId}`);
    return await response.json();
  } catch (error) {
    console.error("Dashboard API Hatası:", error);
    return null;
  }
};

// 2. Kullanıcı Listesi Çekme
export const getUsersList = async (role, department) => {
  try {
    const response = await fetch(`${BASE_URL}/api/kullanicilar`);
    const data = await response.json();

    if (role === 'IK_YONETICI') {
      return data; 
    } else {
      return data.filter(u => u.departman === department); 
    }
  } catch (error) {
    console.error("API'ye bağlanırken hata oluştu:", error);
    return [];
  }
};

// 3. Gerçek Giriş İşlemi
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    }
    
    return data; 
  } catch (error) {
    console.error("Login API Hatası:", error);
    throw error;
  }
};

// 4. Liderlik Tablosunu Çekme
export const getLeaderboard = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/liderlik`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Liderlik API Hatası:", error);
    return [];
  }
};

// 5. Gemini AI ile Konuşma
export const getAIResponse = async (message, userContext) => {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userContext }),
    });
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("AI API Hatası:", error);
    return "Bağlantı hatası oluştu.";
  }
};

// 6. Eğitimleri Veritabanından Çek
export const getTrainings = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/egitimler/${userId}`);
    return await response.json();
  } catch (error) {
    console.error("Eğitim API Hatası:", error);
    return [];
  }
};

// 7. Video Bitince XP Kazan
export const finishVideoAndGetXP = async (userId, egitimId, kazanilanXp) => {
  try {
    const response = await fetch(`${BASE_URL}/api/video-tamamla`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, egitimId, kazanilanXp }),
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    return data;
  } catch (error) {
    console.error("XP API Hatası:", error);
    throw error;
  }
};

// 8. Kullanıcı Profil Detaylarını ve Eğitim Geçmişini Çek
export const getUserDetails = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/kullanici-detay/${userId}`);
    return await response.json();
  } catch (error) {
    console.error("Kullanıcı Detay API Hatası:", error);
    return null;
  }
};

// 9. Ödül Pazarını Çek
export const getRewards = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/oduller`);
    return await response.json();
  } catch (error) {
    console.error("Ödül API Hatası:", error);
    return [];
  }
};

// 10. Ödül Satın Al (Talep Et)
export const claimReward = async (userId, odulId, fiyat) => {
  try {
    const response = await fetch(`${BASE_URL}/api/odul-talep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, odulId, fiyat }),
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    return data;
  } catch (error) {
    throw error;
  }
};

// 11. Bildirimleri Çek
export const getNotifications = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/bildirimler/${userId}`);
    return await response.json();
  } catch (error) {
    console.error("Bildirim API Hatası:", error);
    return [];
  }
};

// 12. Bildirimi Okundu Yap
export const markNotificationRead = async (notificationId) => {
  try {
    await fetch(`${BASE_URL}/api/bildirim-oku`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    });
  } catch (error) {
    console.error("Bildirim Okuma Hatası:", error);
  }
};

// ---------------- YENİ EKLENEN UÇLAR ----------------

// 13. Şifre Güncelleme
export const updatePassword = async (userId, yeniSifre) => {
  try {
    const response = await fetch(`${BASE_URL}/api/sifre-guncelle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, yeniSifre }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    throw error;
  }
};

// 14. Yönetici: Personel Ekleme
export const addPersonnel = async (personelData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/personel-ekle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personelData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    throw error;
  }
};

// 15. Yönetici: Eğitim Ekleme
export const addTraining = async (trainingData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/egitim-ekle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trainingData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    throw error;
  }
};

// 16. Quiz Sorularını Çekme
export const getQuizQuestions = async (egitimId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/quiz/${egitimId}`);
    return await response.json();
  } catch (error) {
    console.error("Quiz Soruları Hatası:", error);
    return []; // Hata olursa boş dizi dönsün ki uygulama çökmesin
  }
};

// 17. Quiz Sonucunu Gönder ve XP Kazan
export const submitQuizResult = async (userId, egitimId, dogruSayisi, toplamSoru, kazanilanXp) => {
  try {
    const response = await fetch(`${BASE_URL}/api/quiz-tamamla`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, egitimId, dogruSayisi, toplamSoru, kazanilanXp }),
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    return data;
  } catch (error) {
    throw error; // Hata mesajını QuizScreen'de Alert ile göstermek için fırlatıyoruz
  }
};

// 18. Kullanıcıya Eğitim Ata
export const assignTrainingToUser = async (userId, egitimId) => {
  const response = await fetch(`${BASE_URL}/api/admin/egitim-ata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, egitimId }),
  });
  return await response.json();
};

// 19. Kullanıcıdan Eğitimi Kaldır
export const removeTrainingFromUser = async (userId, egitimId) => {
  const response = await fetch(`${BASE_URL}/api/admin/egitim-kaldir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, egitimId }),
  });
  return await response.json();
};
// 20. Kullanıcının Sertifikalarını Çek
export const getCertificates = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/sertifikalar/${userId}`);
    return await response.json();
  } catch (error) {
    console.error("Sertifika Çekme Hatası:", error);
    return [];
  }
};
// 21. Hibrit Eğitim İçeriklerini Çek
export const getTrainingContent = async (egitimId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/egitim-detay/${egitimId}`);
    return await response.json();
  } catch (error) {
    console.error("İçerik Çekme Hatası:", error);
    return [];
  }
};
// 22. Departman ve İK Analiz Verilerini Çek
export const getDepartmentAnalytics = async (role, department) => {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/analiz/${role}/${department}`);
    return await response.json();
  } catch (error) {
    console.error("Analiz verisi çekilemedi:", error);
    return [];
  }
};

// 23. Eğitime Özel AI Asistanı
export const getCourseAIResponse = async (message, egitimId, userId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/egitim-asistan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, egitimId, userId }),
    });
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("Eğitim AI API Hatası:", error);
    return "Bağlantı hatası oluştu. Lütfen tekrar dene.";
  }
};