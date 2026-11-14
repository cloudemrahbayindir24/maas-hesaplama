/*
 * Araç sayfaları (fazla mesai, yıllık izin, zam), birleşik brüt-net tablosu ve rehber yazıları.
 * build.js tarafından çağrılır; örneklerdeki tüm rakamlar hesap motorundan üretilir.
 */
module.exports = function (c) {
    const { P, AYLAR, tl, r2, bordro12, ekOdemeNeti, nettenBrut, izinGunu, YIL, sayi, reklamUst, reklamAlt,
        uyariMetni, ilgiliRehberler, EDITOR, SITE, REHBER_BASLIK } = c;
    const sayfalar = [];
    const ekle = s => sayfalar.push(s);
    const yuzde = (x, k = 1) => '%' + x.toLocaleString('tr-TR', { minimumFractionDigits: k, maximumFractionDigits: k });
    const ayKutusu = id => `<select id="${id}"></select>`;

    // ===================== BRÜT-NET TABLOSU =====================
    const brutler = [P.asgariUcret, 35000, 37500, 40000, 42500, 45000, 47500, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 100000, 110000, 120000, 130000, 140000, 150000, 175000, 200000, 250000, 300000];
    const brutSatirlari = brutler.map(b => {
        const s = bordro12(b, true);
        const yillikNet = r2(s.reduce((a, r) => a + r.net, 0));
        const kesinti = (1 - yillikNet / (b * 12)) * 100;
        return { b, ocak: s[0].net, temmuz: s[6].net, aralik: s[11].net, yillikNet, ort: r2(yillikNet / 12), kesinti, maliyet: s[0].maliyet };
    });
    const netler = [28075.5, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 70000, 75000, 80000, 90000, 100000, 125000, 150000];
    const netSatirlari = netler.map(n => ({ n, ocak: nettenBrut(n, 0, true), temmuz: nettenBrut(n, 6, true), aralik: nettenBrut(n, 11, true) }));
    const k50 = brutSatirlari.find(x => x.b === 50000), k150 = brutSatirlari.find(x => x.b === 150000), kAU = brutSatirlari[0];

    ekle({
        yol: '/brut-net-maas-tablosu-2026/',
        baslik: `${YIL} Brüt–Net Maaş Tablosu: Ay Ay Net Maaşlar | maas-hesaplama.com`,
        aciklama: `${YIL} brüt-net maaş tablosu: asgari ücretten 300.000 TL'ye kadar brüt maaşların Ocak, Temmuz, Aralık netleri, yıllık toplam net, gerçek kesinti oranı ve netten brüte karşılıklar.`,
        h1: `${YIL} Brüt–Net Maaş Tablosu`,
        kirinti: [['/brut-net-maas-tablosu-2026/', 'Brüt–Net Tablosu']],
        arac: false,
        icerik: `
${reklamUst}
<section class="info">
    <p class="lead">Bu tablo, yıl boyunca sabit brüt maaş alan bir çalışanın ${YIL} parametreleriyle hesaplanmış net maaşlarını gösterir. Tek bir "net" rakam yerine Ocak, Temmuz ve Aralık netlerini ayrı ayrı veriyoruz; çünkü kümülatif vergi dilimleri ve asgari ücret istisnası nedeniyle aynı brüt maaş yıl içinde farklı netlere dönüşür.</p>
    <h2>Brütten Nete: Ay Ay Net Maaşlar</h2>
    <div class="table-wrap"><table>
        <thead><tr><th>Brüt maaş</th><th>Ocak net</th><th>Temmuz net</th><th>Aralık net</th><th>Yıllık toplam net</th><th>Gerçek kesinti oranı</th><th>İşveren maliyeti</th></tr></thead>
        <tbody>${brutSatirlari.map(x => `<tr><td>${tl(x.b)}</td><td>${tl(x.ocak)}</td><td>${tl(x.temmuz)}</td><td>${tl(x.aralik)}</td><td>${tl(x.yillikNet)}</td><td>${yuzde(x.kesinti)}</td><td>${tl(x.maliyet)}</td></tr>`).join('')}</tbody>
    </table></div>
    <p class="hint">"Gerçek kesinti oranı", yıllık toplam brütten kesilen SGK, işsizlik, gelir ve damga vergisinin oranıdır. İşveren maliyeti 5 puanlık SGK teşviki uygulanmış aylık tutardır.</p>

    <h2>Tablodan Çıkan Sonuçlar</h2>
    <p><strong>Kesinti oranı maaşla birlikte artıyor.</strong> Asgari ücretli bir çalışanın brütünden yalnızca SGK ve işsizlik payı (${yuzde(kAU.kesinti)}) kesilirken, 50.000 TL brütte yıllık kesinti oranı ${yuzde(k50.kesinti)}, 150.000 TL brütte ${yuzde(k150.kesinti)} oluyor. Bunun nedeni, asgari ücret istisnasının herkese aynı tutarda uygulanması ve gelir vergisinin artan oranlı olmasıdır.</p>
    <p><strong>Ocak ile Aralık arasındaki fark yüksek maaşlarda büyüyor.</strong> 50.000 TL brütte Ocak ile Aralık neti arasında ${tl(r2(k50.ocak - k50.aralik))} fark varken, 150.000 TL brütte bu fark ${tl(r2(k150.ocak - k150.aralik))}'ye çıkıyor. Bütçe yaparken Ocak netini değil, yıllık ortalama neti (yıllık toplam net ÷ 12) esas almak daha gerçekçidir.</p>
    <p><strong>Temmuz bazı maaşlarda netin yükseldiği ay.</strong> Asgari ücretin kendi matrahı Temmuz'da %20 dilimine geçtiği için istisna tutarı artar. Bu yüzden bazı maaşlarda Temmuz neti Haziran netinden yüksek çıkar; ayrıntısı için <a href="/rehber/asgari-ucret-istisnasi-nedir/">asgari ücret istisnası rehberine</a> bakabilirsiniz.</p>

    <h2>Netten Brüte: Hedef Net İçin Gereken Brüt</h2>
    <p>Aşağıdaki tutarlar, yıl başından itibaren her ay aynı brüt ödendiği varsayımıyla, ilgili ayda hedef neti sağlayan brüt maaşı gösterir.</p>
    <div class="table-wrap"><table>
        <thead><tr><th>Hedef net</th><th>Ocak için brüt</th><th>Temmuz için brüt</th><th>Aralık için brüt</th></tr></thead>
        <tbody>${netSatirlari.map(x => `<tr><td>${tl(x.n)}</td><td>${tl(x.ocak)}</td><td>${tl(x.temmuz)}</td><td>${tl(x.aralik)}</td></tr>`).join('')}</tbody>
    </table></div>
    <p>Kendi tutarınızı ve ayınızı hesaplamak için <a href="/">brütten nete</a> veya <a href="/netten-brute-maas-hesaplama/">netten brüte</a> hesaplayıcıyı kullanabilirsiniz. Hesaplayıcı, sonucun altında 12 aylık bordro tablosunu da gösterir.</p>

    <h2>Tablo Hangi Varsayımlarla Hazırlandı?</h2>
    <p>Hesaplarda ${YIL} brüt asgari ücreti (${tl(P.asgariUcret)}), SGK prime esas kazanç tavanı (${tl(P.sgkTavan)}), ücret gelirleri için ${YIL} gelir vergisi tarifesi, asgari ücret gelir ve damga vergisi istisnası kullanılmıştır. Çalışanın normal (emekli olmayan) sigortalı olduğu, engellilik indirimi bulunmadığı, yıl içinde başka işverenden ücret almadığı ve yan ödemelerin brüte dahil olduğu varsayılmıştır.</p>
    ${ilgiliRehberler(['/rehber/bordro-nasil-okunur/', '/rehber/asgari-ucret-istisnasi-nedir/', '/rehber/is-teklifinde-net-brut-maas-pazarligi/'])}
    ${uyariMetni}
</section>`,
        sss: [
            [`${YIL}'de 50.000 TL brüt maaş net kaç TL?`, `Ocak'ta ${tl(k50.ocak)}, Temmuz'da ${tl(k50.temmuz)}, Aralık'ta ${tl(k50.aralik)}'dir. Yıllık ortalama net ${tl(k50.ort)} olur.`],
            ['Neden aynı brüt maaşın neti her ay farklı?', 'Gelir vergisi yıl başından itibaren biriken matraha göre artan oranlı hesaplanır. Matrah 190.000 TL, 400.000 TL gibi sınırları aştıkça vergi oranı yükselir ve net düşer. Asgari ücret istisnasının Temmuz\'da artması da bazı aylarda neti yükseltir.']
        ]
    });

    // ===================== FAZLA MESAİ =====================
    const fmOrnekBrut = 40000, fmSaatlik = r2(fmOrnekBrut / 225);
    const fmOrnek = ekOdemeNeti(fmOrnekBrut, r2(fmOrnekBrut / 225 * 1.5 * 10), 0, true);
    ekle({
        yol: '/fazla-mesai-hesaplama/',
        baslik: `Fazla Mesai Ücreti Hesaplama ${YIL} (Net ve Brüt) | maas-hesaplama.com`,
        aciklama: `${YIL} fazla mesai hesaplama: %50 zamlı fazla çalışma, %25 zamlı fazla sürelerle çalışma ve resmî tatil çalışması ücretini brüt ve net olarak, o ayın vergi dilimine göre hesaplayın.`,
        h1: `Fazla Mesai Ücreti Hesaplama ${YIL}`,
        kirinti: [['/fazla-mesai-hesaplama/', 'Fazla Mesai']],
        icerik: `
${reklamUst}
<p class="lead">Fazla mesai ücretinin brütünü hesaplamak kolaydır; asıl merak edilen ise elinize ne kadar geçeceğidir. Bu araç, fazla mesai ücretini o ayın maaşına ekleyip kümülatif vergi matrahınıza göre gerçek net etkisini hesaplar.</p>
<div class="grid-2">
    <div>
        <label for="fmBrut">Aylık Brüt Maaş (TL):</label>
        <input type="number" id="fmBrut" placeholder="Örn: 40000" min="0" step="0.01" inputmode="decimal">
    </div>
    <div>
        <label for="fmAy">Fazla Mesainin Ödendiği Ay:</label>
        ${ayKutusu('fmAy')}
    </div>
</div>
<div class="grid-2">
    <div>
        <label for="fmSaat50">Fazla çalışma (saat, %50 zamlı):</label>
        <input type="number" id="fmSaat50" placeholder="Haftalık 45 saati aşan" min="0" step="0.5" inputmode="decimal">
    </div>
    <div>
        <label for="fmSaat25">Fazla sürelerle çalışma (saat, %25 zamlı):</label>
        <input type="number" id="fmSaat25" placeholder="Sözleşme süresi ile 45 saat arası" min="0" step="0.5" inputmode="decimal">
    </div>
    <div>
        <label for="fmUbgt">Resmî tatilde çalışılan gün:</label>
        <input type="number" id="fmUbgt" placeholder="Ulusal bayram / genel tatil" min="0" step="0.5" inputmode="decimal">
    </div>
</div>
<button class="btn" id="btnFm">Fazla Mesaiyi Hesapla</button>
<div class="error" id="hataFm"></div>
<div class="result-box" id="fmSonuc" style="display:none;">
    <div class="result-item sub"><span>Saatlik brüt ücret (brüt ÷ 225):</span><span id="fmSaatlik"></span></div>
    <div class="result-item"><span>Fazla çalışma ücreti (×1,5):</span><strong id="fmT50"></strong></div>
    <div class="result-item"><span>Fazla sürelerle çalışma ücreti (×1,25):</span><strong id="fmT25"></strong></div>
    <div class="result-item"><span>Resmî tatil çalışma ücreti (ek günlük ücret):</span><strong id="fmTU"></strong></div>
    <div class="result-item"><span>Toplam brüt ek ödeme:</span><strong id="fmEk"></strong></div>
    <hr>
    <div class="result-item sub"><span>SGK + işsizlik kesintisi:</span><span id="fmSgk"></span></div>
    <div class="result-item sub"><span>Gelir vergisi:</span><span id="fmGV"></span></div>
    <div class="result-item sub"><span>Damga vergisi:</span><span id="fmDV"></span></div>
    <div class="result-item total"><span>Fazla mesaiden ele geçen net:</span><strong id="fmNet"></strong></div>
    <div class="result-item cost"><span id="fmAyEtiket">Toplam net maaş:</span><strong id="fmToplamNet"></strong></div>
    <div id="fmUyari"></div>
</div>
${reklamAlt}
<section class="info">
    <h2>Fazla Mesai Ücreti Nasıl Hesaplanır?</h2>
    <p>İş Kanunu'na göre haftalık çalışma süresi en fazla 45 saattir. Bu süreyi aşan her saat <strong>fazla çalışma</strong> sayılır ve saatlik ücretin %50 fazlasıyla ödenir. Sözleşmede haftalık süre 45 saatin altında belirlenmişse (ör. 40 saat), sözleşme süresi ile 45 saat arasındaki çalışmalar <strong>fazla sürelerle çalışma</strong> sayılır ve %25 zamlı ödenir.</p>
    <div class="table-wrap"><table>
        <tr><th>Çalışma türü</th><th>Hesap</th></tr>
        <tr><td>Saatlik brüt ücret</td><td>Aylık brüt ÷ 225</td></tr>
        <tr><td>Fazla çalışma (45 saati aşan)</td><td>Saatlik ücret × 1,5 × saat</td></tr>
        <tr><td>Fazla sürelerle çalışma</td><td>Saatlik ücret × 1,25 × saat</td></tr>
        <tr><td>Ulusal bayram / genel tatilde çalışma</td><td>Günlük ücret (brüt ÷ 30) × gün, maaşa ek olarak</td></tr>
    </table></div>
    <h2>Örnek: ${sayi(fmOrnekBrut)} TL Brüt Maaşla 10 Saat Fazla Mesai</h2>
    <p>Saatlik brüt ücret ${tl(fmSaatlik)}, %50 zamlı saat ücreti ${tl(r2(fmSaatlik * 1.5))} olur. 10 saatlik fazla mesainin brütü ${tl(r2(fmOrnekBrut / 225 * 1.5 * 10))}'dir. Bu tutar Ocak maaşına eklendiğinde ${tl(fmOrnek.sgk)} SGK ve işsizlik payı, ${tl(fmOrnek.gv)} gelir vergisi ve ${tl(fmOrnek.dv)} damga vergisi kesilir; ele geçen net <strong>${tl(fmOrnek.net)}</strong> olur. Aynı fazla mesai yılın sonlarında, kümülatif matrah daha yüksek dilimdeyken ödenirse net tutar daha düşük çıkar.</p>
    <h2>Bilinmesi Gerekenler</h2>
    <p>Yıllık fazla çalışma süresi 270 saati aşamaz ve fazla çalışma için çalışanın onayı gerekir. Çalışan isterse fazla çalıştığı her saat için ücret yerine 1 saat 30 dakika serbest zaman kullanabilir. Hafta tatili (genellikle Pazar) çalışmalarının ücretlendirilmesi işyeri uygulaması ve yargı kararlarına göre farklılık gösterebileceği için bu araçta ayrıca hesaplanmamıştır.</p>
    ${ilgiliRehberler(['/rehber/fazla-mesai-ucreti-nasil-hesaplanir/', '/rehber/bordro-nasil-okunur/'])}
    ${uyariMetni}
</section>`,
        sss: [
            ['Fazla mesai ücreti nasıl hesaplanır?', 'Aylık brüt maaş 225\'e bölünerek saatlik ücret bulunur. Haftalık 45 saati aşan her saat için saatlik ücretin 1,5 katı ödenir.'],
            ['Fazla mesaiden vergi kesilir mi?', 'Evet. Fazla mesai ücreti normal ücret gibi SGK primi, işsizlik sigortası, gelir vergisi ve damga vergisine tabidir. Gelir vergisi, o ayki kümülatif matrahınızın bulunduğu dilimden hesaplanır.'],
            ['Yılda en fazla kaç saat fazla mesai yapılabilir?', 'İş Kanunu\'na göre yıllık fazla çalışma süresi 270 saati aşamaz.'],
            ['Fazla mesai yerine izin kullanılabilir mi?', 'Evet. Çalışan isterse fazla çalıştığı her saat için 1 saat 30 dakika, fazla sürelerle çalıştığı her saat için 1 saat 15 dakika serbest zaman kullanabilir.']
        ]
    });

    // ===================== YILLIK İZİN =====================
    ekle({
        yol: '/yillik-izin-hesaplama/',
        baslik: `Yıllık İzin Hesaplama ${YIL}: İzin Günü ve Kullanılmayan İzin Ücreti | maas-hesaplama.com`,
        aciklama: `Yıllık izin hesaplama: işe giriş tarihinize göre her hizmet yılında hak ettiğiniz izin günü, kalan izniniz ve işten ayrılışta ödenecek kullanılmayan izin ücretinin brüt ve neti.`,
        h1: `Yıllık İzin Hesaplama ${YIL}`,
        kirinti: [['/yillik-izin-hesaplama/', 'Yıllık İzin']],
        icerik: `
${reklamUst}
<p class="lead">İşe giriş tarihinizi girin; her hizmet yılı için hak ettiğiniz izin gününü, toplam ve kalan izninizi görün. Brüt maaşınızı da girerseniz, işten ayrılırken ödenecek kullanılmayan izin ücretinin brütünü ve netini hesaplar.</p>
<div class="grid-2">
    <div>
        <label for="izGiris">İşe Giriş Tarihi:</label>
        <input type="date" id="izGiris">
    </div>
    <div>
        <label for="izCikis">Hesap / İşten Çıkış Tarihi:</label>
        <input type="date" id="izCikis">
    </div>
</div>
<div class="grid-2">
    <div>
        <label for="izKullanilan">Bugüne Kadar Kullanılan İzin (gün):</label>
        <input type="number" id="izKullanilan" placeholder="Örn: 20" min="0" step="1" inputmode="numeric">
    </div>
    <div>
        <label for="izBrut">Aylık Brüt Maaş (TL, isteğe bağlı):</label>
        <input type="number" id="izBrut" placeholder="İzin ücreti için" min="0" step="0.01" inputmode="decimal">
    </div>
</div>
<label class="check"><input type="checkbox" id="izYas"> 18 yaşından küçüğüm veya 50 yaşından büyüğüm (en az 20 gün)</label>
<button class="btn" id="btnIzin">İzni Hesapla</button>
<div class="error" id="hataIz"></div>
<div class="result-box" id="izSonuc" style="display:none;">
    <div class="result-item sub"><span>Hizmet süresi:</span><span id="izSure"></span></div>
    <div class="result-item"><span>Son tamamlanan yıl için izin hakkı:</span><strong id="izBuYil"></strong></div>
    <div class="result-item sub"><span>Bir sonraki yıl dolduğunda:</span><span id="izSonraki"></span></div>
    <div class="result-item"><span>Toplam hak edilen izin:</span><strong id="izToplam"></strong></div>
    <div class="result-item total"><span>Kalan izin:</span><strong id="izKalan"></strong></div>
    <div id="izUcretBlok" style="display:none;">
        <hr>
        <div class="result-item sub"><span>Günlük brüt ücret (brüt ÷ 30):</span><span id="izGunluk"></span></div>
        <div class="result-item"><span>Kullanılmayan izin ücreti (brüt):</span><strong id="izBrutUcret"></strong></div>
        <div class="result-item sub"><span>SGK + işsizlik kesintisi:</span><span id="izSgk"></span></div>
        <div class="result-item sub"><span>Gelir vergisi:</span><span id="izGV"></span></div>
        <div class="result-item sub"><span>Damga vergisi:</span><span id="izDV"></span></div>
        <div class="result-item cost"><span>Kullanılmayan izin ücreti (yaklaşık net):</span><strong id="izNet"></strong></div>
        <p class="hint" id="izNot"></p>
    </div>
    <details>
        <summary>Yıl yıl hak edilen izinler</summary>
        <div class="table-wrap"><table>
            <thead><tr><th>Hizmet yılı</th><th>Hak kazanma tarihi</th><th>İzin</th></tr></thead>
            <tbody id="izTablo"></tbody>
        </table></div>
    </details>
</div>
${reklamAlt}
<section class="info">
    <h2>Kıdeme Göre Yıllık İzin Süreleri</h2>
    <div class="table-wrap"><table>
        <tr><th>Hizmet süresi</th><th>En az izin</th></tr>
        <tr><td>1 yıldan 5 yıla kadar (5 yıl dahil)</td><td>14 gün</td></tr>
        <tr><td>5 yıldan fazla, 15 yıldan az</td><td>20 gün</td></tr>
        <tr><td>15 yıl (dahil) ve üzeri</td><td>26 gün</td></tr>
        <tr><td>18 yaşından küçük veya 50 yaşından büyük</td><td>En az 20 gün</td></tr>
    </table></div>
    <p>Yıllık izne hak kazanmak için deneme süresi dahil en az 1 yıl çalışmış olmak gerekir. Bu süreler kanunun öngördüğü en az sürelerdir; iş sözleşmesi veya toplu iş sözleşmesiyle artırılabilir, azaltılamaz. İzin süresine denk gelen hafta tatili, ulusal bayram ve genel tatil günleri izinden sayılmaz. Yer altı işlerinde süreler dörder gün artırılır.</p>
    <h2>Kullanılmayan İzin Ücreti Nasıl Hesaplanır?</h2>
    <p>Çalışırken yıllık izin paraya çevrilemez. İş sözleşmesi herhangi bir nedenle sona erdiğinde ise kullanılmamış izin günlerinin ücreti, son brüt ücret üzerinden ödenir: <strong>(Aylık brüt ÷ 30) × kullanılmayan gün</strong>. Bu ödeme ücret niteliğinde olduğu için SGK ve işsizlik primi, gelir vergisi ve damga vergisine tabidir. Gelir vergisi, ödemenin yapıldığı ayki kümülatif matrahınıza göre hesaplanır.</p>
    <p>Kullanılmayan izin ücreti alacağı, iş sözleşmesinin sona erdiği tarihten itibaren 5 yıllık zamanaşımına tabidir.</p>
    ${ilgiliRehberler(['/rehber/kidem-tazminati-kimlere-odenir/', '/rehber/bordro-nasil-okunur/'])}
    ${uyariMetni}
</section>`,
        sss: [
            ['Yıllık izin kaç gün?', '1–5 yıl (5 yıl dahil) hizmette 14 gün, 5–15 yıl arasında 20 gün, 15 yıl ve üzerinde 26 gündür. 18 yaşından küçük ve 50 yaşından büyük çalışanlar en az 20 gün izin alır.'],
            ['Kullanılmayan yıllık izin ücretinden kesinti yapılır mı?', 'Evet. Kullanılmayan izin ücreti ücret niteliğinde olduğundan SGK ve işsizlik primi, gelir vergisi ve damga vergisi kesilir.'],
            ['İstifa eden kullanılmayan izin ücretini alabilir mi?', 'Evet. İş sözleşmesi hangi nedenle sona ererse ersin, kullanılmamış yıllık izin günlerinin ücreti ödenir.']
        ]
    });

    // ===================== ZAM =====================
    const zmOrnekB = 45000, zmOrnekO = 25;
    const zmE = bordro12(zmOrnekB, true)[0], zmY = bordro12(r2(zmOrnekB * 1.25), true)[0];
    const zmNetOran = (zmY.net / zmE.net - 1) * 100;
    ekle({
        yol: '/zam-hesaplama/',
        baslik: `Maaş Zammı Hesaplama ${YIL}: Brüt Zam Netime Ne Kadar Yansır? | maas-hesaplama.com`,
        aciklama: `Maaş zammı hesaplama: brüt maaşa yapılan zammın net maaşınıza kaç TL ve yüzde kaç yansıdığını, işverene maliyetini ve enflasyona göre reel değişimi hesaplayın.`,
        h1: `Maaş Zammı Hesaplama ${YIL}`,
        kirinti: [['/zam-hesaplama/', 'Zam Hesaplama']],
        icerik: `
${reklamUst}
<p class="lead">Brüt maaşınıza yapılan zam, netinize aynı oranda yansımaz. Mevcut brüt maaşınızı ve zam oranını girin; yeni netinizi, net artışın gerçek oranını ve isterseniz enflasyona göre alım gücünüzün nasıl değiştiğini görün.</p>
<div class="grid-2">
    <div>
        <label for="zmBrut">Mevcut Brüt Maaş (TL):</label>
        <input type="number" id="zmBrut" placeholder="Örn: 45000" min="0" step="0.01" inputmode="decimal">
    </div>
    <div>
        <label for="zmOran">Brüt Zam Oranı (%):</label>
        <input type="number" id="zmOran" placeholder="Örn: 25" step="0.1" inputmode="decimal">
    </div>
    <div>
        <label for="zmAy">Karşılaştırılacak Ay:</label>
        ${ayKutusu('zmAy')}
    </div>
    <div>
        <label for="zmEnf">Yıllık Enflasyon (%, isteğe bağlı):</label>
        <input type="number" id="zmEnf" placeholder="Reel değişim için" step="0.1" inputmode="decimal">
    </div>
</div>
<button class="btn" id="btnZam">Zammı Hesapla</button>
<div class="error" id="hataZm"></div>
<div class="result-box" id="zmSonuc" style="display:none;">
    <div class="result-item"><span>Yeni brüt maaş:</span><strong id="zmYeniBrut"></strong></div>
    <div class="result-item sub"><span id="zmAyEtiket1">Eski net:</span><span id="zmEskiNet"></span></div>
    <div class="result-item"><span id="zmAyEtiket2">Yeni net:</span><strong id="zmYeniNet"></strong></div>
    <div class="result-item total"><span>Net artış:</span><strong id="zmNetArtis"></strong></div>
    <div class="result-item" id="zmReelSatir" style="display:none;"><span>Reel (enflasyondan arındırılmış) değişim:</span><strong id="zmReel"></strong></div>
    <div class="result-item cost"><span>İşverene maliyet:</span><strong id="zmMaliyet"></strong></div>
</div>
${reklamAlt}
<section class="info">
    <h2>Brüt Zam Neden Nete Aynı Oranda Yansımaz?</h2>
    <p>Asgari ücret istisnası her çalışana aynı TL tutarında uygulanır. Brüt maaş arttıkça bu sabit indirimin maaşa oranı küçülür; ayrıca artan matrah üst vergi dilimine daha erken geçer. Sonuç olarak brüt zammın nete yansıma oranı, zam oranından genellikle biraz düşük olur.</p>
    <p><strong>Örnek:</strong> ${sayi(zmOrnekB)} TL brüt maaşa %${zmOrnekO} zam yapıldığında yeni brüt ${tl(r2(zmOrnekB * 1.25))} olur. Ocak ayında net ${tl(zmE.net)}'den ${tl(zmY.net)}'ye çıkar; yani net artış ${yuzde(zmNetOran)} olur.</p>
    <h2>Reel Zam Nasıl Hesaplanır?</h2>
    <p>Zammın alım gücünüze etkisini görmek için net artışı enflasyonla karşılaştırmak gerekir: <strong>Reel değişim = (1 + net artış oranı) ÷ (1 + enflasyon) − 1</strong>. Örneğin net maaşınız %30 artarken yıllık enflasyon %35 ise, reel olarak yaklaşık %3,7 kayıp yaşarsınız. Enflasyon oranını TÜİK'in açıkladığı yıllık TÜFE değerinden alabilirsiniz.</p>
    <h2>Zam Görüşmesinde Nelere Dikkat Edilmeli?</h2>
    <p>Zam oranının brüt mü net mi olduğunu netleştirin. Net üzerinden konuşuluyorsa, yıl içindeki vergi dilimi değişimleri nedeniyle hangi ayın netinin esas alınacağını sorun. Ayrıntılı öneriler için <a href="/rehber/is-teklifinde-net-brut-maas-pazarligi/">net-brüt maaş pazarlığı rehberine</a> bakabilirsiniz.</p>
    ${ilgiliRehberler(['/rehber/is-teklifinde-net-brut-maas-pazarligi/', '/rehber/asgari-ucret-istisnasi-nedir/'])}
    ${uyariMetni}
</section>`,
        sss: [
            ['Brüt maaşa yapılan zam nete aynı oranda yansır mı?', 'Hayır. Asgari ücret istisnasının sabit tutarda olması ve artan oranlı gelir vergisi nedeniyle net artış oranı genellikle brüt zam oranından biraz düşük olur.'],
            ['Reel zam nedir?', 'Reel zam, maaş artışının enflasyondan arındırılmış halidir. Net maaş artışı enflasyonun altında kalırsa, maaş TL olarak artsa da alım gücü azalır.']
        ]
    });

    // ===================== REHBERLER =====================
    const rehberler = [];
    function rehber({ yol, ozet, okuma, govde, sss = [] }) {
        const baslik = REHBER_BASLIK[yol];
        rehberler.push({ yol, baslik, ozet });
        const ld = {
            '@context': 'https://schema.org', '@type': 'Article', headline: baslik, description: ozet,
            datePublished: '2026-11-14', dateModified: '2026-11-14',
            author: { '@type': 'Organization', name: EDITOR, url: SITE + '/hakkimizda/' },
            publisher: { '@type': 'Organization', name: 'maas-hesaplama.com', url: SITE + '/' },
            mainEntityOfPage: SITE + yol
        };
        ekle({
            yol,
            baslik: `${baslik} | maas-hesaplama.com`,
            aciklama: ozet,
            h1: baslik,
            altBaslik: `${EDITOR} · 14 Kasım 2026 · ${okuma} dk okuma · ${YIL} parametreleriyle`,
            kirinti: [['/rehber/', 'Rehberler'], [yol, baslik.split('?')[0].split(':')[0]]],
            arac: false,
            icerik: `
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${reklamUst}
<article class="info makale">
${govde}
${uyariMetni}
</article>`,
            sss
        });
    }

    // --- Bordro nasıl okunur
    const b50 = bordro12(50000, true), b50o = b50[0];
    rehber({
        yol: '/rehber/bordro-nasil-okunur/',
        okuma: 7,
        ozet: 'Maaş bordrosundaki brüt ücret, SGK primi, işsizlik sigortası, gelir vergisi matrahı, kümülatif matrah, asgari ücret istisnası ve net ödenen tutar satırlarının ne anlama geldiğini örnek bir bordro üzerinden anlatıyoruz.',
        govde: `
<p class="lead">Bordro, işvereninizin her ay maaşınızı nasıl hesapladığını gösteren belgedir. İlk bakışta karmaşık görünse de bütün satırlar basit bir sırayı takip eder: brütten önce sigorta primleri düşülür, kalan tutardan vergi hesaplanır, istisnalar düşülür ve geriye net ücret kalır. Bu rehberde ${YIL} yılında 50.000 TL brüt maaş alan bir çalışanın Ocak bordrosunu satır satır inceliyoruz.</p>

<h2>Örnek Bordro: 50.000 TL Brüt, Ocak ${YIL}</h2>
<div class="table-wrap"><table>
    <tr><th>Bordro satırı</th><th>Tutar</th></tr>
    <tr><td>Brüt ücret</td><td>${tl(b50o.brut)}</td></tr>
    <tr><td>SGK işçi payı (%14)</td><td>${tl(b50o.sgk)}</td></tr>
    <tr><td>İşsizlik sigortası işçi payı (%1)</td><td>${tl(b50o.issizlik)}</td></tr>
    <tr><td>Gelir vergisi matrahı</td><td>${tl(b50o.matrah)}</td></tr>
    <tr><td>Kümülatif gelir vergisi matrahı</td><td>${tl(b50o.kumulatif)}</td></tr>
    <tr><td>Hesaplanan gelir vergisi</td><td>${tl(b50o.hesGV)}</td></tr>
    <tr><td>Asgari ücret gelir vergisi istisnası</td><td>${tl(b50o.istGV)}</td></tr>
    <tr><td>Ödenecek gelir vergisi</td><td>${tl(b50o.gv)}</td></tr>
    <tr><td>Hesaplanan damga vergisi</td><td>${tl(b50o.hesDV)}</td></tr>
    <tr><td>Asgari ücret damga vergisi istisnası</td><td>${tl(b50o.istDV)}</td></tr>
    <tr><td>Ödenecek damga vergisi</td><td>${tl(b50o.dv)}</td></tr>
    <tr><td><strong>Net ödenen</strong></td><td><strong>${tl(b50o.net)}</strong></td></tr>
</table></div>

<h2>1. Brüt Ücret ve Ek Ödemeler</h2>
<p>Bordronun ilk bölümünde sözleşmenizdeki brüt ücret ve varsa o aya ait ek ödemeler yer alır: fazla mesai, prim, ikramiye, nakit yemek veya yol yardımı gibi. Bunların toplamı "brüt kazanç" ya da "toplam brüt" olarak görünür. Kesintilerin tamamı bu toplam üzerinden hesaplanır. Çalışılan gün sayısı da bu bölümdedir; ay içinde işe başladıysanız veya ücretsiz izin kullandıysanız brüt ücret gün sayısına göre orantılanır.</p>

<h2>2. SGK İşçi Payı ve İşsizlik Sigortası</h2>
<p>Brüt kazancın %14'ü SGK işçi payı, %1'i işsizlik sigortası işçi payı olarak kesilir. Bu kesintiler emeklilik, sağlık ve işsizlik sigortası haklarınızın karşılığıdır ve "prime esas kazanç" üzerinden hesaplanır. Prime esas kazancın ${YIL} için aylık bir üst sınırı vardır (${tl(P.sgkTavan)}); bu tutarın üzerindeki maaşlarda prim yalnızca tavana kadar olan kısımdan kesilir. Örneğimizde ${tl(b50o.sgk)} SGK ve ${tl(b50o.issizlik)} işsizlik payı kesilmiştir.</p>

<h2>3. Gelir Vergisi Matrahı ve Kümülatif Matrah</h2>
<p>Brüt ücretten SGK ve işsizlik payları düşüldükten sonra kalan tutar <strong>gelir vergisi matrahıdır</strong>. Bordrodaki en önemli satırlardan biri ise <strong>kümülatif matrahtır</strong>: yıl başından o aya kadar tüm aylardaki matrahların toplamı. Gelir vergisi bu birikimli tutara göre artan oranlı uygulanır. Kümülatif matrah 190.000 TL'yi aştığında %20, 400.000 TL'yi aştığında %27 dilimine geçilir. Örnek çalışanımızın kümülatif matrahı yıl boyunca şöyle ilerler: Haziran sonunda ${tl(b50[5].kumulatif)}, Aralık sonunda ${tl(b50[11].kumulatif)}.</p>
<p>Bu yüzden aynı brüt maaşla yılın ilk aylarında daha yüksek, son aylarında daha düşük net alırsınız. Örnek çalışanın Ocak neti ${tl(b50[0].net)} iken Aralık neti ${tl(b50[11].net)} olur. Yıl içinde iş değiştirdiyseniz, yeni işyerindeki kümülatif matrahın nasıl başlatıldığını bordro biriminize sormanızda fayda var; birden fazla işverenden ücret alınan yıllarda beyanname yükümlülüğü doğabilir.</p>

<h2>4. Hesaplanan Gelir Vergisi ve Asgari Ücret İstisnası</h2>
<p>Matrahın vergi dilimine göre vergisi "hesaplanan gelir vergisi" satırında görünür. Ardından <strong>asgari ücret gelir vergisi istisnası</strong> düşülür: asgari ücretin o ayki gelir vergisi kadar tutar, her çalışanın vergisinden indirilir. Örneğimizde hesaplanan ${tl(b50o.hesGV)} vergiden ${tl(b50o.istGV)} istisna düşülmüş ve ödenecek gelir vergisi ${tl(b50o.gv)} olmuştur. İstisnanın nasıl hesaplandığını <a href="/rehber/asgari-ucret-istisnasi-nedir/">asgari ücret istisnası rehberinde</a> ayrıntılı anlatıyoruz.</p>

<h2>5. Damga Vergisi</h2>
<p>Damga vergisi brüt kazancın ‰7,59'udur (binde 7,59). Asgari ücrete isabet eden damga vergisi (${tl(P.asgariUcret)} × ‰7,59 = ${tl(c.AU_DV_ISTISNA)}) istisna olarak düşülür. Örneğimizde ${tl(b50o.hesDV)} damga vergisinden istisna düşülünce ${tl(b50o.dv)} ödenir.</p>

<h2>6. Net Ödenen ve İşveren Maliyeti</h2>
<p>Net ödenen tutar, brüt kazançtan SGK payı, işsizlik payı, ödenecek gelir vergisi ve ödenecek damga vergisinin düşülmesiyle bulunur. Bazı bordrolarda bunun altında avans, icra kesintisi, sendika aidatı veya bireysel emeklilik (BES) kesintisi de görünür; bunlar vergi hesabını etkilemez, yalnızca hesabınıza yatan tutarı azaltır.</p>
<p>Bordronun işveren bölümünde ise SGK işveren payı (%21,75; teşvikle %16,75) ve işsizlik işveren payı (%2) yer alır. Bunlar maaşınızdan kesilmez, işveren tarafından ayrıca ödenir. Örneğimizde işverenin toplam maliyeti ${tl(b50o.maliyet)}'dir.</p>

<h2>Bordronuzu Kontrol Etmek İçin Kısa Liste</h2>
<ul>
    <li>Çalışılan gün sayısı doğru mu? Eksik gün varsa nedeni belirtilmiş mi?</li>
    <li>Brüt ücret sözleşmenizdeki tutarla aynı mı?</li>
    <li>Kümülatif matrah bir önceki ayın kümülatifine bu ayın matrahı eklenerek bulunmuş mu?</li>
    <li>Asgari ücret gelir ve damga vergisi istisnası uygulanmış mı?</li>
    <li>Fazla mesai yaptıysanız saatleri ve tutarı bordroda ayrıca görünüyor mu?</li>
</ul>
<p>Kendi bordronuzu karşılaştırmak için <a href="/">brütten nete hesaplayıcıya</a> brüt maaşınızı girip ayı seçebilirsiniz; sonuç ekranı bordrodaki satırların aynısını gösterir.</p>`,
        sss: [
            ['Bordrodaki kümülatif matrah ne demek?', 'Yıl başından o aya kadar tüm aylarda oluşan gelir vergisi matrahlarının toplamıdır. Gelir vergisi dilimi bu toplama göre belirlenir.'],
            ['Bordroda net maaş neden aydan aya değişiyor?', 'Kümülatif matrah dilim sınırlarını aştıkça gelir vergisi oranı yükselir. Ayrıca fazla mesai, prim ve eksik gün gibi kalemler de neti değiştirir.']
        ]
    });

    // --- Asgari ücret istisnası
    const ist = c.AU_GV_ISTISNA;
    const b60 = bordro12(60000, true);
    rehber({
        yol: '/rehber/asgari-ucret-istisnasi-nedir/',
        okuma: 6,
        ozet: `Asgari ücret gelir ve damga vergisi istisnası nedir, kimlere uygulanır, ${YIL} yılında aylık tutarı ne kadardır ve Temmuz'dan itibaren neden artar? Örnek hesaplarla anlatıyoruz.`,
        govde: `
<p class="lead">2022'den bu yana Türkiye'de ücretle çalışan herkesin maaşının asgari ücrete isabet eden kısmı gelir vergisi ve damga vergisinden muaftır. Bu düzenleme yalnızca asgari ücretlileri değil, asgari ücretin üzerinde maaş alan tüm çalışanları kapsar ve net maaşı doğrudan etkiler. Ancak istisna tutarı yıl içinde sabit değildir.</p>

<h2>İstisna Nasıl Çalışır?</h2>
<p>Bordroda gelir vergisi önce maaşınızın tamamı üzerinden hesaplanır. Sonra bu tutardan, aynı ay için asgari ücretlinin ödeyeceği gelir vergisi kadar indirim yapılır. Damga vergisinde de brüt asgari ücretin damga vergisi (${tl(c.AU_DV_ISTISNA)}) düşülür. Yani her çalışan, asgari ücret kadar kısmı için vergi ödememiş olur.</p>
<p>Asgari ücretli bir çalışanın ${YIL} matrahı ${tl(c.AU_MATRAH)}'dir (${tl(P.asgariUcret)} brütten %15 SGK ve işsizlik payı düşülmüş hali). İstisna tutarı, bu matrahın o ayki vergisidir.</p>

<h2>${YIL} Aylık Gelir Vergisi İstisnası Tutarları</h2>
<div class="table-wrap"><table>
    <tr><th>Ay</th><th>Asgari ücretlinin kümülatif matrahı</th><th>Gelir vergisi istisnası</th></tr>
    ${AYLAR.map((a, i) => `<tr><td>${a}</td><td>${tl(r2(c.AU_MATRAH * (i + 1)))}</td><td>${tl(ist[i])}</td></tr>`).join('')}
</table></div>

<h2>İstisna Neden Temmuz'da Artıyor?</h2>
<p>İstisna, asgari ücretlinin kendi kümülatif matrahına göre hesaplanır. Bu matrah Haziran sonunda ${tl(r2(c.AU_MATRAH * 6))}'ye ulaşır; Temmuz'da 190.000 TL'lik ilk dilim sınırı aşılır. Bu nedenle Temmuz istisnası ${tl(ist[6])}'ye, Ağustos–Aralık istisnası ise ${tl(ist[7])}'ye çıkar. Ocak–Haziran döneminde istisna ${tl(ist[0])}'dir.</p>
<p>Bunun sonucu ilginçtir: bazı maaşlarda Temmuz neti, Haziran netinden <em>yüksek</em> çıkar. Örneğin 60.000 TL brüt maaşta Haziran neti ${tl(b60[5].net)}, Temmuz neti ${tl(b60[6].net)} olur. Kendi matrahınız da üst dilime geçtiyse bu artış dengelenebilir veya net düşmeye devam edebilir.</p>

<h2>Örnek Hesap: 60.000 TL Brüt, Ocak</h2>
<p>SGK ve işsizlik payı ${tl(r2(b60[0].sgk + b60[0].issizlik))} düşülünce matrah ${tl(b60[0].matrah)} olur. Bunun %15'i olan ${tl(b60[0].hesGV)} hesaplanan vergiden ${tl(b60[0].istGV)} istisna düşülür; ödenecek gelir vergisi ${tl(b60[0].gv)} kalır. Damga vergisinde ${tl(b60[0].hesDV)}'den ${tl(b60[0].istDV)} düşülür; ${tl(b60[0].dv)} ödenir. Net maaş ${tl(b60[0].net)}'dir. İstisna olmasaydı aynı çalışan ayda ${tl(r2(b60[0].istGV + b60[0].istDV))} daha fazla vergi öderdi.</p>

<h2>Sık Karşılaşılan Durumlar</h2>
<p><strong>Ay içinde işe başlayanlar:</strong> Uygulamada istisna, çalışılan gün sayısına göre orantılanır. Ayın ortasında işe başlayan bir çalışanın o ayki istisnası tam ayın yaklaşık yarısı kadar olur.</p>
<p><strong>Birden fazla işverenden ücret alanlar:</strong> İstisnanın nasıl uygulanacağı ve yıllık beyanname yükümlülüğü kişisel duruma göre değişir. Bu durumda bir mali müşavire danışmanız önerilir.</p>
<p><strong>Kıdem tazminatı:</strong> Kıdem tazminatından zaten gelir vergisi kesilmez; yalnızca damga vergisi kesilir.</p>
<p>Kendi maaşınızda istisnanın etkisini görmek için <a href="/">brütten nete hesaplayıcıyı</a> kullanabilirsiniz; sonuç ekranında istisna tutarı ayrı satırda gösterilir.</p>`,
        sss: [
            ['Asgari ücret istisnası kimlere uygulanır?', 'Ücretle çalışan herkese uygulanır. Maaşı asgari ücretin üzerinde olan çalışanlar da asgari ücrete isabet eden kısım için gelir ve damga vergisi ödemez.'],
            [`${YIL} asgari ücret gelir vergisi istisnası ne kadar?`, `Ocak–Haziran ${tl(ist[0])}, Temmuz ${tl(ist[6])}, Ağustos–Aralık ${tl(ist[7])}'dir. Damga vergisi istisnası her ay ${tl(c.AU_DV_ISTISNA)}'dir.`]
        ]
    });

    // --- Kıdem tazminatı kimlere ödenir
    const kTavan = P.kidemTavanlari[P.kidemTavanlari.length - 1][1];
    const kOrnek1 = r2(55000 * (6 + 4 / 12)), kOrnek2 = r2(kTavan * (10 + 3 / 12));
    rehber({
        yol: '/rehber/kidem-tazminati-kimlere-odenir/',
        okuma: 8,
        ozet: 'Kıdem tazminatına hak kazanma şartları, istifa eden çalışanın tazminat alabileceği durumlar, giydirilmiş ücret, kıdem tavanı, kesintiler ve zamanaşımı; örnek hesaplarla.',
        govde: `
<p class="lead">Kıdem tazminatı, belirli şartlarla işten ayrılan çalışana her tam hizmet yılı için 30 günlük ücreti tutarında yapılan ödemedir. Dayanağı hâlâ yürürlükte olan 1475 sayılı İş Kanunu'nun 14. maddesidir. Tazminatın tutarı kolay hesaplanır; asıl önemli olan hangi durumlarda hak kazanıldığıdır.</p>

<h2>Temel Şartlar</h2>
<p>Kıdem tazminatı için iki şartın birlikte gerçekleşmesi gerekir:</p>
<ul>
    <li><strong>En az 1 yıl çalışma:</strong> Aynı işverene bağlı işyerlerinde, deneme süresi dahil en az 1 yıl çalışmış olmak.</li>
    <li><strong>Kanunda sayılan bir sona erme nedeni:</strong> İş sözleşmesinin aşağıdaki hallerden biriyle sona ermesi.</li>
</ul>

<h2>Hangi Durumlarda Kıdem Tazminatı Ödenir?</h2>
<ul>
    <li>İşverenin, ahlak ve iyi niyet kurallarına aykırılık (ör. hırsızlık, işyerinde kavga) dışındaki bir nedenle sözleşmeyi feshetmesi.</li>
    <li>Çalışanın haklı nedenle feshi: ücretin ödenmemesi, mobbing, sağlık nedenleri, çalışma koşullarının esaslı şekilde değiştirilmesi gibi.</li>
    <li>Askerlik görevi nedeniyle işten ayrılma.</li>
    <li>Emeklilik (yaşlılık aylığı) veya toptan ödeme almak amacıyla ayrılma.</li>
    <li>Emeklilik için yaş dışındaki şartları (sigortalılık süresi ve prim günü) tamamlayıp ayrılma; SGK'dan alınan "kıdem tazminatı alabilir" yazısıyla.</li>
    <li>Kadın çalışanın evlendiği tarihten itibaren 1 yıl içinde kendi isteğiyle ayrılması.</li>
    <li>Çalışanın ölümü (tazminat mirasçılarına ödenir).</li>
</ul>
<p>Bu hallerin dışında, çalışanın kendi isteğiyle istifa etmesi durumunda kural olarak kıdem tazminatı ödenmez. İstifa dilekçesine gerçek ayrılış nedeninin (ör. ücretin geç ödenmesi) yazılması, haklı nedenle fesih durumunun ispatı açısından önemlidir.</p>

<h2>Tutar Nasıl Hesaplanır?</h2>
<p><strong>Kıdem tazminatı = Giydirilmiş brüt ücret × (tam yıl + ay/12 + gün/365)</strong></p>
<p><strong>Giydirilmiş ücret</strong>, son brüt ücrete düzenli ödenen yemek, yol, ikramiye, prim gibi yan hakların aylık karşılığı eklenerek bulunur. Bu tutar, ayrılış tarihindeki <strong>kıdem tazminatı tavanını</strong> aşamaz. ${YIL} tavanı 1 Ocak–30 Haziran için ${tl(P.kidemTavanlari[0][1])}, 1 Temmuz–31 Aralık için ${tl(kTavan)}'dir.</p>
<div class="table-wrap"><table>
    <tr><th>Örnek</th><th>Giydirilmiş ücret</th><th>Süre</th><th>Brüt kıdem tazminatı</th></tr>
    <tr><td>Tavan altında</td><td>${tl(55000)}</td><td>6 yıl 4 ay</td><td>${tl(kOrnek1)}</td></tr>
    <tr><td>Tavan üstünde (80.000 TL → tavan uygulanır)</td><td>${tl(kTavan)}</td><td>10 yıl 3 ay</td><td>${tl(kOrnek2)}</td></tr>
</table></div>

<h2>Kıdem Tazminatından Hangi Kesintiler Yapılır?</h2>
<p>Kıdem tazminatından gelir vergisi ve SGK primi kesilmez; yalnızca ‰7,59 damga vergisi kesilir. İlk örnekte damga vergisi ${tl(r2(kOrnek1 * P.damga))}, net tazminat ${tl(r2(kOrnek1 - kOrnek1 * P.damga))} olur.</p>

<h2>İhbar Tazminatıyla Farkı</h2>
<p>İhbar tazminatı, sözleşmeyi bildirim süresine uymadan fesheden tarafın ödediği tazminattır. Kıdem tazminatından bağımsızdır; çalışma süresine göre 2 ila 8 haftalık ücret tutarındadır ve gelir vergisine tabidir. İşveren çalışanı bildirim süresi vermeden çıkarırsa hem kıdem hem ihbar tazminatı ödenebilir. Ayrıntılar için <a href="/ihbar-tazminati-hesaplama/">ihbar tazminatı hesaplama</a> sayfasına bakabilirsiniz.</p>

<h2>Zamanaşımı ve Arabuluculuk</h2>
<p>25 Ekim 2017'den sonra sona eren iş sözleşmelerinde kıdem tazminatı alacağı, sözleşmenin sona erdiği tarihten itibaren 5 yıllık zamanaşımına tabidir. Tazminat ödenmezse dava açmadan önce zorunlu arabuluculuk sürecine başvurulması gerekir.</p>
<p>Kendi tazminatınızı tarihlerinize ve ücretinize göre hesaplamak için <a href="/kidem-tazminati-hesaplama/">kıdem tazminatı hesaplayıcıyı</a> kullanabilirsiniz.</p>`,
        sss: [
            ['İstifa eden kıdem tazminatı alabilir mi?', 'Kural olarak alamaz. Ancak askerlik, emeklilik veya emeklilik için yaş dışındaki şartları tamamlama, kadın çalışanın evlendikten sonra 1 yıl içinde ayrılması ve haklı nedenle fesih durumlarında istifa eden çalışan da kıdem tazminatı alır.'],
            ['Kıdem tazminatı zamanaşımı kaç yıl?', '25 Ekim 2017 sonrasında sona eren iş sözleşmelerinde 5 yıldır ve sözleşmenin sona erdiği tarihten itibaren işler.']
        ]
    });

    // --- Net/brüt pazarlığı
    const pzNet = 50000;
    const pzOcak = nettenBrut(pzNet, 0, true), pzAralik = nettenBrut(pzNet, 11, true);
    const pzSabit = bordro12(pzOcak, true);
    const pzYillikNet = r2(pzSabit.reduce((a, r) => a + r.net, 0));
    const pzEksik = r2(pzNet * 12 - pzYillikNet);
    rehber({
        yol: '/rehber/is-teklifinde-net-brut-maas-pazarligi/',
        okuma: 6,
        ozet: 'İş teklifinde net maaş mı brüt maaş mı konuşulmalı? Sabit brüt ile garanti net arasındaki farkı, yıl sonunda netin neden düştüğünü ve teklif değerlendirirken sorulacak soruları örneklerle anlatıyoruz.',
        govde: `
<p class="lead">Türkiye'de maaş görüşmeleri çoğunlukla net üzerinden yapılır, sözleşmeye ise brüt ücret yazılır. Bu ikisi arasındaki fark, yıl içinde vergi dilimi değiştikçe büyür. Teklif aşamasında hangi rakamın neyi ifade ettiğini netleştirmek, yıl sonunda sürprizle karşılaşmamanın en kolay yoludur.</p>

<h2>"${sayi(pzNet)} TL Net" Teklifinin İki Farklı Anlamı</h2>
<p><strong>1. Ocak netine göre sabit brüt:</strong> İşveren, Ocak ayında ${tl(pzNet)} net veren brütü (${tl(pzOcak)}) sözleşmeye yazar ve yıl boyunca bu brütü öder. Kümülatif matrah arttıkça net düşer; Aralık'ta ${tl(pzSabit[11].net)} alırsınız. Yıllık toplam netiniz ${tl(pzYillikNet)} olur; yani "aylık ${sayi(pzNet)} TL" beklentisine göre yılda yaklaşık <strong>${tl(pzEksik)}</strong> eksik.</p>
<p><strong>2. Garanti net (net ücret anlaşması):</strong> İşveren her ay ${tl(pzNet)} net ödemeyi taahhüt eder ve brütü her ay buna göre artırır. Aralık'ta gereken brüt ${tl(pzAralik)}'ye çıkar. Bu durumda vergi dilimi artışının yükünü işveren üstlenir.</p>
<div class="table-wrap"><table>
    <tr><th>Ay</th><th>Sabit brüt ile net</th><th>Garanti net için gereken brüt</th></tr>
    ${[0, 3, 6, 9, 11].map(i => `<tr><td>${AYLAR[i]}</td><td>${tl(pzSabit[i].net)}</td><td>${tl(nettenBrut(pzNet, i, true))}</td></tr>`).join('')}
</table></div>

<h2>Teklifi Değerlendirirken Sorulacak Sorular</h2>
<ul>
    <li><strong>Sözleşmeye yazılacak brüt ücret ne kadar?</strong> Hukuken bağlayıcı olan rakam budur; kıdem ve ihbar tazminatı da brüt üzerinden hesaplanır.</li>
    <li><strong>Net tutar garanti mi?</strong> Garanti netse bunun sözleşmede veya yazılı teklifte açıkça yer alması gerekir.</li>
    <li><strong>Yan haklar brüte dahil mi?</strong> Yemek kartı, yol, özel sağlık sigortası, prim ve ikramiyelerin nasıl ödendiğini sorun. Düzenli ödenen yan haklar kıdem tazminatında "giydirilmiş ücrete" eklenir.</li>
    <li><strong>Zam dönemi ve yöntemi nedir?</strong> Zammın brüt mü net mi yapılacağı ve yılda kaç kez yapılacağı toplam kazancınızı belirgin şekilde etkiler.</li>
    <li><strong>Yıl ortasında işe giriyorsanız:</strong> Yeni işyerindeki kümülatif matrahın sıfırdan mı yoksa önceki işyerindeki matrahınızla mı başlatılacağını sorun; bu, ilk aylardaki netinizi ve yıl sonundaki vergi durumunuzu etkiler.</li>
</ul>

<h2>Hangi Rakamla Karşılaştırmalı?</h2>
<p>İki teklifi karşılaştırırken aylık nete değil, <strong>yıllık toplam nete</strong> bakın. Sabit brütlü bir teklifin yıllık toplam netini <a href="/">brütten nete hesaplayıcının</a> 12 aylık tablosundan, garanti netli teklifinkini ise basitçe net × 12 olarak bulabilirsiniz. Mevcut işinizdeki zam teklifini değerlendirmek için de <a href="/zam-hesaplama/">zam hesaplama aracını</a> kullanabilirsiniz.</p>`,
        sss: [
            ['İş teklifinde net mi brüt mü konuşmak daha iyi?', 'Sözleşmede brüt yazdığı için brüt rakamı mutlaka netleştirin. Net konuşuluyorsa netin garanti olup olmadığını ve hangi ayın netinin esas alındığını yazılı olarak teyit edin.'],
            ['Garanti net ne demek?', 'İşverenin her ay aynı net tutarı ödemeyi taahhüt etmesidir. Vergi dilimi yükseldikçe brüt artırılır; vergi artışının yükünü işveren üstlenir.']
        ]
    });

    // --- Fazla mesai rehberi
    const fmB = 40000, fmS = r2(fmB / 225);
    const fm40 = r2(fmB / 225 * 1.25 * 5 + fmB / 225 * 1.5 * 5);
    rehber({
        yol: '/rehber/fazla-mesai-ucreti-nasil-hesaplanir/',
        okuma: 6,
        ozet: 'Fazla çalışma ile fazla sürelerle çalışma arasındaki fark, %50 ve %25 zamlı saat ücreti, resmî tatil çalışması, yıllık 270 saat sınırı, serbest zaman hakkı ve fazla mesainin net maaşa etkisi.',
        govde: `
<p class="lead">Fazla mesai ücreti, çalışma hayatında en sık hesaplanan ama en çok karıştırılan kalemlerden biridir. Kanun iki farklı kavram tanımlar ve her biri farklı oranda ücretlendirilir. Ayrıca fazla mesainin nete yansıması, ödendiği ayın vergi dilimine göre değişir.</p>

<h2>Fazla Çalışma ve Fazla Sürelerle Çalışma</h2>
<p>İş Kanunu'nun 41. maddesine göre haftalık çalışma süresi en fazla 45 saattir.</p>
<ul>
    <li><strong>Fazla çalışma:</strong> Haftalık 45 saati aşan çalışmadır. Her saati, normal saat ücretinin %50 fazlasıyla (×1,5) ödenir.</li>
    <li><strong>Fazla sürelerle çalışma:</strong> Sözleşmede haftalık süre 45 saatten az belirlenmişse (ör. 40 saat), bu süre ile 45 saat arasındaki çalışmadır. Her saati %25 fazlasıyla (×1,25) ödenir.</li>
</ul>

<h2>Saatlik Ücret Nasıl Bulunur?</h2>
<p>Aylık ücretli çalışanlarda saatlik brüt ücret, aylık brütün 225'e bölünmesiyle bulunur (30 gün × 7,5 saat). ${sayi(fmB)} TL brüt maaşta saatlik ücret ${tl(fmS)}, %50 zamlı saat ücreti ${tl(r2(fmS * 1.5))}, %25 zamlı saat ücreti ${tl(r2(fmS * 1.25))}'dir.</p>

<h2>Örnek: Haftalık 40 Saat Sözleşmeyle 50 Saat Çalışma</h2>
<p>Sözleşmesinde haftalık 40 saat yazan ve bir hafta 50 saat çalışan bir çalışanın ilk 5 saati (40–45 arası) fazla sürelerle çalışma, sonraki 5 saati (45'i aşan) fazla çalışmadır. ${sayi(fmB)} TL brüt maaşta bu haftanın ek brüt ücreti: 5 × ${tl(r2(fmS * 1.25))} + 5 × ${tl(r2(fmS * 1.5))} = <strong>${tl(fm40)}</strong>.</p>

<h2>Resmî Tatil ve Hafta Tatili</h2>
<p>Ulusal bayram ve genel tatil günlerinde çalışan işçiye, o gün için normal ücretine ek olarak bir günlük ücret daha ödenir (İş Kanunu md. 47). Hafta tatili (genellikle Pazar) çalışmalarının ücretlendirilmesi işyeri uygulaması, sözleşme ve yargı kararlarına göre farklılık gösterebilir; bu nedenle iş sözleşmenizi ve bordronuzu birlikte incelemeniz önerilir.</p>

<h2>Sınırlar ve Haklar</h2>
<ul>
    <li>Yıllık fazla çalışma süresi 270 saati aşamaz.</li>
    <li>Fazla çalışma için çalışanın onayı gerekir.</li>
    <li>Çalışan isterse ücret yerine serbest zaman kullanabilir: fazla çalışmada her saat için 1 saat 30 dakika, fazla sürelerle çalışmada 1 saat 15 dakika.</li>
    <li>Fazla mesai ücreti alacağı 5 yıllık zamanaşımına tabidir.</li>
</ul>

<h2>Fazla Mesainin Net Maaşa Etkisi</h2>
<p>Fazla mesai ücreti normal ücret gibi SGK, işsizlik, gelir ve damga vergisine tabidir. Asgari ücret istisnası maaşta zaten kullanıldığı için fazla mesainin tamamı vergilendirilir ve vergi oranı o ayki kümülatif matrahınızın bulunduğu dilime göre belirlenir. Bu yüzden aynı fazla mesai Ocak'ta ödendiğinde Kasım'da ödendiğinden daha fazla net bırakır. Kendi durumunuzu <a href="/fazla-mesai-hesaplama/">fazla mesai hesaplama aracıyla</a> ay seçerek hesaplayabilirsiniz.</p>`,
        sss: [
            ['Fazla mesai saat ücreti nasıl hesaplanır?', 'Aylık brüt maaş 225\'e bölünür ve 1,5 ile çarpılır. Fazla sürelerle çalışmada 1,25 ile çarpılır.'],
            ['Fazla mesaiyi reddedebilir miyim?', 'Fazla çalışma için çalışanın onayı gerekir. Yıllık 270 saat sınırı da aşılamaz.']
        ]
    });

    // --- Rehber dizini
    ekle({
        yol: '/rehber/',
        baslik: 'Maaş, Vergi ve Tazminat Rehberleri | maas-hesaplama.com',
        aciklama: 'Bordro okuma, asgari ücret istisnası, kıdem tazminatı, fazla mesai ve maaş pazarlığı üzerine örnek hesaplarla hazırlanmış, güncel parametrelere dayalı rehber yazılar.',
        h1: 'Rehberler',
        altBaslik: `${YIL} parametreleriyle hazırlanmış açıklayıcı yazılar`,
        kirinti: [['/rehber/', 'Rehberler']],
        arac: false,
        icerik: `
<section class="info">
    <p class="lead">Hesaplayıcılarımızın arkasındaki kuralları ve bordrodaki rakamların nereden geldiğini anlatan rehberler. Her yazıdaki örnek tutarlar, sitedeki hesaplayıcılarla aynı hesap motorundan üretilir ve parametreler değiştiğinde birlikte güncellenir.</p>
    ${rehberler.map(r => `<div class="rehber-kart"><h2><a href="${r.yol}">${r.baslik}</a></h2><p>${r.ozet}</p></div>`).join('\n    ')}
</section>`
    });

    return sayfalar;
};
