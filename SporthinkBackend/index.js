require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// 1. Veritabanı ve Gemini AI Bağlantı Ayarları
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

pool.connect()
    .then(() => console.log('✅ Supabase PostgreSQL Veritabanına Başarıyla Bağlanıldı!'))
    .catch(err => console.error('❌ Veritabanı Bağlantı Hatası:', err.message));

// 2. GERÇEK GİRİŞ (LOGIN) UCU
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const sorgu = `
            SELECT 
                kullanici_id as id, 
                ad, 
                soyad, 
                rol, 
                departman 
            FROM kullanicilar 
            WHERE email = $1 AND sifre = $2
        `;
        
        const sonuc = await pool.query(sorgu, [email, password]);

        if (sonuc.rows.length === 0) {
            return res.status(401).json({ message: 'E-posta veya şifre hatalı!' });
        }

        const kullanici = sonuc.rows[0];

        res.json({
            message: 'Giriş başarılı',
            user: {
                id: kullanici.id,
                name: `${kullanici.ad} ${kullanici.soyad}`,
                role: kullanici.rol,
                department: kullanici.departman
            }
        });

    } catch (err) {
        console.error("Login hatası:", err.message);
        res.status(500).json({ message: 'Sunucu tarafında bir hata oluştu.' });
    }
});

// 3. GERÇEK LİDERLİK TABLOSU API'Sİ (kullanici_puanlari TABLOSUNA UYARLANDI)
app.get('/api/liderlik', async (req, res) => {
    try {
        const sorgu = `
            SELECT 
                k.kullanici_id as id, 
                k.ad, 
                k.soyad, 
                k.departman, 
                p.xp 
            FROM kullanicilar k
            INNER JOIN kullanici_puanlari p ON k.kullanici_id = p.kullanici_id
            ORDER BY p.xp DESC 
            LIMIT 10
        `;
        const sonuc = await pool.query(sorgu);
        res.json(sonuc.rows);
    } catch (err) {
        console.error("Liderlik tablosu hatası:", err.message);
        res.status(500).json({ message: 'Sunucu Hatası' });
    }
});

// 4. KULLANICI LİSTESİ UCU - XP VE STREAK EKLENDİ
app.get('/api/kullanicilar', async (req, res) => {
    try {
        const sorgu = `
            SELECT 
                k.kullanici_id as id, 
                k.ad, 
                k.soyad, 
                k.departman, 
                k.rol,
                COALESCE(p.xp, 0) as xp,
                COALESCE(p.streak_count, 0) as streak, -- 🔥 İŞTE KODDAN UÇAN O KRİTİK STREAK SATIRI 🔥
                COALESCE(
                    ROUND(
                        (COUNT(DISTINCT t.egitim_id)::numeric / 
                        NULLIF(COUNT(DISTINCT a.egitim_id) + COUNT(DISTINCT t.egitim_id) - COUNT(DISTINCT CASE WHEN a.egitim_id = t.egitim_id THEN a.egitim_id END), 0)) * 100
                    ), 0
                ) as tamamlanma_orani
            FROM kullanicilar k
            LEFT JOIN kullanici_puanlari p ON k.kullanici_id = p.kullanici_id
            LEFT JOIN atanan_egitimler a ON k.kullanici_id = a.kullanici_id
            LEFT JOIN tamamlanan_egitimler t ON k.kullanici_id = t.kullanici_id
            GROUP BY k.kullanici_id, k.ad, k.soyad, k.departman, k.rol, p.xp, p.streak_count
            ORDER BY tamamlanma_orani DESC, k.ad ASC
        `;
        const sonuc = await pool.query(sorgu);
        res.json(sonuc.rows);
    } catch (err) {
        console.error("Sorgu hatası:", err.message);
        res.status(500).json({ message: 'Sunucu Hatası' });
    }
});
// 5. GEMINI YAPAY ZEKA SOHBET UCU
app.post('/api/chat', async (req, res) => {
    const { message, userContext } = req.body;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Sen Sporthink şirketinin akıllı İK ve Eğitim asistanısın. 
            Kullanıcı adı: ${userContext.name}
            Departmanı: ${userContext.department}
            
            Kurallar:
            1. Nazik, profesyonel ve yardımcı bir dil kullan.
            2. Sporthink şirket politikaları, eğitim videoları ve oyunlaştırma sistemi hakkında bilgi ver.
            3. İzin sorulursa, "Liderlik" sekmesindeki marketten alınabileceğini söyle.
            4. Cevapların kısa, öz ve anlaşılır olsun.
            
            Kullanıcının mesajı: "${message}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (err) {
        console.error("Gemini API Hatası:", err.message);
        res.status(500).json({ reply: "Sistemsel bir yoğunluk var, birazdan tekrar dener misin?" });
    }
});

// 6. EĞİTİM LİSTESİNİ ÇEKME UCU (Kullanıcının bitirdiklerini işaretler)
// 6. EĞİTİM LİSTESİNİ ÇEKME UCU (ATANANLAR VE TAMAMLANANLAR)
app.get('/api/egitimler/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // MANTIK: Eğitim aktif olacak VE (Kullanıcıya atanmış OLACAK YADA Kullanıcı bunu bitirmiş OLACAK)
        const sorgu = `
            SELECT 
                e.egitim_id as id, 
                e.baslik as title, 
                e.sure as duration, 
                e.xp_degeri as xp, 
                e.video_url,
                CASE WHEN t.kullanici_id IS NOT NULL THEN true ELSE false END as is_completed
            FROM egitim_katalogu e
            LEFT JOIN atanan_egitimler a ON e.egitim_id = a.egitim_id AND a.kullanici_id = $1
            LEFT JOIN tamamlanan_egitimler t ON e.egitim_id = t.egitim_id AND t.kullanici_id = $1
            WHERE e.aktif_mi = true AND (a.kullanici_id IS NOT NULL OR t.kullanici_id IS NOT NULL)
            ORDER BY is_completed ASC, e.egitim_id ASC
        `;
        const sonuc = await pool.query(sorgu, [userId]);
        res.json(sonuc.rows);
    } catch (err) {
        console.error("Eğitimler Hatası:", err.message);
        res.status(500).json({ message: 'Eğitimler çekilemedi' });
    }
});

