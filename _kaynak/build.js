/*
 * Sayfa üretici. Çalıştırma (depo kökünden):  node _kaynak/build.js
 * Tüm HTML sayfaları, sitemap.xml ve robots.txt bu dosyadan üretilir.
 * Rakamlar assets/motor.js'teki aynı hesap motoruyla hesaplanır.
 * Not: "_" ile başlayan klasörler GitHub Pages (Jekyll) tarafından yayınlanmaz.
 */
const fs = require('fs');
const path = require('path');
const M = require('../assets/motor.js');
const { P, AYLAR, tl, r2, bordro12, nettenBrut, AU_GV_ISTISNA, AU_DV_ISTISNA, AU_MATRAH, dilimOrani, ekOdemeNeti, izinGunu } = M;

const KOK = path.join(__dirname, '..');
const SITE = 'https://maas-hesaplama.com';
const BUGUN = '2026-11-14';

// Döviz kurları (kur-guncelle.js tarafından assets/kurlar.js içine yazılır)
const KURLAR = (() => {
    try {
        const m = fs.readFileSync(path.join(KOK, 'assets', 'kurlar.js'), 'utf8');
        return JSON.parse(m.slice(m.indexOf('=') + 1).trim().replace(/;\s*$/, ''));
    } catch { return null; }
})();
const DOVIZ_LASTMOD = KURLAR && KURLAR.guncellendi ? KURLAR.guncellendi.slice(0, 10) : BUGUN;
// Ekonomi haberleri (haber-guncelle.js tarafından assets/haberler.js içine yazılır)
const HABERLER = (() => {
    try {
        const m = fs.readFileSync(path.join(KOK, 'assets', 'haberler.js'), 'utf8');
        return JSON.parse(m.slice(m.indexOf('=') + 1).trim().replace(/;\s*$/, ''));
    } catch { return null; }
})();
const kacis = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const haberTarihi = iso => new Date(iso).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const haberListesi = (haberler, ozetli) => `<ul class="haberler">${haberler.map(h => `
    <li><a href="${kacis(h.link)}" target="_blank" rel="nofollow noopener">${kacis(h.baslik)}</a>
        <span class="haber-meta">${kacis(h.kaynak)} · ${haberTarihi(h.tarih)}</span>${ozetli && h.ozet ? `
        <p>${kacis(h.ozet)}</p>` : ''}</li>`).join('')}
</ul>`;
const kurBicim = x => x.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const YIL = P.yil;
const sayi = x => x.toLocaleString('tr-TR');
const yuzde = x => '%' + (Math.round(x * 10000) / 100).toLocaleString('tr-TR');

const BRUT_ORNEKLER = [35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 90000, 100000, 120000, 150000, 200000];
const NET_ORNEKLER = [30000, 35000, 40000, 45000, 50000, 60000, 75000, 100000];
const brutYol = b => `/brut-maas/${b}-tl-net-kac-tl/`;
const netYol = n => `/net-maas/${n}-tl-brut-kac-tl/`;

const NAV = [
    ['/', 'Brütten Nete'],
    ['/netten-brute-maas-hesaplama/', 'Netten Brüte'],
    ['/kidem-tazminati-hesaplama/', 'Kıdem Tazminatı'],
    ['/ihbar-tazminati-hesaplama/', 'İhbar Tazminatı'],
    ['/fazla-mesai-hesaplama/', 'Fazla Mesai'],
    ['/yillik-izin-hesaplama/', 'Yıllık İzin'],
    ['/zam-hesaplama/', 'Zam Hesaplama'],
    ['/isveren-maliyeti-hesaplama/', 'İşveren Maliyeti'],
    ['/doviz-kurlari/', 'Döviz Kurları'],
    ['/rehber/', 'Rehberler']
];

// İletişim: ayrı iletişim e-postası açılınca buraya yazın; boşken İletişim sayfası üretilmez.
const ILETISIM_EPOSTA = '';
const EDITOR = 'maas-hesaplama.com Editörü';

// ===================== PARÇALAR =====================
// Reklam alanları: AdSense otomatik reklamlar kullanıldığı için boş. Manuel reklam birimi eklenecekse kod buraya yazılır.
const reklamUst = '';
const reklamAlt = '';
const ayKutusu = id => `<select id="${id}"></select>`;
const tesvikKutusu = id => `<label class="check"><input type="checkbox" id="${id}" checked> İşveren 5 puanlık SGK teşvikinden yararlanıyor</label>`;

const brutFormu = (deger = '') => `
<div class="grid-2">
    <div>
        <label for="brutMaas">Aylık Brüt Maaşınız (TL):</label>
        <input type="number" id="brutMaas" placeholder="Örn: 50000" min="0" step="0.01" inputmode="decimal" value="${deger}">
    </div>
    <div>
        <label for="brutAy">Hesaplanacak Ay:</label>
        ${ayKutusu('brutAy')}
    </div>
</div>
${tesvikKutusu('brutTesvik')}
<button class="btn" id="btnBrut">Brütten Nete Hesapla</button>
<div class="error" id="hataBrut"></div>`;

const netFormu = () => `
<div class="grid-2">
    <div>
        <label for="netMaasInput">Aylık Net Maaşınız (TL):</label>
        <input type="number" id="netMaasInput" placeholder="Örn: 40000" min="0" step="0.01" inputmode="decimal">
    </div>
    <div>
        <label for="netAy">Hesaplanacak Ay:</label>
        ${ayKutusu('netAy')}
    </div>
</div>
${tesvikKutusu('netTesvik')}
<p class="hint">Aynı net için gereken brüt, vergi dilimleri nedeniyle aydan aya değişir. Seçtiğiniz ayda bu neti sağlayan sabit brüt maaş hesaplanır.</p>
<button class="btn" id="btnNet">Netten Brüte Hesapla</button>
<div class="error" id="hataNet"></div>`;

const maasSonucu = (isverenDetay = false) => `
<div class="result-box" id="maasSonuclari" style="display:none;">
    <div class="result-item"><span>Brüt Maaş:</span><strong id="resBrut"></strong></div>
    <div class="result-item"><span>SGK İşçi Payı (%14):</span><strong id="resSgk"></strong></div>
    <div class="result-item"><span>İşsizlik Sigortası İşçi Payı (%1):</span><strong id="resIssizlik"></strong></div>
    <div class="result-item"><span>Gelir Vergisi Matrahı:</span><strong id="resMatrah"></strong></div>
    <div class="result-item sub"><span>Kümülatif Matrah (bu ay dahil) · Dilim:</span><span id="resKum"></span></div>
    <div class="result-item sub"><span>Hesaplanan Gelir Vergisi:</span><span id="resHesGV"></span></div>
    <div class="result-item sub"><span>Asgari Ücret Gelir Vergisi İstisnası:</span><span id="resIstGV"></span></div>
    <div class="result-item"><span>Ödenecek Gelir Vergisi:</span><strong id="resGV"></strong></div>
    <div class="result-item sub"><span>Hesaplanan Damga Vergisi (‰7,59):</span><span id="resHesDV"></span></div>
    <div class="result-item sub"><span>Asgari Ücret Damga Vergisi İstisnası:</span><span id="resIstDV"></span></div>
    <div class="result-item"><span>Ödenecek Damga Vergisi:</span><strong id="resDV"></strong></div>
    <hr>
    <div class="result-item total"><span id="resNetLabel">Ele Geçen Net Maaş:</span><strong id="resNet"></strong></div>
    <div class="result-item sub" id="resDovizSatir" style="display:none;"><span>Net maaşın döviz karşılığı (<a href="/doviz-kurlari/">TCMB kuru</a>):</span><span id="resDoviz"></span></div>
    ${isverenDetay ? `<hr>
    <div class="result-item"><span>SGK İşveren Payı:</span><strong id="resIsvSgk"></strong></div>
    <div class="result-item"><span>İşsizlik Sigortası İşveren Payı (%2):</span><strong id="resIsvIss"></strong></div>
    <div class="result-item cost-big"><span>İşverene Toplam Maliyet:</span><strong id="resMaliyet"></strong></div>`
    : `<div class="result-item cost"><span>İşverene Toplam Maliyet:</span><strong id="resMaliyet"></strong></div>`}
    <div class="warn" id="resUyari" style="display:none;"></div>
    <details>
        <summary>12 aylık bordro tablosu</summary>
        <div class="table-wrap">
            <table>
                <thead><tr><th>Ay</th><th>Brüt</th><th>SGK+İşsizlik</th><th>Kümülatif Matrah</th><th>Gelir V.</th><th>Damga V.</th><th>Net</th><th>İşveren Maliyeti</th></tr></thead>
                <tbody id="tablo12"></tbody>
                <tfoot id="tablo12Toplam"></tfoot>
            </table>
        </div>
    </details>
</div>`;

