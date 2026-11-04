/*
 * Döviz kurlarını TCMB'den, gram altın fiyatını ons fiyatından çekip assets/kurlar.js dosyasına yazar.
 * Çalıştırma (depo kökünden): node _kaynak/kur-guncelle.js
 * GitHub Actions (.github/workflows/kur-guncelle.yml) bunu iş günlerinde otomatik çalıştırır.
 *
 * TCMB'ye ulaşılamazsa dosya değiştirilmez ve betik hata koduyla çıkar (son geçerli kurlar sitede kalır).
 * Altın kaynağına ulaşılamazsa önceki altın fiyatı korunur.
 */
const fs = require('fs');
const path = require('path');

const KOK = path.join(__dirname, '..');
const DOSYA = path.join(KOK, 'assets', 'kurlar.js');
const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';
const ALTIN_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json';
const GRAM_ONS = 31.1034768;
const BASLIK = { 'User-Agent': 'maas-hesaplama.com kur guncelleyici' };

function oncekiVeri() {
    try {
        const metin = fs.readFileSync(DOSYA, 'utf8');
        return JSON.parse(metin.slice(metin.indexOf('{'), metin.lastIndexOf('}') + 1));
    } catch { return null; }
}

const sayiAl = s => {
    if (s === undefined || s === null) return null;
    const t = String(s).trim();
    if (!t) return null;
    const n = parseFloat(t.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
};

const etiket = (blok, ad) => {
    const m = blok.match(new RegExp(`<${ad}>([\\s\\S]*?)</${ad}>`));
    return m ? m[1].trim() : '';
};

function tcmbAyristir(xml) {
    const kok = xml.match(/<Tarih_Date\b([^>]*)>/);
    if (!kok) throw new Error('TCMB XML biçimi tanınmadı (Tarih_Date yok)');
    const ozellik = ad => { const m = kok[1].match(new RegExp(`${ad}="([^"]*)"`)); return m ? m[1] : ''; };
    const kurlar = [];
    for (const m of xml.matchAll(/<Currency\b([^>]*)>([\s\S]*?)<\/Currency>/g)) {
        const kod = (m[1].match(/CurrencyCode="([^"]+)"/) || [])[1];
        const b = m[2];
        const kur = {
            kod,
            isim: etiket(b, 'Isim'),
            birim: sayiAl(etiket(b, 'Unit')) || 1,
            dovizAlis: sayiAl(etiket(b, 'ForexBuying')),
            dovizSatis: sayiAl(etiket(b, 'ForexSelling')),
            efektifAlis: sayiAl(etiket(b, 'BanknoteBuying')),
            efektifSatis: sayiAl(etiket(b, 'BanknoteSelling'))
        };
        // Yalnızca TL karşılığı olan dövizleri al (ör. XDR için alış/satış boş gelebilir)
        if (kod && kur.dovizAlis && kur.dovizSatis) kurlar.push(kur);
    }
    if (!kurlar.find(k => k.kod === 'USD')) throw new Error('TCMB verisinde USD bulunamadı');
    return { tarih: ozellik('Tarih'), bultenNo: ozellik('Bulten_No'), kurlar };
}

async function getir(url) {
    const yanit = await fetch(url, { headers: BASLIK, signal: AbortSignal.timeout(20000) });
    if (!yanit.ok) throw new Error(`${url} -> HTTP ${yanit.status}`);
    return yanit;
}

async function altinGetir() {
    const veri = await (await getir(ALTIN_URL)).json();
    const onsTL = veri && veri.xau && veri.xau.try;
    if (!(onsTL > 0)) throw new Error('Altın verisinde XAU/TRY yok');
    return {
        onsTL: Math.round(onsTL * 100) / 100,
        gramTL: Math.round(onsTL / GRAM_ONS * 100) / 100,
        tarih: veri.date || '',
        kaynak: 'Uluslararası ons fiyatı (fawazahmed0/currency-api)'
    };
}

function yaz(veri) {
    const icerik = `/* Otomatik üretilir: node _kaynak/kur-guncelle.js — elle düzenlemeyin. */\nwindow.KURLAR = ${JSON.stringify(veri, null, 1)};\n`;
    fs.writeFileSync(DOSYA, icerik);
}

async function main() {
    const onceki = oncekiVeri();
    const xmlYolu = process.env.TCMB_XML_DOSYASI; // Test için yerel dosya
    const xml = xmlYolu ? fs.readFileSync(xmlYolu, 'utf8') : await (await getir(TCMB_URL)).text();
    const tcmb = tcmbAyristir(xml);

    let altin = onceki ? onceki.altin : null;
    if (!process.env.ALTIN_ATLA) {
        try { altin = await altinGetir(); }
        catch (e) { console.warn('Altın fiyatı alınamadı, önceki değer korunuyor:', e.message); }
    }

    const yeni = { kaynak: 'TCMB', tarih: tcmb.tarih, bultenNo: tcmb.bultenNo, kurlar: tcmb.kurlar, altin };
    // Değişiklik yoksa dosyaya dokunma (gereksiz commit oluşmasın)
    if (onceki && JSON.stringify({ ...onceki, guncellendi: undefined }) === JSON.stringify({ ...yeni, guncellendi: undefined })) {
        console.log('Kurlar değişmemiş:', tcmb.tarih);
        return;
    }
    yeni.guncellendi = new Date().toISOString();
    yaz(yeni);
    console.log(`Kurlar güncellendi: ${tcmb.tarih} (${tcmb.kurlar.length} döviz)${altin ? `, gram altın ${altin.gramTL} TL` : ''}`);
}

main().catch(e => { console.error('Kur güncelleme başarısız:', e.message); process.exit(1); });