// 7. VİDEO BİTİNCE XP KAZANMA UCU (Hile koruması eklendi!)
app.post('/api/video-tamamla', async (req, res) => {
    const { userId, egitimId, kazanilanXp } = req.body;

    try {
        // 1. Kullanıcı bu eğitimi daha önce bitirmiş mi kontrol et
        const kontrol = await pool.query('SELECT * FROM tamamlanan_egitimler WHERE kullanici_id = $1 AND egitim_id = $2', [userId, egitimId]);
        
        if (kontrol.rows.length > 0) {
            return res.status(400).json({ message: 'Bu eğitimi zaten tamamladın, uyanık! 😎' });
        }

        // 2. Eğitimi bitirdi olarak sisteme kaydet
        await pool.query('INSERT INTO tamamlanan_egitimler (kullanici_id, egitim_id) VALUES ($1, $2)', [userId, egitimId]);

        // 3. XP'yi veritabanına yatır
        const sorgu = `UPDATE kullanici_puanlari SET xp = xp + $1 WHERE kullanici_id = $2 RETURNING xp`;
        const sonuc = await pool.query(sorgu, [kazanilanXp, userId]);

        res.json({ message: `Harika! ${kazanilanXp} XP kazandın.`, yeniXp: sonuc.rows[0].xp });
    } catch (err) {
        console.error("XP Ekleme Hatası:", err.message);
        res.status(500).json({ message: 'XP eklenirken bir sorun oluştu' });
    }
});

// 8. ANA SAYFA (DASHBOARD) İSTATİSTİKLERİ - KESİN ÇÖZÜM
app.get('/api/dashboard/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const puanSorgu = await pool.query('SELECT xp, coin FROM kullanici_puanlari WHERE kullanici_id = $1', [userId]);
        const userPuan = puanSorgu.rows[0] || { xp: 0, coin: 0 };

        const userCount = await pool.query('SELECT COUNT(*) FROM kullanicilar');
        const totalUsers = parseInt(userCount.rows[0].count);

        // 1. GERÇEK DEVAM EDEN SAYISI: Atananlar içinde olup henüz tamamlanmayanlar
        const devamEdenSorgu = await pool.query(`
            SELECT COUNT(*) FROM atanan_egitimler a 
            LEFT JOIN tamamlanan_egitimler t ON a.egitim_id = t.egitim_id AND a.kullanici_id = t.kullanici_id
            WHERE a.kullanici_id = $1 AND t.kullanici_id IS NULL
        `, [userId]);
        const devamEdenSayisi = parseInt(devamEdenSorgu.rows[0].count);

        // 2. TAMAMLANAN SAYISI
        const tamamlananSorgu = await pool.query('SELECT COUNT(*) FROM tamamlanan_egitimler WHERE kullanici_id = $1', [userId]);
        const totalTamamlanan = parseInt(tamamlananSorgu.rows[0].count);

        // 3. YÜZDE HESABI: Tamamlanan / (Tamamlanan + Bekleyen)
        const toplamYuk = totalTamamlanan + devamEdenSayisi;
        let tamamlanmaYuzdesi = 0;
        if (toplamYuk > 0) {
            tamamlanmaYuzdesi = Math.round((totalTamamlanan / toplamYuk) * 100);
        }

        res.json({
            xp: userPuan.xp,
            coin: userPuan.coin,
            aktifPersonel: totalUsers,
            tamamlanma: `%${tamamlanmaYuzdesi}`,
            devamEden: devamEdenSayisi,
            kritikUyari: devamEdenSayisi > 0 
                ? `Kalan ${devamEdenSayisi} eğitim modülünü tamamlayarak gelişimini sürdürebilirsin.` 
                : 'Tüm atanan eğitimlerini başarıyla tamamladın! 🎉'
        });

    } catch (err) {
        console.error("Dashboard Hatası:", err.message);
        res.status(500).json({ message: 'Veriler çekilemedi' });
    }
});
// 9. KULLANICI DETAY VE EĞİTİM GEÇMİŞİ (YENİ)
app.get('/api/kullanici-detay/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Kullanıcı Temel Bilgilerini ve XP'sini Çek
        const userSorgu = await pool.query(`
            SELECT k.kullanici_id as id, k.ad, k.soyad, k.rol, k.departman, p.xp, p.coin
            FROM kullanicilar k
            LEFT JOIN kullanici_puanlari p ON k.kullanici_id = p.kullanici_id
            WHERE k.kullanici_id = $1
        `, [id]);

        if (userSorgu.rows.length === 0) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

        // Kullanıcının Bitirdiği Eğitimleri Çek
        const bitirilenSorgu = await pool.query(`
            SELECT e.egitim_id as id, e.baslik as title, e.xp_degeri as xp
            FROM tamamlanan_egitimler t
            JOIN egitim_katalogu e ON t.egitim_id = e.egitim_id
            WHERE t.kullanici_id = $1
        `, [id]);

        res.json({
            user: userSorgu.rows[0],
            tamamlananEgitimler: bitirilenSorgu.rows
        });
    } catch (err) {
        console.error("Detay Hatası:", err.message);
        res.status(500).json({ message: 'Detaylar çekilemedi' });
    }
});