const tazminatFormu = (ihbarVarsayilan = true) => `
<label for="tazBrutMaas">Son Giydirilmiş Brüt Maaş (TL):</label>
<input type="number" id="tazBrutMaas" placeholder="Örn: 45000" min="0" step="0.01" inputmode="decimal">
<p class="hint">Brüt maaşa düzenli ödenen yemek, yol, ikramiye gibi yan hakların aylık karşılığı eklenmiş tutar.</p>
<div class="grid-2">
    <div>
        <label for="iseGiris">İşe Giriş Tarihi:</label>
        <input type="date" id="iseGiris">
    </div>
    <div>
        <label for="istenCikis">İşten Çıkış Tarihi:</label>
        <input type="date" id="istenCikis">
    </div>
</div>
<label for="kumMatrah">Bu Yıl Şimdiye Kadarki Kümülatif Vergi Matrahı (TL, isteğe bağlı):</label>
<input type="number" id="kumMatrah" placeholder="Bilmiyorsanız boş bırakın" min="0" step="0.01" inputmode="decimal">
<p class="hint">Bordronuzda yazar. İhbar tazminatının hangi vergi diliminden vergilendirileceğini belirler.</p>
<label class="check"><input type="checkbox" id="ihbarDahil"${ihbarVarsayilan ? ' checked' : ''}> İhbar tazminatını da hesapla (işveren bildirim süresi vermeden sözleşmeyi feshettiyse)</label>
<button class="btn" id="btnTaz">Tazminatı Hesapla</button>
<div class="error" id="hataTaz"></div>
<div class="result-box" id="tazminatSonuclari" style="display:none;">
    <div class="result-item sub"><span>Çalışma Süresi:</span><span id="resSure"></span></div>
    <div class="result-item sub"><span>Kıdeme Esas Ücret (tavan uygulanmış):</span><span id="resKidemEsas"></span></div>
    <div class="result-item"><span>Brüt Kıdem Tazminatı:</span><strong id="resBrutKidem"></strong></div>
    <div class="result-item"><span>Damga Vergisi (‰7,59):</span><strong id="resKidemDamga"></strong></div>
    <div class="result-item" style="color:#28a745;"><span>Net Kıdem Tazminatı:</span><strong id="resNetKidem"></strong></div>
    <div id="ihbarBlok">
        <hr>
        <div class="result-item sub"><span>İhbar Süresi:</span><span id="resIhbarSure"></span></div>
        <div class="result-item"><span>Brüt İhbar Tazminatı:</span><strong id="resBrutIhbar"></strong></div>
        <div class="result-item"><span>Gelir Vergisi:</span><strong id="resIhbarGV"></strong></div>
        <div class="result-item"><span>Damga Vergisi (‰7,59):</span><strong id="resIhbarDV"></strong></div>
        <div class="result-item" style="color:#28a745;"><span>Net İhbar Tazminatı:</span><strong id="resNetIhbar"></strong></div>
    </div>
    <hr>
    <div class="result-item total" style="color:#17a2b8;"><span>Toplam Ele Geçen Net Tazminat:</span><strong id="resToplamTazminat"></strong></div>
    <div id="tazUyarilar"></div>
</div>`;

const dilimTablosu = () => `
<div class="table-wrap">
    <table>
        <tr><th>Yıllık kümülatif matrah</th><th>Oran</th></tr>
        <tr><td>190.000 TL'ye kadar</td><td>%15</td></tr>
        <tr><td>190.000 – 400.000 TL</td><td>%20</td></tr>
        <tr><td>400.000 – 1.500.000 TL</td><td>%27</td></tr>
        <tr><td>1.500.000 – 5.000.000 TL</td><td>%35</td></tr>
        <tr><td>5.000.000 TL üzeri</td><td>%40</td></tr>
    </table>
</div>`;

const parametreTablosu = () => `
<div class="table-wrap">
    <table>
        <tr><td>Brüt asgari ücret</td><td>${tl(P.asgariUcret)}</td></tr>
        <tr><td>Net asgari ücret</td><td>${tl(r2(P.asgariUcret * 0.85))}</td></tr>
        <tr><td>SGK işçi payı / işsizlik işçi payı</td><td>%14 / %1</td></tr>
        <tr><td>SGK işveren payı (teşviksiz / 5 puan teşvikli)</td><td>%21,75 / %16,75</td></tr>
        <tr><td>İşsizlik işveren payı</td><td>%2</td></tr>
        <tr><td>SGK prime esas kazanç tavanı (aylık)</td><td>${tl(P.sgkTavan)}</td></tr>
        <tr><td>Damga vergisi</td><td>‰7,59</td></tr>
        <tr><td>Kıdem tazminatı tavanı (Ocak–Haziran ${YIL})</td><td>${tl(P.kidemTavanlari[0][1])}</td></tr>
        <tr><td>Kıdem tazminatı tavanı (Temmuz–Aralık ${YIL})</td><td>${tl(P.kidemTavanlari[1][1])}</td></tr>
    </table>
</div>`;

const nasilHesaplanir = () => `
<h2>Maaş Hesabı Nasıl Yapılıyor?</h2>
<p><strong>1.</strong> Brüt maaştan (en fazla SGK tavanı kadarı üzerinden) %14 SGK ve %1 işsizlik sigortası işçi payı düşülür; kalan tutar gelir vergisi matrahıdır.</p>
<p><strong>2.</strong> Matrah, yıl başından o aya kadar biriken kümülatif matraha eklenir ve denk geldiği dilimlerin oranlarıyla vergilendirilir.</p>
<p><strong>3.</strong> Hesaplanan gelir vergisinden, asgari ücretin o aydaki gelir vergisi kadar istisna düşülür. Damga vergisinden de asgari ücretin damga vergisi (${tl(AU_DV_ISTISNA)}) düşülür.</p>
<p><strong>4.</strong> Net maaş = Brüt − SGK − İşsizlik − Ödenecek gelir vergisi − Ödenecek damga vergisi.</p>`;

const uyariMetni = `<p class="warn">Bu sitedeki hesaplamalar bilgilendirme amaçlıdır. Bordronuzdaki tutarlar teşvikler, yan haklar, engellilik indirimi, emekli (SGDP) statüsü gibi nedenlerle farklılık gösterebilir. Kesin tutarlar için işvereninizin muhasebe/İK birimine veya bir mali müşavire danışınız.</p>`;

const tabloLinki = `<h2>Hazır Hesaplanmış Tablo</h2>
<p>Farklı brüt ve net maaşların ay ay karşılıklarını tek sayfada görmek için <a href="/brut-net-maas-tablosu-2026/">${YIL} Brüt–Net Maaş Tablosu</a>'na bakabilirsiniz.</p>`;

// Rehber yazıları kayıt defteri (yol -> başlık); ilgiliRehberler bunu kullanır, rehberler aşağıda eklenir.
const REHBERLER = [];
const ilgiliRehberler = yollar => `<h2>İlgili Rehberler</h2>
<ul class="rehber-liste">${yollar.map(y => `<li><a href="${y}">${(REHBER_BASLIK[y] || y)}</a></li>`).join('')}</ul>`;
const REHBER_BASLIK = {
    '/rehber/bordro-nasil-okunur/': 'Bordro nasıl okunur? Maaş bordrosundaki her satırın anlamı',
    '/rehber/asgari-ucret-istisnasi-nedir/': 'Asgari ücret istisnası nedir, net maaşınıza etkisi nasıl hesaplanır?',
    '/rehber/kidem-tazminati-kimlere-odenir/': 'Kıdem tazminatı kimlere ödenir? Şartlar, tavan ve örnekler',
    '/rehber/is-teklifinde-net-brut-maas-pazarligi/': 'İş teklifinde net mi brüt mü konuşmalı? Maaş pazarlığı rehberi',
    '/rehber/fazla-mesai-ucreti-nasil-hesaplanir/': 'Fazla mesai ücreti nasıl hesaplanır? %50, %25 ve tatil çalışması'
};

const sssHtml = sss => sss.length ? `<h2>Sık Sorulan Sorular</h2>\n` + sss.map(([s, c]) => `<h3>${s}</h3>\n<p>${c}</p>`).join('\n') : '';

const ilgiliLinkler = (baslik, liste, aktif) => `
<h2>${baslik}</h2>
<div class="links">${liste.map(([href, ad]) => `<a href="${href}"${href === aktif ? ' class="current"' : ''}>${ad}</a>`).join('')}</div>`;

const brutOrnekLinkleri = aktif => ilgiliLinkler(`${YIL} Brüt Maaş Örnekleri`, BRUT_ORNEKLER.map(b => [brutYol(b), `${sayi(b)} TL brüt`]), aktif);
const netOrnekLinkleri = aktif => ilgiliLinkler(`${YIL} Net Maaş Örnekleri`, NET_ORNEKLER.map(n => [netYol(n), `${sayi(n)} TL net`]), aktif);

const SSS_ORTAK = {
    asgari: [`${YIL} asgari ücret brüt ve net ne kadar?`, `${YIL} yılında brüt asgari ücret ${tl(P.asgariUcret)}, net asgari ücret ${tl(r2(P.asgariUcret * 0.85))}'dir.`],
    istisna: ['Asgari ücret istisnası nedir?', 'Tüm ücretlilerin maaşının asgari ücrete isabet eden kısmı gelir vergisi ve damga vergisinden muaftır. Bu nedenle asgari ücretin üzerinde maaş alanlar da bu istisnadan yararlanır; vergi yalnızca asgari ücreti aşan kısım için ödenmiş olur.'],
    dusus: ['Net maaşım neden yılın ilerleyen aylarında düşüyor?', 'Gelir vergisi yıllık kümülatif matraha göre artan oranlı uygulanır. Biriken matrah 190.000 TL, 400.000 TL gibi dilim sınırlarını aştığında o aydan itibaren daha yüksek oranda vergi kesilir. Brüt maaşınız değişmese de net maaşınız düşer.'],
    kidemSart: ['Kıdem tazminatı için kaç yıl çalışmak gerekir?', 'Aynı işverene bağlı olarak en az 1 yıl çalışmış olmak ve iş sözleşmesinin kanunda sayılan hallerden biriyle (işveren feshi, emeklilik, askerlik, evlilik nedeniyle kadın çalışanın ayrılması, haklı nedenle fesih vb.) sona ermesi gerekir. Kendi isteğiyle istifa eden çalışan genellikle kıdem tazminatı alamaz.'],
    kidemTavan: [`${YIL} kıdem tazminatı tavanı ne kadar?`, `1 Ocak – 30 Haziran ${YIL} için ${tl(P.kidemTavanlari[0][1])}, 1 Temmuz – 31 Aralık ${YIL} için ${tl(P.kidemTavanlari[1][1])}'dir.`],
    ihbarSure: ['İhbar süreleri nedir?', '6 aydan az çalışmada 2 hafta, 6 ay – 1,5 yıl arası 4 hafta, 1,5 – 3 yıl arası 6 hafta, 3 yıldan fazla çalışmada 8 haftadır.']
};

