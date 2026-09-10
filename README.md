# tha-makam Mükerrer Parsel ve Toki Satış Analizi

Bu proje, tescil harici alanlar (THA) ile mükerrer parsellerin coğrafi analizlerini yapmak, kesişim alanlarını (intersection) hesaplamak ve Toki Satış kayıtlarını harita üzerinde interaktif olarak görüntülemek amacıyla geliştirilmiştir.

<div align="center">
  <br/>
    <a href="https://cbstkgm.github.io/tha-makam/">
    <img src="https://img.shields.io/badge/🚀_Canlı_Demo-Görüntüle-2563eb?style=for-the-badge&logo=react" alt="Demo Butonu" />
  </a>
  <br/><br/>
</div>

## Özellikler

- **Katman (Layer) Kontrolü:** Tescilli THA, Mükerrer Parsel ve kesişim alanlarının harita üzerinden kolaylıkla açılıp kapatılabilmesi.
- **Kesişim Hesaplamaları:** Geometrik wkt verilerinden anlık kesişim (intersection) alanı hesaplanması ve harita üzerinde taralı (hatch) desenle belirginleştirilmesi.
- **Toki Satış Entegrasyonu:** Toki parsellerinin coğrafi sınırlarının haritada gösterimi, sağ üst köşeye hizalanmış interaktif detay kartlarıyla bedel (Satış/Muhammen) verilerinin para birimi (₺) formatında vurgulu gösterimi.
- **İnteraktif Veri Tablosu:** Yüklenen verilerin listelenmesi, hızlı arama, gelişmiş CSV ayrıştırması, ve tıklanan parsele anında odaklanma (zoom) imkanı.
- **Akıllı Sıralama:** Listeler yüklendiğinde varsayılan olarak Türkçe karakter duyarlılığı ile `İl -> İlçe -> Mahalle -> Ada No -> Parsel No` sırasına göre listelenme yeteneği.
- **Özelleştirilebilir Harita Görünümü:** Esnek (genişletilebilir) harita paneli ve farklı altlık harita seçenekleri (Google, Yandex, OSM).

## Geliştirme ve Kurulum

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz:

```bash
# Repoyu klonlayın
# Proje dizinine gidin ve bağımlılıkları yükleyin:
npm install

# Geliştirme (dev) sunucusunu başlatın:
npm run dev
```

> **Not:** Demo linki projeye aittir. Sistem `public` klasörü altındaki verileri asenkron olarak okuyarak haritaya işler.


Nasıl Kullanacaksınız?

tha-makam reposu için build alıp yayınlayacağınız zaman terminale "npm run build:makam" yazmalısınız.
tha-kontrol reposu için build alıp yayınlayacağınız zaman terminale "npm run build:kontrol" yazmalısınız.

npm run build:makam
npm run build:kontrol

yada bu aşağıdaki kodu terminalde çalıştırman yeterli

npm run publish:all