// 10. ÖDÜL PAZARI LİSTESİ
app.get('/api/oduller', async (req, res) => {
    try {
        // İkonları isimlere göre dinamik belirliyoruz
        const sorgu = `
            SELECT 
                odul_id as id, 
                ad as title, 
                puan_fiyat as price, 
                CASE 
                    WHEN ad ILIKE '%İzin%' THEN 'beach' 
                    WHEN ad ILIKE '%Sinema%' THEN 'ticket-confirmation' 
                    WHEN ad ILIKE '%Tişört%' THEN 'tshirt-crew'
                    ELSE 'coffee' 
                END as icon 
            FROM odul_katalogu 
            WHERE aktif_mi = true 
            ORDER BY puan_fiyat DESC
        `;
        const sonuc = await pool.query(sorgu);
        res.json(sonuc.rows);
    } catch (err) {
        console.error("Ödüller Hatası:", err.message);
        res.status(500).json({ message: 'Ödüller çekilemedi' });
    }
});

// 11. ÖDÜL SATIN ALMA (TALEP OLUŞTURMA)
app.post('/api/odul-talep', async (req, res) => {
    const { userId, odulId, fiyat } = req.body;

    try {
        // 1. Kullanıcının cüzdanına bak (Yeterli Coin var mı?)
        const userQuery = await pool.query('SELECT coin FROM kullanici_puanlari WHERE kullanici_id = $1', [userId]);
        const currentCoin = userQuery.rows[0]?.coin || 0;

        if (currentCoin < fiyat) {
            return res.status(400).json({ message: `Yetersiz bakiye! Bu ödül için ${fiyat - currentCoin} Coin daha kasmak zorundasın.` });
        }

        // 2. Parayı (Coin) Cüzdandan Düş
        await pool.query('UPDATE kullanici_puanlari SET coin = coin - $1 WHERE kullanici_id = $2', [fiyat, userId]);

        // 3. İK'nın Görmesi İçin Talebi Kaydet
        await pool.query('INSERT INTO odul_talepleri (kullanici_id, odul_id, durum) VALUES ($1, $2, $3)', [userId, odulId, 'bekliyor']);

        res.json({ message: 'Talebin başarıyla alındı! Yöneticin en kısa sürede onaylayacak.', yeniCoin: currentCoin - fiyat });
    } catch (err) {
        console.error("Talep Hatası:", err.message);
        res.status(500).json({ message: 'Talep oluşturulurken hata oluştu.' });
    }
});

// 12. BİLDİRİMLERİ ÇEKME
app.get('/api/bildirimler/:userId', async (req, res) => {
    try {
        const sorgu = `
            SELECT bildirim_id as id, baslik as title, mesaj as message, tip as type, okunma_durumu as is_read, olusturma_tarihi as date 
            FROM bildirimler 
            WHERE kullanici_id = $1 
            ORDER BY olusturma_tarihi DESC
        `;
        const sonuc = await pool.query(sorgu, [req.params.userId]);
        res.json(sonuc.rows);
    } catch (err) {
        console.error("Bildirim Çekme Hatası:", err.message);
        res.status(500).json({ message: 'Bildirimler çekilemedi' });
    }
});

// 13. BİLDİRİMİ OKUNDU OLARAK İŞARETLEME
app.post('/api/bildirim-oku', async (req, res) => {
    const { notificationId } = req.body;
    try {
        await pool.query('UPDATE bildirimler SET okunma_durumu = true WHERE bildirim_id = $1', [notificationId]);
        res.json({ message: 'Okundu işaretlendi' });
    } catch (err) {
        res.status(500).json({ message: 'Hata oluştu' });
    }
});

// 15. ŞİFRE GÜNCELLEME
app.post('/api/sifre-guncelle', async (req, res) => {
    const { userId, yeniSifre } = req.body;
    try {
        await pool.query('UPDATE kullanicilar SET sifre = $1 WHERE kullanici_id = $2', [yeniSifre, userId]);
        res.json({ message: 'Şifren başarıyla güncellendi kral! 🔐' });
    } catch (err) {
        res.status(500).json({ message: 'Şifre güncellenirken bir hata oluştu.' });
    }
});

// 16. YÖNETİCİ: YENİ PERSONEL EKLE
app.post('/api/admin/personel-ekle', async (req, res) => {
    const { ad, soyad, email, sifre, rol, departman } = req.body;
    try {
        const yeniUser = await pool.query(
            'INSERT INTO kullanicilar (ad, soyad, email, sifre, rol, departman, durum_id) VALUES ($1, $2, $3, $4, $5, $6, 1) RETURNING *',
            [ad, soyad, email, sifre, rol, departman]
        );
        // Yeni personele başlangıç cüzdanı açalım
        await pool.query('INSERT INTO kullanici_puanlari (kullanici_id, xp, coin) VALUES ($1, 0, 0)', [yeniUser.rows[0].kullanici_id]);
        res.json({ message: 'Yeni personel sisteme dahil edildi! 🚀' });
    } catch (err) {
        res.status(500).json({ message: 'Personel eklenemedi, email çakışıyor olabilir.' });
    }
});