// ===================== SAYFA ŞABLONU =====================
function sayfa({ yol, baslik, aciklama, h1, altBaslik, icerik, sss = [], kirinti = [], arac = true, robots = '' }) {
    const url = SITE + yol;
    const kirintilar = [['/', 'Ana Sayfa'], ...kirinti];
    const ldKirinti = {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: kirintilar.map(([h, ad], i) => ({ '@type': 'ListItem', position: i + 1, name: ad, item: SITE + h }))
    };
    const ldSss = sss.length ? {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: sss.map(([s, c]) => ({ '@type': 'Question', name: s, acceptedAnswer: { '@type': 'Answer', text: c.replace(/<[^>]+>/g, '') } }))
    } : null;
    const navHtml = NAV.map(([h, ad]) => `<a href="${h}"${h === yol ? ' class="active"' : ''}>${ad}</a>`).join('');
    const kirintiHtml = kirinti.length
        ? `<nav class="breadcrumb">${kirintilar.map(([h, ad], i) => i === kirintilar.length - 1 ? ad : `<a href="${h}">${ad}</a>`).join(' › ')}</nav>` : '';

    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${baslik}</title>
    <meta name="description" content="${aciklama}">
${robots ? `    <meta name="robots" content="${robots}">\n` : ''}    <link rel="canonical" href="${url}">
    <meta property="og:title" content="${baslik}">
    <meta property="og:description" content="${aciklama}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="tr_TR">
    <meta property="og:site_name" content="maas-hesaplama.com">
    <meta name="google-site-verification" content="ia2PrtWkyUlxTagzUlvlxqIn86mNVCnmy7R5dMFhnpw" />
    <link rel="stylesheet" href="/assets/style.css">

    <!-- Google AdSense Doğrulama Kodu -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7621668742531802"
     crossorigin="anonymous"></script>

    <script type="application/ld+json">${JSON.stringify(ldKirinti)}</script>
${ldSss ? `    <script type="application/ld+json">${JSON.stringify(ldSss)}</script>\n` : ''}</head>
<body>

<header class="site-header">
    <a class="logo" href="/">maas-<span>hesaplama</span>.com</a>
    <nav class="nav">${navHtml}</nav>
</header>

<main class="container">
    ${kirintiHtml}
    <h1>${h1}</h1>
    <p class="subtitle">${altBaslik || `${YIL} parametreleri · Son güncelleme: ${P.sonGuncelleme}`}</p>
${icerik}
${sssHtml(sss) ? `<section class="info">\n${sssHtml(sss)}\n</section>` : ''}
    <footer class="footer-links">
        <p>
            <a href="/brut-net-maas-tablosu-2026/">Brüt–Net Maaş Tablosu</a> ·
            <a href="/gelir-vergisi-dilimleri-2026/">${YIL} Vergi Dilimleri</a> ·
            <a href="/asgari-ucret-2026/">${YIL} Asgari Ücret</a> ·
            <a href="/ekonomi-haberleri/">Ekonomi Haberleri</a>
        </p>
        <p>
            <a href="/hakkimizda/">Hakkımızda ve Editoryal İlkeler</a> ·
            ${ILETISIM_EPOSTA ? '<a href="/iletisim/">İletişim</a> ·' : ''}
            <a href="/gizlilik-politikasi/">Gizlilik Politikası</a>
        </p>
        <p>© ${YIL} maas-hesaplama.com · Hesaplamalar bilgilendirme amaçlıdır.</p>
    </footer>
</main>
${arac ? `
<script src="/assets/kurlar.js"></script>
<script src="/assets/motor.js"></script>
<script src="/assets/arayuz.js"></script>` : ''}
</body>
</html>
`;
}

// ===================== SAYFALAR =====================
const sayfalar = [];
const ekle = s => sayfalar.push(s);

// --- Ana sayfa: Brütten nete
ekle({
    yol: '/',
    baslik: `Brütten Nete Maaş Hesaplama ${YIL} | maas-hesaplama.com`,
    aciklama: `${YIL} güncel parametrelerle brütten nete maaş hesaplama. Asgari ücret istisnası, kümülatif vergi dilimleri ve SGK tavanı dahil; 12 aylık bordro ve işveren maliyeti.`,
    h1: `Brütten Nete Maaş Hesaplama ${YIL}`,
    icerik: `
${reklamUst}
<p class="lead">Brüt maaşınızı ve ayı seçin; SGK, işsizlik sigortası, gelir vergisi ve damga vergisi kesintilerini, asgari ücret istisnasını ve ele geçen net maaşınızı ay ay görün.</p>
${brutFormu()}
${maasSonucu()}
${reklamAlt}
<section class="info">
    <h2>${YIL} Bordro Parametreleri</h2>
    ${parametreTablosu()}
    <h2>${YIL} Ücret Gelirleri İçin Gelir Vergisi Dilimleri</h2>
    ${dilimTablosu()}
    ${nasilHesaplanir()}
    ${tabloLinki}
    ${ilgiliRehberler(['/rehber/bordro-nasil-okunur/', '/rehber/asgari-ucret-istisnasi-nedir/', '/rehber/is-teklifinde-net-brut-maas-pazarligi/'])}
    ${uyariMetni}
</section>`,
    sss: [SSS_ORTAK.asgari, SSS_ORTAK.istisna, SSS_ORTAK.dusus,
        ['Brüt maaş ile net maaş arasındaki fark nedir?', 'Brüt maaş, işverenin sizin adınıza bordroya yazdığı toplam ücrettir. Net maaş ise bu tutardan SGK işçi payı, işsizlik sigortası, gelir vergisi ve damga vergisi düşüldükten sonra hesabınıza yatan tutardır.'],
        ['İşverene toplam maliyet nasıl hesaplanır?', 'Brüt maaşa SGK işveren payı (%21,75; 5 puanlık teşvikle %16,75) ve %2 işsizlik sigortası işveren payı eklenir. Ayrıntılı hesap için İşveren Maliyeti sayfasını kullanabilirsiniz.']]
});

// --- Netten brüte
ekle({
    yol: '/netten-brute-maas-hesaplama/',
    baslik: `Netten Brüte Maaş Hesaplama ${YIL} | maas-hesaplama.com`,
    aciklama: `Eline geçmesini istediğin net maaş için gereken brüt maaşı ${YIL} vergi dilimleri, asgari ücret istisnası ve SGK tavanıyla hesapla. İş teklifi pazarlığı için ideal.`,
    h1: `Netten Brüte Maaş Hesaplama ${YIL}`,
    kirinti: [['/netten-brute-maas-hesaplama/', 'Netten Brüte']],
    icerik: `
${reklamUst}
<p class="lead">İş tekliflerinde genellikle net maaş konuşulur, sözleşmede ise brüt yazar. Ele geçmesini istediğiniz net tutarı ve ayı girin; bunu sağlayan brüt maaşı ve işverene maliyetini görün.</p>
${netFormu()}
${maasSonucu()}
${reklamAlt}
<section class="info">
    <h2>Netten Brüte Hesap Nasıl Yapılır?</h2>
    <p>Net maaştan brüte geçişin basit bir çarpanı yoktur; çünkü gelir vergisi kümülatif matraha göre artan oranlıdır ve asgari ücret istisnası sabit bir tutar olarak düşülür. Bu araç, seçtiğiniz ayda hedef neti tam olarak veren brüt tutarı deneme yoluyla (ikili arama) kuruş hassasiyetinde bulur.</p>
    <p>Yıl içinde aynı neti korumak için brütün aydan aya artması gerekir. Sabit brütle anlaştıysanız, yılın son aylarında netinizin düşeceğini hesaba katın. Sonuçtaki 12 aylık tabloda bu etkiyi görebilirsiniz.</p>
    ${tabloLinki}
    ${ilgiliRehberler(['/rehber/is-teklifinde-net-brut-maas-pazarligi/', '/rehber/bordro-nasil-okunur/'])}
    ${uyariMetni}
</section>`,
    sss: [['Net maaş pazarlığı mı, brüt maaş pazarlığı mı yapmalıyım?', 'Sözleşmede yazan brüt tutardır; net tutar yıl içinde vergi dilimine göre değişir. Net üzerinden anlaştıysanız, işverenin yılın tamamında bu neti garanti edip etmeyeceğini yazılı olarak netleştirmeniz önerilir.'],
        SSS_ORTAK.dusus, SSS_ORTAK.istisna]
});

// --- Kıdem tazminatı
ekle({
    yol: '/kidem-tazminati-hesaplama/',
    baslik: `Kıdem Tazminatı Hesaplama ${YIL} (Güncel Tavan) | maas-hesaplama.com`,
    aciklama: `${YIL} kıdem tazminatı hesaplama: işe giriş-çıkış tarihi ve giydirilmiş brüt ücretle net kıdem ve ihbar tazminatı. Güncel tavan ${tl(P.kidemTavanlari[1][1])}.`,
    h1: `Kıdem Tazminatı Hesaplama ${YIL}`,
    kirinti: [['/kidem-tazminati-hesaplama/', 'Kıdem Tazminatı']],
    icerik: `
${reklamUst}
<p class="lead">Giydirilmiş brüt ücretinizi ve işe giriş–çıkış tarihlerinizi girin. Kıdem tazminatı güncel tavan ve 1 yıl şartı dikkate alınarak, isterseniz ihbar tazminatıyla birlikte hesaplanır.</p>
${tazminatFormu(true)}
${reklamAlt}
<section class="info">
    <h2>${YIL} Kıdem Tazminatı Tavanı</h2>
    <div class="table-wrap"><table>
        <tr><th>Dönem</th><th>Tavan (her hizmet yılı için)</th></tr>
        <tr><td>1 Ocak – 30 Haziran ${YIL}</td><td>${tl(P.kidemTavanlari[0][1])}</td></tr>
        <tr><td>1 Temmuz – 31 Aralık ${YIL}</td><td>${tl(P.kidemTavanlari[1][1])}</td></tr>
    </table></div>
    <h2>Kıdem Tazminatı Nasıl Hesaplanır?</h2>
    <p>Her tam hizmet yılı için 30 günlük giydirilmiş brüt ücret ödenir; artan ay ve günler orantılı eklenir: <strong>Kıdem = Giydirilmiş ücret × (yıl + ay/12 + gün/365)</strong>. Giydirilmiş ücret, işten çıkış tarihindeki tavanı aşamaz.</p>
    <p>Kıdem tazminatından gelir vergisi ve SGK primi kesilmez; yalnızca ‰7,59 damga vergisi kesilir.</p>
    <h2>Giydirilmiş Ücret Nedir?</h2>
    <p>Son brüt ücrete, düzenli ve sürekli ödenen para veya parayla ölçülebilen yan hakların (yemek, yol, ikramiye, prim, yakacak yardımı gibi) aylık karşılığı eklenerek bulunan ücrettir. Yıllık ödenen ikramiyeler 12'ye bölünerek eklenir.</p>
    ${uyariMetni}
</section>`,
    sss: [SSS_ORTAK.kidemSart, SSS_ORTAK.kidemTavan,
        ['İstifa eden kıdem tazminatı alabilir mi?', 'Genel kural olarak kendi isteğiyle istifa eden çalışan kıdem tazminatı alamaz. Ancak emeklilik için yaş dışındaki şartları tamamlama, askerlik, kadın çalışanın evlendikten sonra 1 yıl içinde ayrılması ve İş Kanunu 24. maddesindeki haklı nedenlerle fesih gibi durumlarda tazminat hakkı doğar.'],
        ['Kıdem tazminatından hangi kesintiler yapılır?', 'Yalnızca ‰7,59 oranında damga vergisi kesilir. Gelir vergisi ve SGK primi kesilmez.'],
        SSS_ORTAK.ihbarSure]
});

// --- İhbar tazminatı
ekle({
    yol: '/ihbar-tazminati-hesaplama/',
    baslik: `İhbar Tazminatı Hesaplama ${YIL} | maas-hesaplama.com`,
    aciklama: `${YIL} ihbar tazminatı hesaplama: çalışma süresine göre 2-8 haftalık ihbar süresi, gelir vergisi ve damga vergisi kesintisiyle net ihbar tazminatı.`,
    h1: `İhbar Tazminatı Hesaplama ${YIL}`,
    kirinti: [['/ihbar-tazminati-hesaplama/', 'İhbar Tazminatı']],
    icerik: `
${reklamUst}
<p class="lead">İş sözleşmesi bildirim süresine uyulmadan feshedildiğinde, karşı tarafa ihbar süresi kadar ücret ödenir. Tarihlerinizi ve giydirilmiş brüt ücretinizi girerek net ihbar (ve varsa kıdem) tazminatınızı hesaplayın.</p>
${tazminatFormu(true)}
${reklamAlt}
<section class="info">
    <h2>İhbar Süreleri (İş Kanunu md. 17)</h2>
    <div class="table-wrap"><table>
        <tr><th>Çalışma süresi</th><th>İhbar süresi</th></tr>
        <tr><td>6 aydan az</td><td>2 hafta (14 gün)</td></tr>
        <tr><td>6 ay – 1,5 yıl</td><td>4 hafta (28 gün)</td></tr>
        <tr><td>1,5 yıl – 3 yıl</td><td>6 hafta (42 gün)</td></tr>
        <tr><td>3 yıldan fazla</td><td>8 hafta (56 gün)</td></tr>
    </table></div>
    <h2>İhbar Tazminatı Nasıl Hesaplanır?</h2>
    <p><strong>İhbar tazminatı = Giydirilmiş günlük brüt ücret × ihbar süresi (gün).</strong> Günlük ücret, aylık giydirilmiş brüt ücretin 30'a bölünmesiyle bulunur. Kıdem tazminatının aksine ihbar tazminatında tavan yoktur.</p>
    <p>İhbar tazminatından gelir vergisi ve ‰7,59 damga vergisi kesilir; SGK primi kesilmez. Gelir vergisi, yıl içindeki kümülatif matrahınıza eklenerek hesaplandığı için o yıl ne kadar kazandığınız önemlidir. Bordronuzdaki kümülatif matrahı girerseniz hesap daha doğru olur.</p>
    ${uyariMetni}
</section>`,
    sss: [SSS_ORTAK.ihbarSure,
        ['İhbar tazminatını kim öder?', 'Bildirim süresine uymadan sözleşmeyi fesheden taraf öder. İşveren bildirim süresi vermeden çalışanı çıkarırsa işveren; çalışan bildirim süresine uymadan işi bırakırsa çalışan, işverene ihbar tazminatı öder.'],
        ['İhbar tazminatından vergi kesilir mi?', 'Evet. İhbar tazminatından gelir vergisi ve damga vergisi kesilir, SGK primi kesilmez.'],
        SSS_ORTAK.kidemSart]
});

// --- İşveren maliyeti
ekle({
    yol: '/isveren-maliyeti-hesaplama/',
    baslik: `İşveren Maliyeti Hesaplama ${YIL} | maas-hesaplama.com`,
    aciklama: `${YIL} personel maliyeti hesaplama: brüt maaş, SGK işveren payı (%21,75 / teşvikli %16,75), işsizlik sigortası işveren payı ve işverene toplam maliyet.`,
    h1: `İşveren Maliyeti Hesaplama ${YIL}`,
    kirinti: [['/isveren-maliyeti-hesaplama/', 'İşveren Maliyeti']],
    icerik: `
${reklamUst}
<p class="lead">Bir çalışanın işverene aylık ve yıllık toplam maliyetini hesaplayın. Brüt maaşa SGK ve işsizlik sigortası işveren payları eklenir; 5 puanlık teşvik seçeneğini açıp kapatarak farkı görebilirsiniz.</p>
${brutFormu()}
${maasSonucu(true)}
${reklamAlt}
<section class="info">
    <h2>${YIL} İşveren Prim Oranları</h2>
    <div class="table-wrap"><table>
        <tr><th>Kalem</th><th>Oran</th></tr>
        <tr><td>Kısa vadeli sigorta kolları</td><td>%2,25</td></tr>
        <tr><td>Malullük, yaşlılık ve ölüm sigortası</td><td>%12</td></tr>
        <tr><td>Genel sağlık sigortası</td><td>%7,5</td></tr>
        <tr><td><strong>SGK işveren payı toplamı</strong></td><td><strong>%21,75</strong></td></tr>
        <tr><td>5 puanlık teşvikle</td><td>%16,75</td></tr>
        <tr><td>İşsizlik sigortası işveren payı</td><td>%2</td></tr>
    </table></div>
    <h2>Asgari Ücretli Bir Çalışanın İşverene Maliyeti</h2>
    <div class="kpi">
        <div><span>Teşvikli (aylık)</span><strong>${tl(bordro12(P.asgariUcret, true)[0].maliyet)}</strong></div>
        <div><span>Teşviksiz (aylık)</span><strong>${tl(bordro12(P.asgariUcret, false)[0].maliyet)}</strong></div>
    </div>
    <p>Prim hesabında kullanılan kazanç, SGK tavanı olan ${tl(P.sgkTavan)} ile sınırlıdır. Bu tutarın üzerindeki maaşlarda işveren primi tavan üzerinden hesaplanır.</p>
    <p>5 puanlık teşvik, primlerini zamanında ödeyen ve SGK'ya borcu olmayan işverenlere uygulanır. Asgari ücret desteği ve bölgesel teşvikler gibi diğer destekler bu hesaba dahil değildir.</p>
    ${uyariMetni}
</section>`,
    sss: [['SGK işveren payı ne kadar?', `${YIL} yılında SGK işveren payı %21,75'tir. Primlerini düzenli ödeyen işverenler 5 puanlık teşvikle %16,75 öder. Ayrıca %2 işsizlik sigortası işveren payı vardır.`],
        ['5 puanlık teşvikten kimler yararlanır?', 'Prim ve vergi borcu bulunmayan, bildirgelerini yasal süresinde veren ve primlerini zamanında ödeyen özel sektör işverenleri yararlanabilir.'],
        SSS_ORTAK.asgari]
});

