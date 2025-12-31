# Görseller Klasörü

Bu klasörde oyunda kullanılacak paddle ve top görselleri bulunur.

## 📁 Klasör Yapısı

```
assets/
├── paddles/     # Paddle görselleri
└── balls/       # Top görselleri
```

## 🎨 Paddle Görselleri

`paddles/` klasörüne aşağıdaki isimlerle görseller yerleştirin:

- **default.png** (veya .jpg) - Varsayılan paddle
- **crimson.png** - Kızıl Muhafız skin
- **neon.png** - Siber Neon skin
- **gold.png** - Altın Kral skin
- **ice.png** - Buzul Devi skin
- **void.png** - Karanlık Madde skin

### Önerilen Boyutlar
- Genişlik: 100-200px (oyun içinde ölçeklenecek)
- Yükseklik: 20-40px
- Format: PNG (şeffaflık destekli) veya JPG

## ⚽ Top Görselleri

`balls/` klasörüne aşağıdaki isimlerle görseller yerleştirin:

- **default.png** (veya .jpg) - Varsayılan top
- **fire.png** - Alev Topu skin
- **plasma.png** - Plazma Topu skin
- **ice.png** - Kristal Top skin
- **toxic.png** - Asit Topu skin
- **ghost.png** - Hayalet Küre skin

### Önerilen Boyutlar
- Genişlik: 16-32px (oyun içinde ölçeklenecek)
- Yükseklik: 16-32px
- Format: PNG (şeffaflık destekli) veya JPG

## 📝 Notlar

- Görseller yüklenmezse oyun renk fallback'lerini kullanır
- Görseller otomatik olarak paddle/top boyutlarına ölçeklenir
- Şeffaf arka planlı PNG dosyaları önerilir
- Görseller yüklendikten sonra oyun otomatik olarak kullanır

## 🔄 Görsel Ekleme

1. Görselleri uygun klasöre yerleştirin
2. Dosya isimlerinin doğru olduğundan emin olun
3. Oyunu yeniden başlatın (görseller otomatik yüklenecek)