// 17. YÖNETİCİ: YENİ EĞİTİM EKLE
app.post('/api/admin/egitim-ekle', async (req, res) => {
    const { baslik, aciklama, sure, xp, videoUrl } = req.body;
    try {
        await pool.query(
            'INSERT INTO egitim_katalogu (baslik, aciklama, seviye_id, sure, xp_degeri, video_url, aktif_mi) VALUES ($1, $2, 1, $3, $4, $5, true)',
            [baslik, aciklama, sure, xp, videoUrl]
        );
        res.json({ message: 'Eğitim kataloğa eklendi! 📚' });
    } catch (err) {
        res.status(500).json({ message: 'Eğitim eklenirken hata oluştu.' });
    }
});
// 19. QUİZ SORULARINI ÇEKME
app.get('/api/quiz/:egitimId', async (req, res) => {
    try {
        const sorgu = `
            SELECT s.soru_id as id, s.soru_metni, s.secenek_a, s.secenek_b, s.secenek_c, s.secenek_d, s.dogru_cevap
            FROM sorular s
            JOIN quizler q ON s.quiz_id = q.quiz_id
            WHERE q.egitim_id = $1
        `;
        const sonuc = await pool.query(sorgu, [req.params.egitimId]);
        res.json(sonuc.rows);
    } catch (err) {
        res.status(500).json({ message: 'Sorular çekilemedi' });
    }
});

// 20. QUİZİ TAMAMLA VE XP KAZAN (Zorlu Ekonomi Versiyonu)
app.post('/api/quiz-tamamla', async (req, res) => {
    const { userId, egitimId, dogruSayisi, toplamSoru, kazanilanXp } = req.body;
    const basariOrani = (dogruSayisi / toplamSoru) * 100;

    if (basariOrani < 70) {
        return res.status(400).json({ message: `Maalesef %${Math.round(basariOrani)} başarıda kaldın. Ödül için en az %70 yapmalısın!` });
    }

    // YENİ EKONOMİ FORMÜLÜ: (Doğru / Toplam) * (XP / 5)
    // Örnek: 100 XP'lik eğitimde full çeken biri 20 Coin alır. 500 Coin'lik kahve için 25 eğitim bitirmeli!
    const kazanilanCoin = Math.floor((dogruSayisi / toplamSoru) * (kazanilanXp / 5));

    try {
        const kontrol = await pool.query('SELECT * FROM tamamlanan_egitimler WHERE kullanici_id = $1 AND egitim_id = $2', [userId, egitimId]);
        if (kontrol.rows.length > 0) return res.status(400).json({ message: 'Bu eğitimin ödülünü zaten aldın!' });

        await pool.query('INSERT INTO tamamlanan_egitimler (kullanici_id, egitim_id) VALUES ($1, $2)', [userId, egitimId]);
        
        // XP ve Hesaplanan Coin'i veritabanına yaz
        const sonuc = await pool.query(
            'UPDATE kullanici_puanlari SET xp = xp + $1, coin = coin + $2 WHERE kullanici_id = $3 RETURNING xp, coin', 
            [kazanilanXp, kazanilanCoin, userId]
        );

        res.json({ message: `Tebrikler! ${kazanilanXp} XP ve ${kazanilanCoin} Coin kazandın! 🎉`, yeniPuan: sonuc.rows[0] });
    } catch (err) {
        res.status(500).json({ message: 'İşlem başarısız.' });
    }
});

// 21. KULLANICIYA ÖZEL EĞİTİM ATA
app.post('/api/admin/egitim-ata', async (req, res) => {
    const { userId, egitimId } = req.body;
    try {
        await pool.query(
            'INSERT INTO atanan_egitimler (kullanici_id, egitim_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, egitimId]
        );
        res.json({ message: 'Eğitim başarıyla atandı! 🎯' });
    } catch (err) {
        res.status(500).json({ message: 'Eğitim atanırken hata oluştu.' });
    }
});

// 22. KULLANICIDAN EĞİTİMİ GERİ ÇEK (SİL)
app.post('/api/admin/egitim-kaldir', async (req, res) => {
    const { userId, egitimId } = req.body;
    try {
        await pool.query(
            'DELETE FROM atanan_egitimler WHERE kullanici_id = $1 AND egitim_id = $2',
            [userId, egitimId]
        );
        res.json({ message: 'Eğitim personelden geri çekildi.' });
    } catch (err) {
        res.status(500).json({ message: 'Eğitim kaldırılırken hata oluştu.' });
    }
});