// --- Gelir vergisi dilimleri
const dilimGecisleri = [40000, 50000, 60000, 75000, 100000, 150000].map(b => {
    const s = bordro12(b, true);
    const gecis = oran => { const r = s.find(x => dilimOrani(x.kumulatif) >= oran); return r ? AYLAR[r.ay] : '—'; };
    return `<tr><td>${tl(b)}</td><td>${gecis(0.20)}</td><td>${gecis(0.27)}</td><td>${tl(s[0].net)}</td><td>${tl(s[11].net)}</td></tr>`;
}).join('');
ekle({
    yol: '/gelir-vergisi-dilimleri-2026/',
    baslik: `${YIL} Gelir Vergisi Dilimleri (Ücretliler İçin) | maas-hesaplama.com`,
    aciklama: `${YIL} ücret gelirleri gelir vergisi dilimleri: 190.000 TL'ye kadar %15, 400.000 TL'ye kadar %20, 1,5 milyon TL'ye kadar %27. Hangi ayda dilim değişir, net maaş ne kadar düşer?`,
    h1: `${YIL} Gelir Vergisi Dilimleri`,
    kirinti: [['/gelir-vergisi-dilimleri-2026/', 'Vergi Dilimleri']],
    arac: false,
    icerik: `
${reklamUst}
<section class="info">
    <p class="lead">Ücret gelirleri, yıl başından itibaren biriken (kümülatif) gelir vergisi matrahına göre artan oranlı vergilendirilir. Aşağıda ${YIL} tarifesini ve farklı maaşlarda dilim değişiminin hangi ayda gerçekleştiğini bulabilirsiniz.</p>
    <h2>${YIL} Ücret Gelirleri Vergi Tarifesi</h2>
    ${dilimTablosu()}
    <h2>Hangi Maaşta Hangi Ay Dilim Değişir?</h2>
    <p>Aşağıdaki tablo, yıl boyunca sabit brüt maaş alan bir çalışanın kümülatif matrahının hangi ay %20 ve %27 dilimine geçtiğini ve Ocak ile Aralık net maaşı arasındaki farkı gösterir (5 puan teşvikli, asgari ücret istisnası dahil).</p>
    <div class="table-wrap"><table>
        <tr><th>Brüt maaş</th><th>%20'ye geçiş</th><th>%27'ye geçiş</th><th>Ocak net</th><th>Aralık net</th></tr>
        ${dilimGecisleri}
    </table></div>
    <h2>Asgari Ücret İstisnası Dilim Değişimini Nasıl Etkiler?</h2>
    <p>Her ay hesaplanan gelir vergisinden, asgari ücretin o aydaki gelir vergisi kadar istisna düşülür. Asgari ücretin kendi kümülatif matrahı Temmuz'da %20 dilimine geçtiği için istisna tutarı da Temmuz'dan itibaren artar. Bu yüzden bazı maaşlarda Temmuz–Eylül neti, Haziran netinden biraz yüksek çıkabilir.</p>
    <div class="table-wrap"><table>
        <tr><th>Ay</th>${AYLAR.map(a => `<th>${a.slice(0, 3)}</th>`).join('')}</tr>
        <tr><td>GV istisnası</td>${AU_GV_ISTISNA.map(v => `<td>${sayi(v)}</td>`).join('')}</tr>
    </table></div>
    <p><a class="cta" href="/">Kendi maaşınızın ay ay netini hesaplayın</a></p>
    ${uyariMetni}
</section>`,
    sss: [['2026 gelir vergisi dilimleri nelerdir?', 'Ücret gelirlerinde 190.000 TL’ye kadar %15, 190.000–400.000 TL arası %20, 400.000–1.500.000 TL arası %27, 1.500.000–5.000.000 TL arası %35, 5.000.000 TL üzeri %40 uygulanır.'],
        SSS_ORTAK.dusus,
        ['Vergi dilimi değişince tüm maaşım mı yüksek oranla vergilendirilir?', 'Hayır. Yalnızca dilim sınırını aşan kısım yeni oranla vergilendirilir. Dilime geçilen ayda maaşın bir kısmı eski, bir kısmı yeni oranla vergilendirilir.']]
});

