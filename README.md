# Flashcard Hero - Yerel Kurulum Kılavuzu

Bu uygulama, Google AI Studio kullanılarak geliştirilmiş, AI destekli ve oyunlaştırma odaklı bir kelime öğrenme uygulamasıdır.

## Gereksinimler

- **Node.js** (v18 veya üzeri önerilir)
- **NPM** (Node.js ile birlikte gelir)

## Kurulum Adımları

1.  **Projeyi İndirin:**
    Google AI Studio üzerinden "Project Settings" veya "Export" seçeneklerini kullanarak projenin ZIP dosyasını indirin ve bir klasöre çıkartın.

2.  **Bağımlılıkları Yükleyin:**
    Terminalinizi açın, proje klasörüne gidin ve şu komutu çalıştırın:
    ```bash
    npm install
    ```

3.  **Çevresel Değişkenleri Ayarlayın:**
    Proje kök dizininde `.env` isimli bir dosya oluşturun ve içine Gemini API anahtarınızı ekleyin:
    ```env
    GEMINI_API_KEY="BURAYA_GEMINI_API_ANAHTARINIZI_YAZIN"
    ```
    *(API anahtarınızı [Google AI Studio](https://aistudio.google.com/app/apikey) üzerinden alabilirsiniz.)*

4.  **Uygulamayı Başlatın:**
    Şu komutla geliştirme sunucusunu çalıştırın:
    ```bash
    npm run dev
    ```

5.  **Tarayıcıda Açın:**
    Terminalde belirtilen adresi (genellikle `http://localhost:3000`) tarayıcınızda açın.

## Firebase Notu
Uygulama, AI Studio tarafından otomatik olarak oluşturulan bir Firebase projesine bağlıdır (`firebase-applet-config.json` dosyası içinde tanımlıdır). Yerel ortamda çalışırken de bu veritabanını kullanmaya devam edecektir. 

Google ile giriş yapma (Google Auth) özelliğinin yerel ortamda (`localhost`) çalışması için Firebase konsolu üzerinden yetkilendirilmiş alan adlarına `localhost` eklenmiş olmalıdır. AI Studio bunu genellikle sizin için yapar, ancak sorun yaşarsanız Firebase konsolunuzu kontrol edin.

---

**İyi çalışmalar!**