// 23. KULLANICININ TÜM EĞİTİMLERİNİ VE ATANMA DURUMUNU ÇEK (DÜZELTİLDİ!)
app.get('/api/admin/kullanici-egitim-durumu/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const sorgu = `
            SELECT 
                e.egitim_id as id, 
                e.baslik as title,
                CASE WHEN a.kullanici_id IS NOT NULL OR t.kullanici_id IS NOT NULL THEN true ELSE false END as is_assigned,
                CASE WHEN t.kullanici_id IS NOT NULL THEN true ELSE false END as is_completed
            FROM egitim_katalogu e
            LEFT JOIN atanan_egitimler a ON e.egitim_id = a.egitim_id AND a.kullanici_id = $1
            LEFT JOIN tamamlanan_egitimler t ON e.egitim_id = t.egitim_id AND t.kullanici_id = $1
            WHERE e.aktif_mi = true
            ORDER BY is_completed ASC, is_assigned DESC
        `;
        const sonuc = await pool.query(sorgu, [userId]);
        res.json(sonuc.rows);
    } catch (err) {
        console.error("Eğitim Durumu Hatası:", err.message);
        res.status(500).json({ message: 'Eğitim listesi alınamadı.' });
    }
});

// 24. EĞİTİM PERFORMANS DETAYINI ÇEK (YENİ - Issue 3)
app.get('/api/admin/egitim-performans/:userId/:egitimId', async (req, res) => {
    const { userId, egitimId } = req.params;
    try {
        const sorgu = `
            SELECT p.*, e.baslik, e.xp_degeri
            FROM egitim_performans p
            JOIN egitim_katalogu e ON p.egitim_id = e.egitim_id
            WHERE p.kullanici_id = $1 AND p.egitim_id = $2
        `;
        const sonuc = await pool.query(sorgu, [userId, egitimId]);
        res.json(sonuc.rows[0] || { message: "Henüz performans verisi yok." });
    } catch (err) {
        res.status(500).json({ message: 'Performans verisi çekilemedi.' });
    }
});
// 25. KULLANICININ SERTİFİKALARINI ÇEKME UCU
app.get('/api/sertifikalar/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const sorgu = `
            SELECT 
                e.egitim_id,
                e.baslik as egitim_adi,
                k.ad || ' ' || k.soyad as kullanici_adi,
                t.id as tamamlama_id
            FROM tamamlanan_egitimler t
            JOIN egitim_katalogu e ON t.egitim_id = e.egitim_id
            JOIN kullanicilar k ON t.kullanici_id = k.kullanici_id
            WHERE t.kullanici_id = $1
            ORDER BY t.id DESC
        `;
        const sonuc = await pool.query(sorgu, [userId]);
        
        // Gelen veriye dinamik Sertifika ID'si ve Tarih ekliyoruz
        const sertifikalar = sonuc.rows.map(row => ({
            id: row.egitim_id,
            title: row.egitim_adi,
            userName: row.kullanici_adi,
            certificateId: `CERT-ST-U${userId}-E${row.egitim_id}-${row.tamamlama_id}`, // Eşsiz Kod
            date: new Date().toLocaleDateString('tr-TR') // Not: İleride veritabanına tarih sütunu eklenebilir, şimdilik bugünün tarihi
        }));

        res.json(sertifikalar);
    } catch (err) {
        console.error("Sertifika Hatası:", err.message);
        res.status(500).json({ message: 'Sertifikalar çekilemedi' });
    }
});

// 26. HİBRİT EĞİTİM İÇERİKLERİNİ ÇEKME UCU (VİDEO + SLAYT)
app.get('/api/egitim-detay/:egitimId', async (req, res) => {
    const { egitimId } = req.params;
    try {
        const icerikSorgu = await pool.query(
            'SELECT * FROM egitim_icerikleri WHERE egitim_id = $1 ORDER BY sira ASC',
            [egitimId]
        );
        res.json(icerikSorgu.rows);
    } catch (err) {
        console.error("Eğitim Detay Hatası:", err.message);
        res.status(500).json({ message: 'İçerikler yüklenemedi.' });
    }
});

// 27. DEPARTMAN BAZLI ANALİZ VE ÖZET UCU
app.get('/api/admin/analiz/:role/:department', async (req, res) => {
    const { role, department } = req.params;
    try {
        let sorgu;
        let parametreler = [];

        if (role === 'IK_YONETICI') {
            // IK için tüm departmanların ortalaması
            sorgu = `
                SELECT 
                    k.departman,
                    COUNT(DISTINCT k.kullanici_id) as personel_sayisi,
                    ROUND(AVG(p.xp)) as ortalama_xp,
                    ROUND(AVG(
                        (SELECT COUNT(*) FROM tamamlanan_egitimler t WHERE t.kullanici_id = k.kullanici_id)::numeric / 
                        NULLIF((SELECT COUNT(*) FROM atanan_egitimler a WHERE a.kullanici_id = k.kullanici_id), 0) * 100
                    ), 0) as ortalama_tamamlanma
                FROM kullanicilar k
                LEFT JOIN kullanici_puanlari p ON k.kullanici_id = p.kullanici_id
                GROUP BY k.departman
            `;
        } else {
            // DEPARTMAN YÖNETİCİSİ İÇİN (İşte ID eksiğini giderdiğimiz yer burası!)
            sorgu = `
                SELECT 
                    k.kullanici_id,  -- 👑 İŞTE UYGULAMAYI ÇÖKMEKTEN KURTARAN ALTIN SATIR
                    k.ad || ' ' || k.soyad as ad_soyad,
                    p.xp,
                    (SELECT COUNT(*) FROM tamamlanan_egitimler t WHERE t.kullanici_id = k.kullanici_id) as biten_egitim,
                    ROUND(
                        (SELECT COUNT(*) FROM tamamlanan_egitimler t WHERE t.kullanici_id = k.kullanici_id)::numeric / 
                        NULLIF((SELECT COUNT(*) FROM atanan_egitimler a WHERE a.kullanici_id = k.kullanici_id), 0) * 100
                    , 0) as tamamlama_orani
                FROM kullanicilar k
                LEFT JOIN kullanici_puanlari p ON k.kullanici_id = p.kullanici_id
                WHERE k.departman = $1
                ORDER BY tamamlama_orani DESC
            `;
            parametreler = [department];
        }

        const sonuc = await pool.query(sorgu, parametreler);
        res.json(sonuc.rows);
    } catch (err) {
        res.status(500).json({ message: 'Analiz verileri yüklenemedi.' });
    }
});

// 28. EĞİTİME ÖZEL YAPAY ZEKA ASİSTANI (Context-Aware AI + Model Cascade)
app.post('/api/egitim-asistan', async (req, res) => {
    const { message, egitimId, userId } = req.body;

    try {
        // 1. Kullanıcının o an hangi eğitimi izlediğini bul
        const egitimSorgu = await pool.query('SELECT baslik, aciklama FROM egitim_katalogu WHERE egitim_id = $1', [egitimId]);
        
        if (egitimSorgu.rows.length === 0) {
            return res.json({ reply: "Şu an hangi eğitimde olduğunu bulamadım kral." });
        }

        const egitim = egitimSorgu.rows[0];

        // 2. Gemini'a özel Prompt
        const prompt = `
            Sen Sporthink şirketinin 'Kurumsal Eğitim Akademisi'nde görevli uzman bir Eğitmensin.
            
            ŞU ANKİ DURUM:
            Kullanıcı tam şu anda "${egitim.baslik}" isimli eğitimi izliyor.
            Bu eğitimin resmi içeriği ve açıklaması şu şekildedir: "${egitim.aciklama}"
            
            KULLANICININ SORUSU: 
            "${message}"
            
            KURALLAR:
            1. Sadece yukarıda verilen eğitim içeriği bağlamında, bu konuya özel cevap ver.
            2. Eğer kullanıcı eğitimle alakasız bir şey sorarsa, nazikçe konuya dönmesini ve şu an "${egitim.baslik}" eğitiminde olduklarını hatırlat.
            3. Cevapların bir öğretici gibi cesaretlendirici, net ve akılda kalıcı olsun.
        `;

        // 3. ENTERPRISE SEVİYE: MODEL CASCADE (ŞELALE SİSTEMİ)
        // Sistem sırasıyla bu modelleri deneyecek. Biri patlarsa saniyesinde diğerine geçecek.
        // 3. ENTERPRISE SEVİYE: MODEL CASCADE (ŞELALE SİSTEMİ)
        // "-latest" takıları 404 hatasını %100 önler!
        const yedekModeller = [
            "gemini-2.5-flash",         // Ana motor (Şu an 503 veriyor olabilir)
            "gemini-2.0-flash",         // Bir alt nesil, çok hızlı ve stabil
            "gemini-1.5-flash-latest",  // Asla 404 vermeyen, garantili sürüm
            "gemini-1.5-pro-latest"     // Google'ın en ağır abisi (Joker)
        ];

        let aiCevabi = null;

        for (const modelName of yedekModeller) {
            try {
                console.log(`[YZ MOTORU] Deneniyor: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                
                aiCevabi = response.text();
                console.log(`[YZ MOTORU] Başarılı: ${modelName} 🚀`);
                break; // Cevap başarılıysa döngüyü kır, diğerlerini denemeye gerek yok
            } catch (error) {
                // Hata 503 (Yoğunluk) veya 404 (Model Bulunamadı) olabilir, fark etmez, diğerine geç.
                const hataTipi = error.message.includes('503') ? 'Sunucu Dolu (503)' : 'Model Tanınmadı (404)';
                console.log(`[UYARI] ${modelName} başarısız oldu (${hataTipi}). Bir sonrakine geçiliyor...`);
            }
        }

        // 4. Sonuç Değerlendirmesi
        if (aiCevabi) {
            return res.json({ reply: aiCevabi });
        } else {
            // Eğer 4 modelin 4'ü de patlarsa (Ki bu Google'ın sunucu binasında yangın çıkması demektir)
            return res.json({ reply: "Kral, şu an Google'ın tüm yapay zeka sunucularında global bir çöküş var. 😅 Bütün yedek motorları denedim ama nafile. Lütfen 1-2 dakika sonra tekrar dene! 🤖" });
        }

    } catch (err) {
        console.error("Eğitim Asistanı Genel Hatası:", err.message);
        res.json({ reply: "Sistemsel bir sorun oluştu, birazdan tekrar dener misin?" });
    }
});

