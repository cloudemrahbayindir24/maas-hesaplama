/*
 * Ekonomi haberlerini RSS kaynaklarından çekip assets/haberler.js dosyasına yazar.
 * Çalıştırma (depo kökünden): node _kaynak/haber-guncelle.js
 * GitHub Actions (.github/workflows/haber-guncelle.yml) bunu gün içinde birkaç kez çalıştırır.
 *
 * Telif: Yalnızca başlık, kısa özet, tarih ve kaynağa bağlantı saklanır; haber metni kopyalanmaz.
 * Kaynak eklemek için KAYNAKLAR listesine RSS adresi ekleyin (yalnızca sitesine eklenmesine izin veren yayıncılar).
 */
const fs = require('fs');
const path = require('path');

const KOK = path.join(__dirname, '..');
const DOSYA = path.join(KOK, 'assets', 'haberler.js');
const KAYNAKLAR = [
    { ad: 'TRT Haber', url: 'https://www.trthaber.com/ekonomi_articles.rss' }
];
const EN_FAZLA = 30;
const EN_ESKI_GUN = 4;
const OZET_UZUNLUK = 180;
const BASLIK = { 'User-Agent': 'maas-hesaplama.com haber guncelleyici', 'Accept': 'application/rss+xml, application/xml, text/xml' };

const VARLIKLAR = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', ndash: '–', mdash: '—' };
function metinTemizle(s) {
    if (!s) return '';
    let t = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    // HTML etiketlerini at (önce kodlanmış etiketleri çöz)
    for (let i = 0; i < 2; i++) {
        t = t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, v) => {
            if (v[0] === '#') {
                const kod = v[1].toLowerCase() === 'x' ? parseInt(v.slice(2), 16) : parseInt(v.slice(1), 10);
                return Number.isFinite(kod) ? String.fromCodePoint(kod) : m;
            }
            return VARLIKLAR[v.toLowerCase()] ?? m;
        });
        t = t.replace(/<[^>]*>/g, ' ');
    }
    return t.replace(/\s+/g, ' ').trim();
}

function kisalt(s, n) {
    if (s.length <= n) return s;
    const kes = s.slice(0, n);
    return kes.slice(0, Math.max(kes.lastIndexOf(' '), n - 20)).replace(/[\s,.;:–-]+$/, '') + '…';
}

const etiket = (blok, ...adlar) => {
    for (const ad of adlar) {
        const m = blok.match(new RegExp(`<${ad}(?:\\s[^>]*)?>([\\s\\S]*?)</${ad}>`, 'i'));
        if (m) return m[1];
    }
    return '';
};

function rssAyristir(xml, kaynak) {
    const ogeler = [];
    const bloklar = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
    const atom = bloklar.length ? [] : [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map(m => m[1]);
    for (const b of bloklar.length ? bloklar : atom) {
        const baslik = metinTemizle(etiket(b, 'title'));
        let link = metinTemizle(etiket(b, 'link'));
        if (!link) { const m = b.match(/<link[^>]*href="([^"]+)"/i); if (m) link = m[1]; }
        const tarihHam = metinTemizle(etiket(b, 'pubDate', 'published', 'updated', 'dc:date'));
        const tarih = new Date(tarihHam);
        const ozet = kisalt(metinTemizle(etiket(b, 'description', 'summary')), OZET_UZUNLUK);
        if (!baslik || !/^https?:\/\//i.test(link) || isNaN(tarih)) continue;
        ogeler.push({ baslik, link: link.replace(/^http:/i, 'https:'), tarih: tarih.toISOString(), ozet, kaynak: kaynak.ad });
    }
    return ogeler;
}

async function getir(url) {
    const yanit = await fetch(url, { headers: BASLIK, signal: AbortSignal.timeout(20000) });
    if (!yanit.ok) throw new Error(`${url} -> HTTP ${yanit.status}`);
    return yanit.text();
}

function oncekiVeri() {
    try {
        const m = fs.readFileSync(DOSYA, 'utf8');
        return JSON.parse(m.slice(m.indexOf('=') + 1).trim().replace(/;\s*$/, ''));
    } catch { return null; }
}

async function main() {
    const onceki = oncekiVeri();
    const testDosyasi = process.env.RSS_DOSYASI; // Test için yerel dosya
    let hepsi = [], basarili = 0;
    for (const k of KAYNAKLAR) {
        try {
            const xml = testDosyasi ? fs.readFileSync(testDosyasi, 'utf8') : await getir(k.url);
            const ogeler = rssAyristir(xml, k);
            if (!ogeler.length) throw new Error('akışta haber bulunamadı');
            hepsi.push(...ogeler);
            basarili++;
            console.log(`${k.ad}: ${ogeler.length} haber`);
        } catch (e) {
            console.warn(`${k.ad} alınamadı:`, e.message);
        }
    }
    if (!basarili) {
        console.error('Hiçbir kaynaktan haber alınamadı; mevcut dosya korunuyor.');
        process.exit(1);
    }

    const sinir = Date.now() - EN_ESKI_GUN * 864e5;
    const gorulen = new Set();
    hepsi = hepsi
        .filter(h => new Date(h.tarih).getTime() >= sinir)
        .sort((a, b) => b.tarih.localeCompare(a.tarih))
        .filter(h => {
            const b = h.baslik.toLocaleLowerCase('tr-TR');
            if (gorulen.has(h.link) || gorulen.has(b)) return false;
            gorulen.add(h.link); gorulen.add(b);
            return true;
        })
        .slice(0, EN_FAZLA);

    if (onceki && JSON.stringify(onceki.haberler) === JSON.stringify(hepsi)) {
        console.log('Yeni haber yok.');
        return;
    }
    const veri = { guncellendi: new Date().toISOString(), kaynaklar: KAYNAKLAR.map(k => k.ad), haberler: hepsi };
    fs.writeFileSync(DOSYA, `/* Otomatik üretilir: node _kaynak/haber-guncelle.js — elle düzenlemeyin. */\nwindow.HABERLER = ${JSON.stringify(veri, null, 1)};\n`);
    console.log(`${hepsi.length} haber yazıldı.`);
}

main().catch(e => { console.error('Haber güncelleme başarısız:', e.message); process.exit(1); });