// --- Asgari ücret
const au12 = bordro12(P.asgariUcret, true);
ekle({
    yol: '/asgari-ucret-2026/',
    baslik: `${YIL} Asgari Ücret: Brüt ${sayi(P.asgariUcret)} TL, Net ${sayi(r2(P.asgariUcret * 0.85))} TL | maas-hesaplama.com`,
    aciklama: `${YIL} asgari ücret brüt ${tl(P.asgariUcret)}, net ${tl(r2(P.asgariUcret * 0.85))}. Kesintiler, işverene maliyet, günlük ve saatlik asgari ücret, asgari ücret vergi istisnası.`,
    h1: `${YIL} Asgari Ücret`,
    kirinti: [['/asgari-ucret-2026/', 'Asgari Ücret']],
    icerik: `
${reklamUst}
<div class="kpi">
    <div><span>Brüt asgari ücret</span><strong>${tl(P.asgariUcret)}</strong></div>
    <div><span>Net asgari ücret</span><strong>${tl(au12[0].net)}</strong></div>
    <div><span>İşverene maliyet (teşvikli)</span><strong>${tl(au12[0].maliyet)}</strong></div>
</div>
<p class="lead">Asgari ücretli çalışanın brütünden yalnızca %14 SGK ve %1 işsizlik sigortası kesilir; gelir vergisi ve damga vergisi istisna kapsamındadır. Aşağıdaki hesaplayıcı asgari ücretle doldurulmuştur, istediğiniz tutarı girebilirsiniz.</p>
${brutFormu(P.asgariUcret)}
${maasSonucu()}
${reklamAlt}
<section class="info">
    <h2>${YIL} Asgari Ücret Detayları</h2>
    <div class="table-wrap"><table>
        <tr><td>Aylık brüt</td><td>${tl(P.asgariUcret)}</td></tr>
        <tr><td>Günlük brüt</td><td>${tl(r2(P.asgariUcret / 30))}</td></tr>
        <tr><td>Saatlik brüt (225 saat)</td><td>${tl(r2(P.asgariUcret / 225))}</td></tr>
        <tr><td>SGK işçi payı (%14)</td><td>${tl(au12[0].sgk)}</td></tr>
        <tr><td>İşsizlik işçi payı (%1)</td><td>${tl(au12[0].issizlik)}</td></tr>
        <tr><td>Gelir vergisi / damga vergisi</td><td>0,00 TL (istisna)</td></tr>
        <tr><td><strong>Net asgari ücret</strong></td><td><strong>${tl(au12[0].net)}</strong></td></tr>
        <tr><td>SGK işveren payı (%16,75 teşvikli)</td><td>${tl(au12[0].isverenSgk)}</td></tr>
        <tr><td>İşsizlik işveren payı (%2)</td><td>${tl(au12[0].isverenIssizlik)}</td></tr>
        <tr><td><strong>İşverene toplam maliyet (teşvikli)</strong></td><td><strong>${tl(au12[0].maliyet)}</strong></td></tr>
        <tr><td>İşverene toplam maliyet (teşviksiz)</td><td>${tl(bordro12(P.asgariUcret, false)[0].maliyet)}</td></tr>
    </table></div>
    <h2>Asgari Ücret Vergi İstisnası</h2>
    <p>2022'den bu yana tüm ücretlilerin maaşının asgari ücrete isabet eden kısmı gelir vergisi ve damga vergisinden muaftır. Asgari ücretin üzerinde maaş alan çalışanlar da her ay asgari ücretin vergisi kadar indirimden yararlanır. ${YIL} yılında aylık damga vergisi istisnası ${tl(AU_DV_ISTISNA)}, gelir vergisi istisnası Ocak–Haziran ${tl(AU_GV_ISTISNA[0])}, Ağustos–Aralık ${tl(AU_GV_ISTISNA[11])}'dir.</p>
    ${tabloLinki}
    ${ilgiliRehberler(['/rehber/asgari-ucret-istisnasi-nedir/', '/rehber/bordro-nasil-okunur/'])}
    ${uyariMetni}
</section>`,
    sss: [SSS_ORTAK.asgari, SSS_ORTAK.istisna,
        ['Asgari ücretin işverene maliyeti ne kadar?', `5 puanlık teşvikle ${tl(au12[0].maliyet)}, teşviksiz ${tl(bordro12(P.asgariUcret, false)[0].maliyet)}'dir. Asgari ücret desteği gibi ek destekler bu tutara dahil değildir.`]]
});