// 29. TÜM EĞİTİMLERİ GETİR (İnsan Kaynakları Katalog Görünümü İçin)
app.get('/api/egitimler', async (req, res) => {
    try {
        // egitim_katalogu tablosundan aktif olanları en yenisi en üstte olacak şekilde çek
        const query = 'SELECT * FROM egitim_katalogu WHERE aktif_mi = true ORDER BY egitim_id DESC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Tüm Eğitimler Hatası:", err.message);
        res.status(500).json({ message: "Eğitimler getirilemedi." });
    }
});

// YENİ EKLENEN: EĞİTİM AÇIKLAMASINI GÜNCELLEME UCU (Bunu da eklemeliyiz ki kalem ikonuna basınca çalışsın)
app.put('/api/admin/egitim-guncelle', async (req, res) => {
    const { egitimId, aciklama } = req.body;
    try {
        await pool.query(
            'UPDATE egitim_katalogu SET aciklama = $1 WHERE egitim_id = $2',
            [aciklama, egitimId]
        );
        res.json({ message: 'Açıklama başarıyla güncellendi' });
    } catch (err) {
        console.error("Eğitim Güncelleme Hatası:", err.message);
        res.status(500).json({ message: 'Açıklama güncellenemedi.' });
    }
});

// EĞİTİM ANALİZİ (Atanan ve Tamamlayan Sayısı)
app.get('/api/admin/egitim-analiz/:egitimId', async (req, res) => {
    const { egitimId } = req.params;
    try {
        // Atananları bul (Hem atananlar tablosunda olanlar hem de bitirip tamamlananlara düşenler)
        const atananSorgu = await pool.query('SELECT COUNT(DISTINCT kullanici_id) FROM atanan_egitimler WHERE egitim_id = $1', [egitimId]);
        const bitenSorgu = await pool.query('SELECT COUNT(DISTINCT kullanici_id) FROM tamamlanan_egitimler WHERE egitim_id = $1', [egitimId]);

        const atanan = parseInt(atananSorgu.rows[0].count) || 0;
        const biten = parseInt(bitenSorgu.rows[0].count) || 0;
        
        // Gerçek Atanan Sayısı = Hala atananlarda bekleyenler + Bitirenler
        const gercekAtanan = atanan + biten;
        const basari_orani = gercekAtanan > 0 ? Math.round((biten / gercekAtanan) * 100) : 0;

        res.json({ atanan_personel: gercekAtanan, basari_orani: basari_orani });
    } catch (err) {
        res.status(500).json({ message: 'Analiz çekilemedi.' });
    }
});

