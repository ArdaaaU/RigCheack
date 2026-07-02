# ⚡ RigCheck

**Hardware Compatibility & Support Platform**

RigCheck, bilgisayar toplamak isteyen veya teknik donanım sorunu yaşayan kullanıcıları uzmanlarla buluşturan, sistem uyumluluğunu kontrol edip hata kodlarını (BSOD/POST) anında çözen kapsamlı ve modern bir web platformudur. 

## ✨ Temel Özellikler (Features)

* **🔧 PC Builder Simülatörü:** Sürükle-bırak mantığıyla çalışan arayüz sayesinde kullanıcılar; uyumlu soket tiplerini, güç kaynağı (PSU) gereksinimlerini ve potansiyel darboğazları anında görebilir.
* **💬 Canlı Destek (Live Hotline):** Kullanıcıların donanım sorunlarını uzmanlara (Expert) sorabildiği, hata fotoğraflarını ve sistem özelliklerini paylaşabildiği gerçek zamanlı destek sistemi.
* **📊 Benchmark Kütüphanesi:** Popüler oyunlarda hangi işlemci ve ekran kartı kombinasyonunun kaç FPS vereceğini gösteren, topluluk destekli veri bankası.
* **🔴 Hata Kodu Sözlüğü (Error Dictionary):** Anakart üzerindeki "Debug LED" ışıkları, BIOS bip sesleri veya Windows Mavi Ekran (BSOD) hata kodlarının nedenleri ve adım adım çözüm yolları.

## 🚀 Kullanılan Teknolojiler (Tech Stack)

* **Frontend:** HTML5, CSS3, JavaScript (ES6+ Modüler Yapı)
* **Backend & Veritabanı:** Supabase (BaaS)
* **Tasarım Mimarisi:** CSS Değişkenleri (Custom Properties) ile yönetilen modern renk paleti, tamamen Responsive (Mobil Uyumlu) tasarım ve etkileşimli UI bileşenleri.

## 📂 Dosya Yapısı

```text
RigCheck/
├── index.html          # Ana sayfa ve özet dashboard
├── builder.html        # PC Builder ve uyumluluk modülü
├── support.html        # Uzmanlarla mesajlaşma arayüzü
├── benchmarks.html     # Oyun ve FPS veri kütüphanesi
├── errors.html         # Hata kodu arama motoru
├── styles.css          # Merkezi CSS (Değişkenler, Flex/Grid yapıları)
└── js/                 
    ├── api.js          # Supabase veritabanı bağlantıları
    ├── builder.js      # Sürükle-bırak mantığı ve uyumluluk algoritmaları
    └── ...
```

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/stackblitz-starters-chcupaj6)