// --- Brüt örnek sayfaları
function bordroTablosuStatik(satirlar) {
    const t = satirlar.reduce((a, r) => ({ net: a.net + r.net, gv: a.gv + r.gv, dv: a.dv + r.dv, k: a.k + r.sgk + r.issizlik, m: a.m + r.maliyet }), { net: 0, gv: 0, dv: 0, k: 0, m: 0 });
    return `<div class="table-wrap"><table>
        <thead><tr><th>Ay</th><th>SGK+İşsizlik</th><th>Kümülatif Matrah</th><th>Dilim</th><th>Gelir V.</th><th>Damga V.</th><th>Net</th><th>İşveren Maliyeti</th></tr></thead>
        <tbody>${satirlar.map(r => `<tr><td>${AYLAR[r.ay]}</td><td>${tl(r.sgk + r.issizlik)}</td><td>${tl(r.kumulatif)}</td><td>%${Math.round(dilimOrani(r.kumulatif) * 100)}</td><td>${tl(r.gv)}</td><td>${tl(r.dv)}</td><td>${tl(r.net)}</td><td>${tl(r.maliyet)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><th>Toplam</th><th>${tl(r2(t.k))}</th><th></th><th></th><th>${tl(r2(t.gv))}</th><th>${tl(r2(t.dv))}</th><th>${tl(r2(t.net))}</th><th>${tl(r2(t.m))}</th></tr></tfoot>
    </table></div>`;
}

function dilimAciklamasi(s) {
    const gecisler = [];
    for (let i = 1; i < 12; i++) {
        const once = dilimOrani(s[i - 1].kumulatif), simdi = dilimOrani(s[i].kumulatif);
        if (simdi > once) gecisler.push(`${AYLAR[i]} ayında kümülatif matrah ${yuzde(simdi)} dilimine geçiyor`);
    }
    if (dilimOrani(s[0].kumulatif) > 0.15) gecisler.unshift(`Ocak ayında matrah doğrudan ${yuzde(dilimOrani(s[0].kumulatif))} dilimine ulaşıyor`);
    return gecisler.length ? gecisler.join('; ') + '.' : 'Yıl boyunca kümülatif matrah %15 diliminde kalıyor.';
}

BRUT_ORNEKLER.forEach(b => {
    const s = bordro12(b, true);
    const yillikNet = r2(s.reduce((a, r) => a + r.net, 0));
    const ortalama = r2(yillikNet / 12);
    const yol = brutYol(b);
    ekle({
        yol,
        baslik: `${sayi(b)} TL Brüt Maaş Net Kaç TL? (${YIL}) | maas-hesaplama.com`,
        aciklama: `${YIL}'da ${sayi(b)} TL brüt maaş Ocak'ta ${tl(s[0].net)} net, Aralık'ta ${tl(s[11].net)} net. 12 aylık bordro, kesintiler ve işverene maliyet.`,
        h1: `${sayi(b)} TL Brüt Maaş Net Kaç TL? (${YIL})`,
        kirinti: [['/brut-net-maas-tablosu-2026/', 'Brüt–Net Tablosu'], [yol, `${sayi(b)} TL brüt`]],
        arac: false,
        robots: 'noindex, follow',
        icerik: `
${reklamUst}
<div class="kpi">
    <div><span>Ocak net</span><strong>${tl(s[0].net)}</strong></div>
    <div><span>Aralık net</span><strong>${tl(s[11].net)}</strong></div>
    <div><span>Aylık ortalama net</span><strong>${tl(ortalama)}</strong></div>
</div>
<section class="info">
    <p class="lead">${YIL} yılında aylık <strong>${tl(b)}</strong> brüt maaş alan bir çalışanın eline Ocak ayında <strong>${tl(s[0].net)}</strong> geçer. Yıl boyunca toplam net ${tl(yillikNet)}, aylık ortalama ${tl(ortalama)} olur. ${dilimAciklamasi(s)}</p>
    <h2>Ocak Ayı Kesintileri</h2>
    <div class="table-wrap"><table>
        <tr><td>Brüt maaş</td><td>${tl(b)}</td></tr>
        <tr><td>SGK işçi payı (%14)</td><td>${tl(s[0].sgk)}</td></tr>
        <tr><td>İşsizlik sigortası işçi payı (%1)</td><td>${tl(s[0].issizlik)}</td></tr>
        <tr><td>Gelir vergisi matrahı</td><td>${tl(s[0].matrah)}</td></tr>
        <tr><td>Hesaplanan gelir vergisi</td><td>${tl(s[0].hesGV)}</td></tr>
        <tr><td>Asgari ücret GV istisnası</td><td>− ${tl(s[0].istGV)}</td></tr>
        <tr><td>Ödenecek gelir vergisi</td><td>${tl(s[0].gv)}</td></tr>
        <tr><td>Ödenecek damga vergisi</td><td>${tl(s[0].dv)}</td></tr>
        <tr><td><strong>Net maaş</strong></td><td><strong>${tl(s[0].net)}</strong></td></tr>
        <tr><td>İşverene toplam maliyet (5 puan teşvikli)</td><td>${tl(s[0].maliyet)}</td></tr>
    </table></div>
    <h2>12 Aylık Bordro</h2>
    ${bordroTablosuStatik(s)}
    <p><a class="cta" href="/?brut=${b}">Bu tutarı hesaplayıcıda aç</a></p>
    ${brutOrnekLinkleri(yol)}
    ${uyariMetni}
</section>`,
        sss: [[`${sayi(b)} TL brüt maaş net kaç TL?`, `${YIL} yılında ${tl(b)} brüt maaşın Ocak ayı neti ${tl(s[0].net)}, Aralık ayı neti ${tl(s[11].net)}'dir. Aradaki fark, yıl içinde kümülatif vergi matrahının üst dilimlere geçmesinden kaynaklanır.`],
            [`${sayi(b)} TL brüt maaşın işverene maliyeti ne kadar?`, `5 puanlık SGK teşvikiyle aylık ${tl(s[0].maliyet)}, teşviksiz ${tl(bordro12(b, false)[0].maliyet)}'dir.`]]
    });
});

// --- Net örnek sayfaları
NET_ORNEKLER.forEach(n => {
    const brutOcak = nettenBrut(n, 0, true);
    const brutAralik = nettenBrut(n, 11, true);
    const aylik = AYLAR.map((ad, i) => [ad, nettenBrut(n, i, true)]);
    const s = bordro12(brutOcak, true);
    const yol = netYol(n);
    ekle({
        yol,
        baslik: `${sayi(n)} TL Net Maaş Brüt Kaç TL? (${YIL}) | maas-hesaplama.com`,
        aciklama: `${YIL}'da ${sayi(n)} TL net maaş için Ocak'ta ${tl(brutOcak)} brüt gerekir. Aylara göre gereken brüt, kesintiler ve işverene maliyet.`,
        h1: `${sayi(n)} TL Net Maaş Brüt Kaç TL? (${YIL})`,
        kirinti: [['/brut-net-maas-tablosu-2026/', 'Brüt–Net Tablosu'], [yol, `${sayi(n)} TL net`]],
        arac: false,
        robots: 'noindex, follow',
        icerik: `
${reklamUst}
<div class="kpi">
    <div><span>Ocak için gereken brüt</span><strong>${tl(brutOcak)}</strong></div>
    <div><span>Aralık için gereken brüt</span><strong>${tl(brutAralik)}</strong></div>
    <div><span>İşverene maliyet (Ocak)</span><strong>${tl(s[0].maliyet)}</strong></div>
</div>
<section class="info">
    <p class="lead">${YIL} yılında eline <strong>${tl(n)}</strong> net geçmesi için Ocak ayında <strong>${tl(brutOcak)}</strong> brüt maaş gerekir. Vergi dilimleri yıl içinde yükseldiğinden, aynı neti Aralık'ta alabilmek için brütün ${tl(brutAralik)} olması gerekir.</p>
    <h2>Aylara Göre Gereken Brüt Maaş</h2>
    <p>Aşağıdaki tutarlar, yıl başından o aya kadar her ay aynı brütün ödendiği varsayımıyla, o ay ${tl(n)} net sağlayan sabit brüt maaşı gösterir.</p>
    <div class="table-wrap"><table>
        <tr><th>Ay</th><th>Gereken brüt</th></tr>
        ${aylik.map(([ad, br]) => `<tr><td>${ad}</td><td>${tl(br)}</td></tr>`).join('')}
    </table></div>
    <h2>${tl(brutOcak)} Brüt ile 12 Aylık Bordro</h2>
    <p>Ocak ayında ${tl(n)} net veren brütle yıl boyunca sabit kalınırsa net maaş aşağıdaki gibi değişir:</p>
    ${bordroTablosuStatik(s)}
    <p><a class="cta" href="/netten-brute-maas-hesaplama/?net=${n}">Bu tutarı hesaplayıcıda aç</a></p>
    ${netOrnekLinkleri(yol)}
    ${uyariMetni}
</section>`,
        sss: [[`${sayi(n)} TL net maaş brüt kaç TL?`, `${YIL} yılında Ocak ayı için ${tl(brutOcak)}, Aralık ayı için ${tl(brutAralik)} brüt maaş gerekir.`],
            [`${sayi(n)} TL net maaşın işverene maliyeti nedir?`, `Ocak ayı için 5 puanlık SGK teşvikiyle yaklaşık ${tl(s[0].maliyet)}'dir.`]]
    });
});

