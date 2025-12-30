# 🌀 Portal Breaker

Modern bir blok kırma oyunu. React, TypeScript ve HTML5 Canvas ile geliştirilmiş, 50 seviyeli, portal mekanikli ve zengin özellikli bir oyun deneyimi.

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.1-blue)
![React](https://img.shields.io/badge/React-19.2.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

## ✨ Özellikler

### 🎮 Oyun Mekanikleri

- **50 Procedural Seviye**: Her seviye dinamik olarak oluşturulur, zorluk seviyesi artar
- **Portal Sistemi**: Portallar topu yukarı teleport eder, stratejik oyun deneyimi sunar
- **Çoklu Top (Multiball)**: Power-up ile aynı anda birden fazla top kontrol edin
- **Ateş Etme Sistemi**: Paddle'dan sürekli ateş ederek blokları yok edin
- **Hızlı Ateş (Rapid Fire)**: Power-up ile süper hızlı ateş modu
- **Combo Sistemi**: Ardışık blok kırma ile yüksek puanlar kazanın
- **3 Can Sistemi**: Her seviyede 3 can hakkı

### 🎨 Görsel ve Ses

- **Particle Efektleri**: Her skin için özel partikül efektleri
  - Ateş, Neon, Buz, Altın, Karanlık Madde temaları
  - Blok kırılma animasyonları ve parçacık sistemleri
- **Skin Sistemi**: 
  - 5 farklı paddle skin (Kızıl Muhafız, Siber Neon, Altın Kral, Buzul Devi, Karanlık Madde)
  - 5 farklı top skin (Alev Topu, Plazma Topu, Kristal Top, Asit Topu, Hayalet Küre)
- **Web Audio API**: Gerçek zamanlı ses efektleri
- **Modern UI**: Tailwind CSS ile tasarlanmış, responsive arayüz

### 🛒 İlerleme Sistemi

- **Para Sistemi**: Seviyeleri tamamlayarak para kazanın
- **Mağaza**: 
  - Paddle ve top skinleri satın alın
  - Paddle genişliği yükseltmeleri
  - Top hızı yükseltmeleri
- **Yıldız Sistemi**: Her seviye için 1-3 yıldız kazanın
- **Seviye Kilidi**: Seviyeler sırayla açılır
- **Kalıcı Kayıt**: Tüm ilerleme localStorage'da saklanır

### 🎯 Blok Tipleri

- **Normal Bloklar**: Standart bloklar, 1-3 HP
- **Sert Bloklar**: Daha fazla HP'ye sahip zorlu bloklar
- **Patlayıcı Bloklar**: Özel efektli bloklar
- **Portal Bloklar**: Topu yukarı teleport eden özel bloklar

## 🚀 Kurulum

### Gereksinimler

- Node.js (v18 veya üzeri önerilir)
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın:**
   ```bash
   git clone <repository-url>
   cd portal-breaker
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Geliştirme sunucusunu başlatın:**
   ```bash
   npm run dev
   ```

4. **Tarayıcınızda açın:**
   ```
   http://localhost:3000
   ```

### Production Build

```bash
npm run build
npm run preview
```

## 📁 Proje Yapısı

```
portal-breaker/
├── components/          # React bileşenleri
│   └── Button.tsx      # Yeniden kullanılabilir buton bileşeni
├── scenes/             # Oyun sahneleri
│   ├── MenuScene.tsx   # Ana menü
│   ├── LevelSelectScene.tsx  # Seviye seçim ekranı
│   ├── GameScene.tsx   # Ana oyun sahnesi (Canvas)
│   └── ShopScene.tsx   # Mağaza ekranı
├── utils/              # Yardımcı fonksiyonlar
│   ├── levelGenerator.ts  # Seviye oluşturma algoritması
│   └── audio.ts        # Ses yönetimi
├── constants.ts        # Oyun sabitleri ve konfigürasyonlar
├── types.ts            # TypeScript tip tanımları
├── App.tsx             # Ana uygulama bileşeni
├── index.tsx           # Giriş noktası
└── vite.config.ts      # Vite konfigürasyonu
```

## 🎮 Nasıl Oynanır

### Temel Kontroller

- **Fare Hareketi**: Paddle'ı hareket ettirir
- **Sol Tık**: Topu başlatır / Sürekli ateş eder
- **Çıkış Butonu**: Oyunu bırakıp menüye döner

### Oyun Stratejisi

1. **Topu Başlatın**: İlk tıklamada top paddle'dan ayrılır
2. **Blokları Kırın**: Top veya ateş ile blokları yok edin
3. **Portalları Kullanın**: Portal blokları topu yukarı teleport eder
4. **Power-up'ları Toplayın**: Düşen power-up'ları yakalayın
   - **Multiball**: 2 ekstra top
   - **Rapid Fire**: Süper hızlı ateş modu
5. **Combo Yapın**: Ardışık blok kırarak yüksek puanlar kazanın

### İlerleme İpuçları

- Her seviyeyi tamamlayarak 100 para kazanın
- Mağazadan skin ve yükseltmeler satın alın
- Paddle genişliğini artırarak oyunu kolaylaştırın
- Top hızını artırarak daha hızlı oynayın

## 🛠️ Teknolojiler

- **React 19.2.3**: UI framework
- **TypeScript 5.8.2**: Tip güvenliği
- **Vite 6.2.0**: Build tool ve dev server
- **HTML5 Canvas**: Oyun render'ı
- **Tailwind CSS**: Styling
- **Web Audio API**: Ses efektleri

## 📝 Geliştirme Notları

### Seviye Oluşturma

Seviyeler `levelGenerator.ts` dosyasında procedural olarak oluşturulur:
- Grid boyutu seviye numarasına göre ölçeklenir
- 4 farklı pattern tipi (Standard, Checkerboard, Columns, Pyramid)
- Blok HP'si seviye ile artar
- Portal bloklar en alttaki bloklardan seçilir

### Performans

- Canvas rendering optimize edilmiştir
- Particle sistemleri frame bazlı throttling kullanır
- State yönetimi React hooks ve refs ile optimize edilmiştir

### Kayıt Sistemi

Oyun ilerlemesi `localStorage`'da `blockBreakerSave` anahtarı altında saklanır:
- Para miktarı
- Açılan seviyeler
- Yıldız puanları
- Satın alınan itemler
- Kuşanılan skinler

## 🎯 Gelecek Özellikler

- [ ] Müzik sistemi
- [ ] Daha fazla power-up çeşidi
- [ ] Leaderboard sistemi
- [ ] Özel seviye editörü
- [ ] Mobil dokunmatik kontroller
- [ ] Daha fazla skin ve yükseltme

## 📄 Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

## 👨‍💻 Geliştirici

Bu proje modern web teknolojileri kullanılarak geliştirilmiştir.

---

**Not**: Bu oyun eğitim ve eğlence amaçlıdır. Keyifli oyunlar! 🎮✨
# portal-breaker
