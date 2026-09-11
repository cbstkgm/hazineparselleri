# Hazine Parselleri Sistemi

Bu proje, Hazine'ye ait parsellerin (ve tescil harici alanların) coğrafi analizlerini yapmak, özelliklerini detaylı bir şekilde listelemek ve harita üzerinde interaktif olarak görüntülemek amacıyla geliştirilmiştir.

<div align="center">
  <br/>
    <a href="https://cbstkgm.github.io/hazineparselleri/">
    <img src="https://img.shields.io/badge/🚀_Canlı_Demo-Görüntüle-2563eb?style=for-the-badge&logo=react" alt="Demo Butonu" />
  </a>
  <br/><br/>
</div>

## Özellikler

- **Katman (Layer) Kontrolü:** İlgili parsellerin harita üzerinden kolaylıkla açılıp kapatılabilmesi.
- **Kesişim Hesaplamaları:** Geometrik WKT verilerinden anlık alan ve kesişim özelliklerinin hesaplanması ve harita üzerinde taralı (hatch) desenle belirginleştirilmesi.
- **İnteraktif Veri Tablosu:** Yüklenen verilerin listelenmesi, hızlı arama, gelişmiş CSV ayrıştırması ve tıklanan parsele anında odaklanma (zoom) imkanı.
- **Akıllı Sıralama:** Listeler yüklendiğinde varsayılan olarak Türkçe karakter duyarlılığı ile `İl -> İlçe -> Mahalle -> Ada No -> Parsel No` sırasına göre listelenme yeteneği.
- **Özelleştirilebilir Harita Görünümü:** Esnek (genişletilebilir) harita paneli ve farklı altlık harita seçenekleri (Google, Yandex, OSM, Tkgm WMS).
- **Hızlı Veri Erişimi:** Uzak sunucudan asenkron CSV indirme ve coğrafi parse etme özelliği.

## Geliştirme ve Kurulum

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz:

```bash
# Proje dizinine gidin ve bağımlılıkları yükleyin:
npm install

# Geliştirme (dev) sunucusunu başlatın:
npm run dev
```

> **Not:** Canlı Demo GitHub Pages üzerinden çalışmaktadır. Veriler uzak sunucudan asenkron biçimde çekilip haritaya işlenir. Yerel geliştirmede CORS sınırlarını aşmak için projenin proxy (.env) konfigürasyonu aktiftir.

## Yayınlama

Projeyi derlemek ve GitHub Pages üzerinde yayına almak için hazır scriptler bulunur:

```bash
# Sadece derlemek için
npm run build

# GitHub Pages (dist/ dizini) deploy etmek için
npm run deploy

# Yayına alma sürecini tam otomatize etmek için (sh)
npm run publish:all
```