// --- Döviz kurları
(() => {
    const k = KURLAR;
    const bul = kod => k && k.kurlar.find(x => x.kod === kod);
    const one = ['USD', 'EUR', 'GBP'];
    const kpi = k ? `<div class="kpi">
    ${one.map(kod => { const x = bul(kod); return x ? `<div><span>${x.isim} (${kod})</span><strong>${kurBicim(x.dovizSatis / x.birim)} TL</strong></div>` : ''; }).join('')}
    ${k.altin ? `<div><span>Gram altın (yaklaşık)</span><strong>${tl(k.altin.gramTL)}</strong></div>` : ''}
</div>` : '';
    const tablo = k ? `<div class="table-wrap"><table>
        <thead><tr><th>Döviz</th><th>Birim</th><th>Döviz Alış</th><th>Döviz Satış</th><th>Efektif Alış</th><th>Efektif Satış</th></tr></thead>
        <tbody>${k.kurlar.map(x => `<tr><td><strong>${x.kod}</strong> · ${x.isim}</td><td>${x.birim}</td><td>${kurBicim(x.dovizAlis)}</td><td>${kurBicim(x.dovizSatis)}</td><td>${x.efektifAlis ? kurBicim(x.efektifAlis) : '—'}</td><td>${x.efektifSatis ? kurBicim(x.efektifSatis) : '—'}</td></tr>`).join('')}</tbody>
    </table></div>` : '<p class="warn">Kurlar ilk otomatik güncellemeden sonra burada görünecek.</p>';
    const usd = bul('USD'), eur = bul('EUR');
    ekle({
        yol: '/doviz-kurlari/',
        baslik: `Döviz Kurları Bugün: Dolar, Euro, Sterlin (TCMB) | maas-hesaplama.com`,
        aciklama: k && usd && eur
            ? `TCMB ${k.tarih} döviz kurları: Dolar ${kurBicim(usd.dovizSatis)} TL, Euro ${kurBicim(eur.dovizSatis)} TL. Tüm dövizlerin alış-satış kurları, döviz çevirici ve gram altın.`
            : 'TCMB güncel döviz kurları: dolar, euro, sterlin ve diğer dövizlerin alış-satış kurları, döviz çevirici ve gram altın.',
        h1: 'Güncel Döviz Kurları (TCMB)',
        altBaslik: k ? `TCMB ${k.tarih} tarihli gösterge niteliğindeki kurlar${k.bultenNo ? ` · Bülten ${k.bultenNo}` : ''}` : 'TCMB gösterge niteliğindeki kurlar',
        kirinti: [['/doviz-kurlari/', 'Döviz Kurları']],
        icerik: `
${reklamUst}
${kpi}
<h2>Döviz Çevirici</h2>
<div class="grid-2">
    <div>
        <label for="dvMiktar">Tutar:</label>
        <input type="number" id="dvMiktar" value="100" min="0" step="0.01" inputmode="decimal">
    </div>
    <div>
        <label for="dvKaynak">Bu dövizden:</label>
        <select id="dvKaynak"></select>
    </div>
    <div>
        <label for="dvHedef">Bu dövize:</label>
        <select id="dvHedef"></select>
    </div>
</div>
<div class="result-box" id="dvSonucKutu" style="display:none;">
    <div class="result-item total"><span id="dvSonucEtiket"></span><strong id="dvSonuc"></strong></div>
    <div class="result-item sub"><span>Kullanılan kur:</span><span id="dvKurAciklama"></span></div>
</div>
<p class="hint">Dövizden TL'ye çevirmede TCMB döviz alış, TL'den dövize çevirmede döviz satış kuru kullanılır. Bankaların uyguladığı kurlar farklıdır.</p>
${reklamAlt}
<section class="info">
    <h2>TCMB Döviz Kurları Tablosu</h2>
    ${tablo}
    ${k && k.altin ? `<h2>Gram Altın</h2>
    <p>Gram altın yaklaşık <strong>${tl(k.altin.gramTL)}</strong> (ons altın ${tl(k.altin.onsTL)}${k.altin.tarih ? `, ${k.altin.tarih.split('-').reverse().join('.')}` : ''}). Bu değer uluslararası ons fiyatının gram karşılığıdır; kuyumcu ve banka fiyatları işçilik ve makas nedeniyle farklıdır.</p>` : ''}
    <h2>Döviz Alış, Satış ve Efektif Kur Ne Demek?</h2>
    <p><strong>Döviz alış/satış</strong> kurları, bankalar arası döviz işlemleri ve hesaplar arası transferler için TCMB'nin ilan ettiği gösterge kurlardır. <strong>Efektif</strong> kurlar ise nakit (banknot) döviz alım satımı içindir. TCMB kurları her iş günü saat 15:30 civarında ilan edilir ve ertesi gün resmî işlemlerde, örneğin dövizle ödenen maaşların TL karşılığının bulunmasında kullanılır.</p>
    <h2>Maaşınız Kaç Dolar?</h2>
    <p>${usd ? `Bugünkü kurla ${tl(P.asgariUcret * 0.85)} net asgari ücret yaklaşık <strong>${(P.asgariUcret * 0.85 / usd.dovizSatis * usd.birim).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} dolar</strong>, ${eur ? `<strong>${(P.asgariUcret * 0.85 / eur.dovizSatis * eur.birim).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} euro</strong> eder. ` : ''}` : ''}<a href="/">Brütten nete hesaplayıcıda</a> net maaşınızın dolar ve euro karşılığı da gösterilir.</p>
    <p class="warn">Kurlar her iş günü TCMB'nin yayınından sonra otomatik güncellenir. Gösterilen değerler bilgilendirme amaçlıdır; alım-satım işlemleri için bankanızın kurlarını esas alınız.</p>
</section>`,
        sss: [
            ['Dolar kuru bugün ne kadar?', k && usd ? `TCMB'nin ${k.tarih} tarihli kurlarına göre 1 ABD doları döviz alış ${kurBicim(usd.dovizAlis)} TL, döviz satış ${kurBicim(usd.dovizSatis)} TL'dir.` : 'Güncel dolar kuru bu sayfadaki tabloda TCMB verisiyle gösterilir.'],
            ['Euro kuru bugün ne kadar?', k && eur ? `TCMB'nin ${k.tarih} tarihli kurlarına göre 1 euro döviz alış ${kurBicim(eur.dovizAlis)} TL, döviz satış ${kurBicim(eur.dovizSatis)} TL'dir.` : 'Güncel euro kuru bu sayfadaki tabloda TCMB verisiyle gösterilir.'],
            ['TCMB kurları ne zaman açıklanır?', 'TCMB gösterge niteliğindeki döviz kurlarını her iş günü saat 15:30 civarında ilan eder. Hafta sonu ve resmî tatillerde yeni kur ilan edilmez, son ilan edilen kur geçerlidir.'],
            ['Bankadaki kur neden farklı?', 'TCMB kurları gösterge niteliğindedir. Bankalar ve döviz büroları kendi alış-satış makaslarını uygular ve kurları gün içinde piyasaya göre anlık günceller.']
        ]
    });
})();

// --- Ekonomi haberleri (dış kaynak başlıkları; arama motorlarında dizine eklenmez)
ekle({
    yol: '/ekonomi-haberleri/',
    baslik: 'Ekonomi Haberleri: Son Dakika Ekonomi Gündemi | maas-hesaplama.com',
    aciklama: 'Güncel ekonomi haberleri: maaş, vergi, enflasyon, faiz ve piyasalarla ilgili son gelişmeler. Başlıklar kaynak sitelere bağlantı verir.',
    h1: 'Ekonomi Haberleri',
    altBaslik: HABERLER ? `Son güncelleme: ${haberTarihi(HABERLER.guncellendi)} · Kaynak: ${HABERLER.kaynaklar.join(', ')}` : 'Güncel ekonomi başlıkları',
    kirinti: [['/ekonomi-haberleri/', 'Ekonomi Haberleri']],
    arac: false,
    robots: 'noindex, follow',
    icerik: `
${reklamUst}
<section class="info">
    ${HABERLER && HABERLER.haberler.length ? haberListesi(HABERLER.haberler, true) : '<p class="warn">Haberler ilk otomatik güncellemeden sonra burada görünecek.</p>'}
    <p class="hint">Haber başlıkları ve özetleri ${HABERLER ? HABERLER.kaynaklar.join(', ') : 'kaynak yayıncıların'} RSS yayınından otomatik alınır ve gün içinde birkaç kez güncellenir. Haberlerin tamamı ve tüm hakları kaynak yayıncıya aittir; başlığa tıkladığınızda haber kaynağında açılır.</p>
    <h2>Haberleri Hesaplayın</h2>
    <div class="links">
        <a href="/">Brütten nete maaş</a><a href="/netten-brute-maas-hesaplama/">Netten brüte maaş</a><a href="/kidem-tazminati-hesaplama/">Kıdem tazminatı</a><a href="/doviz-kurlari/">Döviz kurları</a><a href="/gelir-vergisi-dilimleri-2026/">Vergi dilimleri</a>
    </div>
</section>`
});

// --- Araçlar, brüt-net tablosu ve rehberler (ayrı dosyada)
require('./yeni-sayfalar.js')({
    P, AYLAR, tl, r2, bordro12, ekOdemeNeti, nettenBrut, izinGunu, AU_GV_ISTISNA, AU_DV_ISTISNA, AU_MATRAH,
    YIL, sayi, reklamUst, reklamAlt, uyariMetni, ilgiliRehberler, EDITOR, SITE, REHBER_BASLIK
}).forEach(ekle);

