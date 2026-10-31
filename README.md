# maas-hesaplama

[maas-hesaplama.com](https://maas-hesaplama.com) kaynak kodu. GitHub Pages ile yayınlanır.

## Yapı

- `assets/motor.js` – Hesap motoru ve **tüm yıllık parametreler** (asgari ücret, vergi dilimleri, SGK tavanı, kıdem tavanı). Tarayıcıda ve sayfa üreticide aynı dosya kullanılır.
- `assets/arayuz.js` – Sayfadaki hesaplama araçlarını motora bağlar.
- `assets/style.css` – Ortak stil.
- `_kaynak/build.js` – Tüm HTML sayfalarını, `sitemap.xml` ve `robots.txt` dosyalarını üretir. (`_` ile başlayan klasörler yayınlanmaz.)

## Parametre güncelleme (yeni yıl / yeni dönem)

1. `assets/motor.js` içindeki `P` bloğunu güncelleyin (`yil`, `sonGuncelleme`, `asgariUcret`, `sgkTavan`, `dilimler`, `kidemTavanlari` ...).
2. `_kaynak/build.js` içinde `BUGUN` tarihini güncelleyin. Sayfa adreslerinde yıl geçiyorsa (`/asgari-ucret-2026/` gibi) yeni yıl için adresleri de gözden geçirin.
3. Sayfaları yeniden üretin:

   ```
   node _kaynak/build.js
   ```

4. Değişen dosyaları commit edip `main` dalına gönderin.

Üretilen HTML dosyalarını elle düzenlemeyin; bir sonraki üretimde üzerine yazılır.