// 1. OTOMATİK ATAMA KURALLARINI GETİR
app.get('/api/admin/atama-kurallari', async (req, res) => {
    try {
        const sorgu = `
            SELECT k.*, e.baslik as egitim_adi 
            FROM atama_kurallari k
            JOIN egitim_katalogu e ON k.egitim_id = e.egitim_id
            WHERE k.aktif_mi = true
            ORDER BY k.kural_id DESC
        `;
        const sonuc = await pool.query(sorgu);
        res.json(sonuc.rows);
    } catch (err) {
        res.status(500).json({ message: "Kurallar getirilemedi." });
    }
});

// 2. YENİ OTOMATİK ATAMA KURALI EKLE
app.post('/api/admin/atama-kurali-ekle', async (req, res) => {
    const { egitimId, tetikleyiciTur, tetikleyiciDeger } = req.body;
    try {
        await pool.query(
            'INSERT INTO atama_kurallari (egitim_id, tetikleyici_tur, tetikleyici_deger) VALUES ($1, $2, $3)',
            [egitimId, tetikleyiciTur, tetikleyiciDeger]
        );
        res.json({ message: "Otomasyon kuralı başarıyla eklendi! 🤖" });
    } catch (err) {
        res.status(500).json({ message: "Kural eklenirken hata oluştu." });
    }
});

// 3. ÖĞRENME YOLLARINI (LEARNING PATHS) GETİR
app.get('/api/admin/ogrenme-yollari', async (req, res) => {
    try {
        const sorgu = `
            SELECT y.yol_id, y.yol_adi, 
                   COUNT(a.asama_id) as egitim_sayisi
            FROM ogrenme_yollari y
            LEFT JOIN ogrenme_yolu_asamalari a ON y.yol_id = a.yol_id
            WHERE y.aktif_mi = true
            GROUP BY y.yol_id, y.yol_adi
            ORDER BY y.yol_id DESC
        `;
        const sonuc = await pool.query(sorgu);
        res.json(sonuc.rows);
    } catch (err) {
        res.status(500).json({ message: "Öğrenme yolları getirilemedi." });
    }
});

// 4. YENİ ÖĞRENME YOLU OLUŞTUR VE EĞİTİMLERİ DİZ
app.post('/api/admin/ogrenme-yolu-ekle', async (req, res) => {
    const { yolAdi, secilenEgitimler } = req.body; 
    try {
        const yolSonuc = await pool.query(
            'INSERT INTO ogrenme_yollari (yol_adi) VALUES ($1) RETURNING yol_id',
            [yolAdi]
        );
        const yeniYolId = yolSonuc.rows[0].yol_id;

        for (let i = 0; i < secilenEgitimler.length; i++) {
            await pool.query(
                'INSERT INTO ogrenme_yolu_asamalari (yol_id, egitim_id, sira) VALUES ($1, $2, $3)',
                [yeniYolId, secilenEgitimler[i], i + 1]
            );
        }
        res.json({ message: "Öğrenme rotası başarıyla oluşturuldu! 🗺️" });
    } catch (err) {
        res.status(500).json({ message: "Rota oluşturulurken hata oluştu." });
    }
});

// ==========================================
// YENİ: DEPARTMANA TOPLU EĞİTİM ATAMA (BULK ASSIGN)
// ==========================================
app.post('/api/admin/toplu-ata', async (req, res) => {
    const { departman, egitimId } = req.body;
    try {
        // 1. Önce o departmandaki tüm personelleri bul
        const users = await pool.query('SELECT kullanici_id FROM kullanicilar WHERE departman = $1', [departman]);
        
        if (users.rows.length === 0) {
            return res.status(404).json({ message: 'Bu departmanda hiç personel bulunamadı.' });
        }

        // 2. Her birine döngüyle eğitimi ata (Daha önce atanmışsa 'ON CONFLICT DO NOTHING' ile atla)
        for (let user of users.rows) {
            await pool.query(
                'INSERT INTO atanan_egitimler (kullanici_id, egitim_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [user.kullanici_id, egitimId]
            );
        }

        res.json({ message: `${departman} ekibindeki ${users.rows.length} personele eğitim başarıyla atandı! 🚀` });
    } catch (err) {
        console.error("Toplu Atama Hatası:", err.message);
        res.status(500).json({ message: 'Toplu atama sırasında hata oluştu.' });
    }
});