// --- Hakkımızda ve gizlilik
ekle({
    yol: '/hakkimizda/',
    baslik: 'Hakkımızda ve Editoryal İlkeler | maas-hesaplama.com',
    aciklama: 'maas-hesaplama.com hakkında: hesaplamaların dayandığı mevzuat, parametrelerin güncellenme süreci, editoryal ilkeler ve hata bildirimi.',
    h1: 'Hakkımızda ve Editoryal İlkeler',
    kirinti: [['/hakkimizda/', 'Hakkımızda']],
    arac: false,
    icerik: `
<section class="info">
    <p class="lead"><strong>maas-hesaplama.com</strong>, Türkiye'de ücretle çalışanların ve işverenlerin maaş, tazminat ve izin haklarını güncel mevzuata göre doğru ve anlaşılır biçimde hesaplayabilmesi için hazırlanmış ücretsiz bir hesaplama ve bilgi sitesidir.</p>

    <h2>Ne Sunuyoruz?</h2>
    <ul>
        <li><strong>Hesaplayıcılar:</strong> <a href="/">brütten nete</a>, <a href="/netten-brute-maas-hesaplama/">netten brüte</a>, <a href="/kidem-tazminati-hesaplama/">kıdem</a> ve <a href="/ihbar-tazminati-hesaplama/">ihbar tazminatı</a>, <a href="/fazla-mesai-hesaplama/">fazla mesai</a>, <a href="/yillik-izin-hesaplama/">yıllık izin</a>, <a href="/zam-hesaplama/">zam</a> ve <a href="/isveren-maliyeti-hesaplama/">işveren maliyeti</a>.</li>
        <li><strong>Rehberler:</strong> Bordrodaki rakamların nereden geldiğini örnek hesaplarla anlatan <a href="/rehber/">açıklayıcı yazılar</a>.</li>
        <li><strong>Referans tablolar:</strong> <a href="/brut-net-maas-tablosu-2026/">brüt–net maaş tablosu</a>, <a href="/gelir-vergisi-dilimleri-2026/">vergi dilimleri</a>, <a href="/asgari-ucret-2026/">asgari ücret</a> ve TCMB verisiyle <a href="/doviz-kurlari/">döviz kurları</a>.</li>
    </ul>

    <h2>Hesaplamalar Neye Dayanıyor?</h2>
    <p>Hesaplamalar 193 sayılı Gelir Vergisi Kanunu, 488 sayılı Damga Vergisi Kanunu, 5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu, 4447 sayılı İşsizlik Sigortası Kanunu, 4857 sayılı İş Kanunu ve 1475 sayılı İş Kanunu'nun 14. maddesi ile Resmî Gazete'de yayımlanan ve Hazine ve Maliye Bakanlığı, SGK ve Çalışma ve Sosyal Güvenlik Bakanlığı tarafından ilan edilen güncel parametrelere dayanır.</p>
    <p>Bordro hesabı her ay için ayrı yapılır: kümülatif gelir vergisi matrahı, asgari ücret gelir ve damga vergisi istisnası ve SGK prime esas kazanç tavanı ay ay uygulanır. Hesaplar tarayıcınızda çalışır; girdiğiniz tutarlar hiçbir sunucuya gönderilmez.</p>

    <h2>Editoryal İlkelerimiz</h2>
    <ul>
        <li><strong>Tek hesap motoru:</strong> Hesaplayıcılar, tablolar ve rehber yazılardaki örnek rakamlar aynı hesap motorundan üretilir. Bir parametre değiştiğinde tüm sayfalar birlikte güncellenir; yazılardaki rakamlarla araç sonuçları arasında çelişki oluşmaz.</li>
        <li><strong>Güncellik:</strong> Asgari ücret, vergi tarifesi, SGK tavanı ve kıdem tazminatı tavanı resmî olarak ilan edildikten sonra güncellenir. Her sayfada kullanılan parametre yılı ve son güncelleme tarihi belirtilir.</li>
        <li><strong>Kaynak gösterme:</strong> Yasal kurallar ilgili kanun maddesiyle birlikte anlatılır. Uygulamada tartışmalı veya kişisel duruma göre değişen konularda kesin hüküm vermek yerine bunu açıkça belirtir ve uzmana danışılmasını öneririz.</li>
        <li><strong>Bağımsızlık:</strong> Sitede yer alabilecek reklamlar içerikten ayrıdır; reklam verenler hesaplamaları veya yazıları etkilemez.</li>
        <li><strong>Dış içerik:</strong> Döviz kurları TCMB'nin yayımladığı verilerden, ekonomi haber başlıkları ise yayıncıların RSS akışlarından otomatik alınır ve kaynağı belirtilir.</li>
    </ul>

    <h2>Hata Bildirimi ve Düzeltmeler</h2>
    <p>Bir hesaplamada veya yazıda hata fark ederseniz ${ILETISIM_EPOSTA ? '<a href="/iletisim/">iletişim sayfasından</a>' : 'bize'} bildirebilirsiniz. Doğrulanan hatalar en kısa sürede düzeltilir ve ilgili sayfadaki güncelleme tarihi yenilenir.</p>

    <h2>${YIL} Parametreleri</h2>
    ${parametreTablosu()}
    <p class="hint">Son güncelleme: ${P.sonGuncelleme}. İçerikler ${EDITOR} tarafından hazırlanır.</p>
    ${uyariMetni}
</section>`
});

// --- İletişim (yalnızca e-posta tanımlıysa)
if (ILETISIM_EPOSTA) {
    const [kullanici, alan] = ILETISIM_EPOSTA.split('@');
    ekle({
        yol: '/iletisim/',
        baslik: 'İletişim | maas-hesaplama.com',
        aciklama: 'maas-hesaplama.com iletişim: hata bildirimi, öneri ve sorularınız için bize ulaşın.',
        h1: 'İletişim',
        kirinti: [['/iletisim/', 'İletişim']],
        arac: false,
        icerik: `
<section class="info">
    <p class="lead">Hesaplamalarla ilgili hata bildirimleriniz, yeni araç önerileriniz ve sorularınız için bize e-postayla ulaşabilirsiniz.</p>
    <p><strong>E-posta:</strong> <a id="eposta" href="#" data-k="${kullanici}" data-a="${alan}">adresi görmek için tıklayın</a></p>
    <p>Hata bildirirken hangi sayfayı kullandığınızı, girdiğiniz değerleri ve beklediğiniz sonucu yazarsanız inceleme daha hızlı olur. Kişisel bordro veya hukuki danışmanlık hizmeti vermediğimizi hatırlatırız; kişiye özel durumlarda bir mali müşavire veya avukata danışmanızı öneririz.</p>
</section>
<script>
(function () {
    var a = document.getElementById('eposta');
    a.addEventListener('click', function (e) {
        var adres = a.dataset.k + '@' + a.dataset.a;
        if (a.getAttribute('href') === '#') { e.preventDefault(); a.textContent = adres; a.setAttribute('href', 'mailto:' + adres); }
    });
})();
</script>`
    });
}

ekle({
    yol: '/gizlilik-politikasi/',
    baslik: 'Gizlilik Politikası | maas-hesaplama.com',
    aciklama: 'maas-hesaplama.com gizlilik politikası ve çerez kullanımı.',
    h1: 'Gizlilik Politikası',
    kirinti: [['/gizlilik-politikasi/', 'Gizlilik Politikası']],
    arac: false,
    icerik: `
<section class="info">
    <p>maas-hesaplama.com olarak ziyaretçilerimizin gizliliğine önem veriyoruz. Sitemizde yapılan tüm maaş ve tazminat hesaplamaları tamamen tarayıcınız (cihazınız) üzerinden gerçekleştirilmekte olup, girdiğiniz kişisel veya finansal veriler asla sunucularımızda saklanmaz veya kaydedilmez.</p>
    <h2>Üçüncü Taraf Reklamlar ve Çerezler</h2>
    <p>Sitemizde Google AdSense gibi üçüncü taraf reklam sağlayıcıları kullanılabilir. Bu sağlayıcılar, kullanıcıların bu siteye ve diğer sitelere yaptıkları geçmiş ziyaretlere dayalı reklamlar sunmak amacıyla çerezlerden (cookies) yararlanabilirler.</p>
    <p>Google'ın reklam çerezlerini kullanması, Google ve iş ortaklarının kullanıcılara bu siteye ve/veya internetteki diğer sitelere yaptıkları ziyaretlere dayalı reklam sunmasını sağlar. Kişiselleştirilmiş reklamları <a href="https://adssettings.google.com" rel="nofollow">Google Reklam Ayarları</a> üzerinden devre dışı bırakabilirsiniz.</p>
    <h2>Sunucu Kayıtları</h2>
    <p>Sitemiz GitHub Pages üzerinde barındırılmaktadır. Barındırma sağlayıcısı, güvenlik ve hizmetin sürekliliği amacıyla IP adresi gibi teknik bağlantı bilgilerini kaydedebilir.</p>
    <h2>Değişiklikler</h2>
    <p>Bu politika gerektiğinde güncellenebilir. Son güncelleme: ${P.sonGuncelleme}.</p>
</section>`
});

// ===================== YAZ =====================
function yaz(yol, icerik) {
    const dosya = yol.endsWith('/') ? path.join(KOK, yol, 'index.html') : path.join(KOK, yol);
    fs.mkdirSync(path.dirname(dosya), { recursive: true });
    fs.writeFileSync(dosya, icerik);
}

sayfalar.forEach(s => yaz(s.yol, sayfa(s)));

yaz('/404.html', sayfa({
    yol: '/404.html',
    baslik: 'Sayfa Bulunamadı | maas-hesaplama.com',
    aciklama: 'Aradığınız sayfa bulunamadı.',
    h1: 'Sayfa Bulunamadı',
    arac: false,
    icerik: `<section class="info"><p class="lead">Aradığınız sayfa taşınmış veya kaldırılmış olabilir.</p><p><a class="cta" href="/">Maaş hesaplama aracına git</a></p></section>`
}).replace('<link rel="canonical"', '<meta name="robots" content="noindex">\n    <link rel="canonical"'));

const oncelik = y => y === '/' ? '1.0' : (y.startsWith('/brut-maas/') || y.startsWith('/net-maas/')) ? '0.6' : ['/hakkimizda/', '/gizlilik-politikasi/'].includes(y) ? '0.3' : '0.9';
yaz('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sayfalar.filter(s => !s.robots).map(s => `  <url><loc>${SITE}${s.yol}</loc><lastmod>${s.yol === '/doviz-kurlari/' ? DOVIZ_LASTMOD : BUGUN}</lastmod><priority>${oncelik(s.yol)}</priority></url>`).join('\n')}
</urlset>
`);

yaz('/ads.txt', `google.com, pub-7621668742531802, DIRECT, f08c47fec0942fa0
`);

yaz('/robots.txt', `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

console.log(`${sayfalar.length} sayfa + 404, sitemap.xml ve robots.txt üretildi.`);