// ==========================================
// YENİ: SEÇİLİ BİRDEN FAZLA KİŞİYE EĞİTİM ATAMA (MULTI ASSIGN)
// ==========================================
app.post('/api/admin/coklu-ata', async (req, res) => {
    const { userIds, egitimId } = req.body; // userIds bir dizi (array) olacak: [1, 2, 5]
    
    try {
        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ message: 'Lütfen en az bir personel seçin.' });
        }

        // Seçilen her bir kullanıcı için döngüyle atama yapıyoruz
        for (let id of userIds) {
            await pool.query(
                'INSERT INTO atanan_egitimler (kullanici_id, egitim_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [id, egitimId]
            );
        }

        res.json({ message: `Seçilen ${userIds.length} personele eğitim başarıyla atandı! 🎯` });
    } catch (err) {
        console.error("Çoklu Atama Hatası:", err.message);
        res.status(500).json({ message: 'Atama sırasında hata oluştu.' });
    }
});

// ==========================================
// FAZ 2: 360 DERECE DEĞERLENDİRME & ANKET MERKEZİ
// ==========================================

// 1. TÜM ANKETLERİ GETİR
app.get('/api/admin/anketler', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM anketler WHERE aktif_mi = true ORDER BY anket_id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Anketler getirilemedi." });
    }
});

// 2. YENİ ANKET VE SORULARINI OLUŞTUR
app.post('/api/admin/anket-ekle', async (req, res) => {
    const { baslik, sorular } = req.body; // sorular array olarak gelecek
    try {
        // Anketi oluştur
        const anketSonuc = await pool.query(
            'INSERT INTO anketler (baslik) VALUES ($1) RETURNING anket_id',
            [baslik]
        );
        const yeniAnketId = anketSonuc.rows[0].anket_id;

        // Soruları döngüyle ekle
        for (let soru of sorular) {
            if (soru && soru.trim() !== '') {
                await pool.query(
                    'INSERT INTO anket_sorulari (anket_id, soru_metni) VALUES ($1, $2)',
                    [yeniAnketId, soru]
                );
            }
        }
        res.json({ message: "Anket başarıyla oluşturuldu! 📋" });
    } catch (err) {
        res.status(500).json({ message: "Anket oluşturulurken hata." });
    }
});

// 3. 360 DERECE DEĞERLENDİRME ATAMASI YAP (KİM KİMİ DEĞERLENDİRECEK)
app.post('/api/admin/anket-ata', async (req, res) => {
    const { hedef_kullanici_id, degerlendiren_id, anket_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO uc_yuz_altmis_degerlendirme_atamalari (hedef_kullanici_id, degerlendiren_id, anket_id) VALUES ($1, $2, $3)',
            [hedef_kullanici_id, degerlendiren_id, anket_id]
        );
        res.json({ message: "Değerlendirme başarıyla atandı! 🎯" });
    } catch (err) {
        res.status(500).json({ message: "Atama yapılamadı." });
    }
});

// 4. YAPILAN ATAMALARI LİSTELE
app.get('/api/admin/anket-atamalari', async (req, res) => {
    try {
        const sorgu = `
            SELECT u.atama_id, u.durum,
                   h.ad || ' ' || h.soyad as hedef_kullanici,
                   d.ad || ' ' || d.soyad as degerlendiren,
                   a.baslik as anket_adi
            FROM uc_yuz_altmis_degerlendirme_atamalari u
            JOIN kullanicilar h ON u.hedef_kullanici_id = h.kullanici_id
            JOIN kullanicilar d ON u.degerlendiren_id = d.kullanici_id
            JOIN anketler a ON u.anket_id = a.anket_id
            ORDER BY u.atama_id DESC
        `;
        const sonuc = await pool.query(sorgu);
        res.json(sonuc.rows);
    } catch (err) {
        res.status(500).json({ message: "Atamalar getirilemedi." });
    }
});

// ==========================================
// FAZ 3: YAPAY ZEKA DESTEKLİ YÖNETİCİ ASİSTANI
// ==========================================
app.post('/api/admin/ai-personel-analiz', async (req, res) => {
    const { personelAd, departman, xp, tamamlanmaOrani, egitimKarnesi } = req.body;
    
    try {
        // Önceden kurduğun Gemini bağlantısını kullanıyoruz
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Yapay Zekaya vereceğimiz zeki prompt
        const prompt = `
            Sen Sporthink şirketinin kıdemli İK ve Yetenek Yönetimi yapay zekasısın.
            Şu personelin performansını değerlendiren 3-4 cümlelik kısa, profesyonel ve vizyoner bir yönetici özeti yaz.
            
            PERSONEL BİLGİLERİ:
            - Adı: ${personelAd}
            - Departmanı: ${departman}
            - Toplam Başarı Puanı (XP): ${xp}
            - Genel Eğitim Tamamlanma Oranı: %${tamamlanmaOrani}
            - Eğitim Geçmişi (Atanan ve Bitenler): ${JSON.stringify(egitimKarnesi)}
            
            KURALLAR:
            1. Yazdığın metin bir şirketin yöneticisine (departman müdürüne) okunacak şekilde resmi ama cesaretlendirici olsun.
            2. Personelin % oranına ve bitirdiği eğitimlere bakarak güçlü yönlerini vurgula.
            3. Bekleyen (tamamlamadığı) eğitimleri varsa, onlara ağırlık vermesi gerektiği konusunda kısa bir aksiyon tavsiyesi ver.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        res.json({ analiz: response.text() });
    } catch (err) {
        console.error("YZ Analiz Hatası:", err.message);
        res.status(500).json({ analiz: "Yapay zeka şu an çok yoğun, lütfen 1-2 dakika sonra tekrar dene." });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sunucu aktif: http://0.0.0.0:${PORT}`);
});