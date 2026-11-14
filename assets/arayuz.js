/* Sayfadaki hesaplama araçlarını hesap motoruna bağlar. Yalnızca sayfada bulunan araçlar etkinleşir. */
(function () {
    const { P, AYLAR, r2, tl, aylikVergi, dilimOrani, bordro12, ekOdemeNeti, izinGunu, nettenBrut, sureHesapla, kidemTavani, ihbarHaftasi } = window.Motor;
    const $ = id => document.getElementById(id);

    function hata(id, mesaj) {
        const el = $(id);
        if (!el) return;
        el.textContent = mesaj;
        el.style.display = mesaj ? 'block' : 'none';
    }

    function ayListesiDoldur(id, secili) {
        const sel = $(id);
        if (!sel) return;
        const buAy = new Date().getFullYear() === P.yil ? new Date().getMonth() : 0;
        const varsayilan = Number.isInteger(secili) ? secili : buAy;
        AYLAR.forEach((ad, i) => sel.add(new Option(`${ad} ${P.yil}`, i, false, i === varsayilan)));
    }

    function maasSonucunuGoster(satirlar, ay) {
        const s = satirlar[ay];
        const yaz = (id, deger) => { const el = $(id); if (el) el.textContent = deger; };
        yaz('resBrut', tl(s.brut));
        yaz('resSgk', tl(s.sgk));
        yaz('resIssizlik', tl(s.issizlik));
        yaz('resMatrah', tl(s.matrah));
        yaz('resKum', `${tl(s.kumulatif)} · %${Math.round(dilimOrani(s.kumulatif) * 100)}`);
        yaz('resHesGV', tl(s.hesGV));
        yaz('resIstGV', '− ' + tl(s.istGV));
        yaz('resGV', tl(s.gv));
        yaz('resHesDV', tl(s.hesDV));
        yaz('resIstDV', '− ' + tl(s.istDV));
        yaz('resDV', tl(s.dv));
        yaz('resNetLabel', `${AYLAR[ay]} Ayı Net Maaş:`);
        yaz('resNet', tl(s.net));
        const dovizSatir = $('resDovizSatir');
        if (dovizSatir) {
            const kurlar = window.KURLAR && window.KURLAR.kurlar;
            const karsilik = kod => { const k = kurlar && kurlar.find(x => x.kod === kod); return k ? s.net / k.dovizSatis * k.birim : null; };
            const usd = karsilik('USD'), eur = karsilik('EUR');
            const bicim = x => x.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
            if (usd && eur) { yaz('resDoviz', `≈ ${bicim(usd)} $ · ${bicim(eur)} €`); dovizSatir.style.display = 'flex'; }
            else dovizSatir.style.display = 'none';
        }
        yaz('resIsvSgk', tl(s.isverenSgk));
        yaz('resIsvIss', tl(s.isverenIssizlik));
        yaz('resMaliyet', tl(s.maliyet));

        const uyari = $('resUyari');
        if (s.brut > P.sgkTavan) {
            uyari.textContent = `Brüt maaşınız SGK tavanını (${tl(P.sgkTavan)}) aştığı için SGK primleri tavan üzerinden hesaplandı.`;
            uyari.style.display = 'block';
        } else if (s.brut < P.asgariUcret) {
            uyari.textContent = 'Girilen tutar brüt asgari ücretin altında. Tam zamanlı çalışmada asgari ücretin altında ödeme yapılamaz.';
            uyari.style.display = 'block';
        } else {
            uyari.style.display = 'none';
        }

        const toplam = { brut: 0, kesinti: 0, gv: 0, dv: 0, net: 0, maliyet: 0 };
        $('tablo12').innerHTML = satirlar.map(r => {
            toplam.brut += r.brut; toplam.kesinti += r.sgk + r.issizlik; toplam.gv += r.gv;
            toplam.dv += r.dv; toplam.net += r.net; toplam.maliyet += r.maliyet;
            return `<tr class="${r.ay === ay ? 'selected' : ''}"><td>${AYLAR[r.ay]}</td><td>${tl(r.brut)}</td><td>${tl(r.sgk + r.issizlik)}</td><td>${tl(r.kumulatif)}</td><td>${tl(r.gv)}</td><td>${tl(r.dv)}</td><td>${tl(r.net)}</td><td>${tl(r.maliyet)}</td></tr>`;
        }).join('');
        $('tablo12Toplam').innerHTML = `<tr><th>Toplam</th><th>${tl(r2(toplam.brut))}</th><th>${tl(r2(toplam.kesinti))}</th><th></th><th>${tl(r2(toplam.gv))}</th><th>${tl(r2(toplam.dv))}</th><th>${tl(r2(toplam.net))}</th><th>${tl(r2(toplam.maliyet))}</th></tr>`;

        $('maasSonuclari').style.display = 'block';
    }

    function hesaplaBruttenNete() {
        const brut = parseFloat($('brutMaas').value);
        if (isNaN(brut) || brut <= 0) { hata('hataBrut', 'Lütfen geçerli bir brüt maaş girin.'); $('maasSonuclari').style.display = 'none'; return; }
        hata('hataBrut', '');
        const ay = parseInt($('brutAy').value, 10);
        maasSonucunuGoster(bordro12(brut, $('brutTesvik').checked), ay);
    }

    function hesaplaNettenBrute() {
        const net = parseFloat($('netMaasInput').value);
        if (isNaN(net) || net <= 0) { hata('hataNet', 'Lütfen geçerli bir net maaş girin.'); $('maasSonuclari').style.display = 'none'; return; }
        hata('hataNet', '');
        const ay = parseInt($('netAy').value, 10);
        const tesvikli = $('netTesvik').checked;
        maasSonucunuGoster(bordro12(nettenBrut(net, ay, tesvikli), tesvikli), ay);
    }

    function hesaplaTazminat() {
        const sonuc = $('tazminatSonuclari');
        const brut = parseFloat($('tazBrutMaas').value);
        const girisStr = $('iseGiris').value, cikisStr = $('istenCikis').value;
        if (isNaN(brut) || brut <= 0) { hata('hataTaz', 'Lütfen giydirilmiş brüt maaşınızı girin.'); sonuc.style.display = 'none'; return; }
        if (!girisStr || !cikisStr) { hata('hataTaz', 'Lütfen işe giriş ve işten çıkış tarihlerini girin.'); sonuc.style.display = 'none'; return; }
        const giris = new Date(girisStr + 'T00:00:00'), cikis = new Date(cikisStr + 'T00:00:00');
        if (cikis < giris) { hata('hataTaz', 'İşten çıkış tarihi işe giriş tarihinden önce olamaz.'); sonuc.style.display = 'none'; return; }
        hata('hataTaz', '');

        const uyarilar = [];
        const sure = sureHesapla(giris, cikis);
        const toplamYil = sure.yil + sure.ay / 12 + sure.gun / 365;
        $('resSure').textContent = `${sure.yil} yıl ${sure.ay} ay ${sure.gun} gün`;

        let tavan = kidemTavani(cikisStr);
        if (tavan === null) {
            tavan = P.kidemTavanlari[0][1];
            uyarilar.push(`${P.yil} öncesi çıkışlar için o döneme ait tavan geçerlidir; hesapta ${tl(tavan)} kullanıldı.`);
        }
        if (cikisStr > `${P.yil}-12-31`) {
            uyarilar.push(`${P.yil + 1} yılı kıdem tazminatı tavanı henüz sisteme eklenmedi; hesapta ${tl(tavan)} kullanıldı.`);
        }
        const kidemEsas = Math.min(brut, tavan);
        let brutKidem = 0;
        if (sure.yil >= 1) {
            brutKidem = r2(kidemEsas * toplamYil);
            if (brut > tavan) uyarilar.push(`Giydirilmiş ücretiniz kıdem tazminatı tavanını aştığı için hesap tavan (${tl(tavan)}) üzerinden yapıldı.`);
        } else {
            uyarilar.push('Kıdem tazminatına hak kazanmak için en az 1 yıl çalışmış olmak gerekir.');
        }
        const kidemDamga = r2(brutKidem * P.damga);
        const netKidem = r2(brutKidem - kidemDamga);

        const ihbarDahil = $('ihbarDahil').checked;
        let netIhbar = 0;
        if (ihbarDahil) {
            const hafta = ihbarHaftasi(sure);
            const brutIhbar = r2(brut / 30 * hafta * 7);
            const kum = parseFloat($('kumMatrah').value) || 0;
            const ihbarGV = r2(aylikVergi(kum, brutIhbar));
            const ihbarDV = r2(brutIhbar * P.damga);
            netIhbar = r2(brutIhbar - ihbarGV - ihbarDV);
            $('resIhbarSure').textContent = `${hafta} hafta (${hafta * 7} gün)`;
            $('resBrutIhbar').textContent = tl(brutIhbar);
            $('resIhbarGV').textContent = tl(ihbarGV);
            $('resIhbarDV').textContent = tl(ihbarDV);
            $('resNetIhbar').textContent = tl(netIhbar);
        }
        $('ihbarBlok').style.display = ihbarDahil ? 'block' : 'none';

        $('resKidemEsas').textContent = tl(kidemEsas);
        $('resBrutKidem').textContent = tl(brutKidem);
        $('resKidemDamga').textContent = tl(kidemDamga);
        $('resNetKidem').textContent = tl(netKidem);
        $('resToplamTazminat').textContent = tl(r2(netKidem + netIhbar));
        $('tazUyarilar').innerHTML = uyarilar.map(u => `<div class="warn">${u}</div>`).join('');
        sonuc.style.display = 'block';
    }

    // Adres çubuğundan ön doldurma: ?brut=50000&ay=0 veya ?net=40000
    const prm = new URLSearchParams(location.search);
    const prmAy = prm.has('ay') ? parseInt(prm.get('ay'), 10) : undefined;
    const gecerliAy = Number.isInteger(prmAy) && prmAy >= 0 && prmAy < 12 ? prmAy : undefined;

    function bagla(dugmeId, alanlar, fn) {
        const dugme = $(dugmeId);
        if (!dugme) return false;
        dugme.addEventListener('click', fn);
        alanlar.forEach(id => { const el = $(id); if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); }); });
        return true;
    }

    if (bagla('btnBrut', ['brutMaas'], hesaplaBruttenNete)) {
        ayListesiDoldur('brutAy', gecerliAy);
        const v = $('brutMaas').value || prm.get('brut');
        if (v) { $('brutMaas').value = v; hesaplaBruttenNete(); }
    }
    if (bagla('btnNet', ['netMaasInput'], hesaplaNettenBrute)) {
        ayListesiDoldur('netAy', gecerliAy);
        const v = $('netMaasInput').value || prm.get('net');
        if (v) { $('netMaasInput').value = v; hesaplaNettenBrute(); }
    }
    bagla('btnTaz', ['tazBrutMaas', 'kumMatrah'], hesaplaTazminat);

    // Fazla mesai
    function hesaplaFazlaMesai() {
        const brut = parseFloat($('fmBrut').value);
        const s50 = parseFloat($('fmSaat50').value) || 0;
        const s25 = parseFloat($('fmSaat25').value) || 0;
        const ubgt = parseFloat($('fmUbgt').value) || 0;
        if (isNaN(brut) || brut <= 0) { hata('hataFm', 'Lütfen geçerli bir brüt maaş girin.'); $('fmSonuc').style.display = 'none'; return; }
        if (s50 < 0 || s25 < 0 || ubgt < 0 || (s50 + s25 + ubgt) === 0) { hata('hataFm', 'Lütfen en az bir fazla çalışma saati veya tatil günü girin.'); $('fmSonuc').style.display = 'none'; return; }
        hata('hataFm', '');
        const ay = parseInt($('fmAy').value, 10);
        const saatlik = brut / 225, gunluk = brut / 30;
        const t50 = r2(saatlik * 1.5 * s50), t25 = r2(saatlik * 1.25 * s25), tU = r2(gunluk * ubgt);
        const ek = r2(t50 + t25 + tU);
        const e = ekOdemeNeti(brut, ek, ay, true);
        $('fmSaatlik').textContent = tl(r2(saatlik));
        $('fmT50').textContent = tl(t50);
        $('fmT25').textContent = tl(t25);
        $('fmTU').textContent = tl(tU);
        $('fmEk').textContent = tl(ek);
        $('fmSgk').textContent = tl(e.sgk);
        $('fmGV').textContent = tl(e.gv);
        $('fmDV').textContent = tl(e.dv);
        $('fmNet').textContent = tl(e.net);
        $('fmToplamNet').textContent = tl(e.ekli.net);
        $('fmAyEtiket').textContent = `${AYLAR[ay]} ayı toplam net maaş (maaş + fazla mesai):`;
        const uyari = [];
        if (s50 > 270) uyari.push('Yıllık fazla çalışma süresi 270 saati aşamaz (İş Kanunu md. 41). Aşan çalışmaların ücreti yine de ödenmelidir.');
        if (brut < P.asgariUcret) uyari.push('Girilen brüt maaş asgari ücretin altında.');
        $('fmUyari').innerHTML = uyari.map(u => `<div class="warn">${u}</div>`).join('');
        $('fmSonuc').style.display = 'block';
    }

    // Yıllık izin
    function hesaplaIzin() {
        const sonuc = $('izSonuc');
        const brut = parseFloat($('izBrut').value);
        const girisStr = $('izGiris').value, cikisStr = $('izCikis').value;
        const kullanilan = parseFloat($('izKullanilan').value) || 0;
        if (!girisStr || !cikisStr) { hata('hataIz', 'Lütfen işe giriş ve hesap (çıkış) tarihini girin.'); sonuc.style.display = 'none'; return; }
        const giris = new Date(girisStr + 'T00:00:00'), cikis = new Date(cikisStr + 'T00:00:00');
        if (cikis < giris) { hata('hataIz', 'Hesap tarihi işe giriş tarihinden önce olamaz.'); sonuc.style.display = 'none'; return; }
        hata('hataIz', '');
        const sure = sureHesapla(giris, cikis);
        const yas = $('izYas').checked;
        const satirlar = [];
        let toplam = 0;
        for (let k = 1; k <= sure.yil; k++) {
            const g = izinGunu(k, yas);
            toplam += g;
            const yd = new Date(giris); yd.setFullYear(giris.getFullYear() + k);
            satirlar.push(`<tr><td>${k}. yıl</td><td>${yd.toLocaleDateString('tr-TR')}</td><td>${g} gün</td></tr>`);
        }
        const kalan = Math.max(0, toplam - kullanilan);
        $('izSure').textContent = `${sure.yil} yıl ${sure.ay} ay ${sure.gun} gün`;
        $('izBuYil').textContent = sure.yil >= 1 ? `${izinGunu(sure.yil, yas)} gün` : 'Henüz hak kazanılmadı (1 yıl dolmadı)';
        $('izSonraki').textContent = `${izinGunu(sure.yil + 1, yas)} gün`;
        $('izToplam').textContent = `${toplam} gün`;
        $('izKalan').textContent = `${kalan} gün`;
        $('izTablo').innerHTML = satirlar.join('') || '<tr><td colspan="3">Henüz tamamlanmış hizmet yılı yok.</td></tr>';
        const ucretKutu = $('izUcretBlok');
        if (!isNaN(brut) && brut > 0 && kalan > 0) {
            const gunluk = brut / 30, ek = r2(gunluk * kalan);
            const ay = cikis.getFullYear() === P.yil ? cikis.getMonth() : 0;
            const e = ekOdemeNeti(brut, ek, ay, true);
            $('izGunluk').textContent = tl(r2(gunluk));
            $('izBrutUcret').textContent = tl(ek);
            $('izSgk').textContent = tl(e.sgk);
            $('izGV').textContent = tl(e.gv);
            $('izDV').textContent = tl(e.dv);
            $('izNet').textContent = tl(e.net);
            $('izNot').textContent = cikis.getFullYear() === P.yil
                ? `Kesintiler, ödemenin ${AYLAR[ay]} ${P.yil} bordrosunda o ayın maaşıyla birlikte yapıldığı varsayımıyla hesaplandı.`
                : `Kesintiler ${P.yil} parametreleriyle, ödemenin Ocak ayında yapıldığı varsayımıyla hesaplandı.`;
            ucretKutu.style.display = 'block';
        } else {
            ucretKutu.style.display = 'none';
        }
        sonuc.style.display = 'block';
    }

    // Zam
    function hesaplaZam() {
        const brut = parseFloat($('zmBrut').value);
        const oran = parseFloat($('zmOran').value);
        const enf = parseFloat($('zmEnf').value);
        if (isNaN(brut) || brut <= 0 || isNaN(oran)) { hata('hataZm', 'Lütfen mevcut brüt maaşı ve zam oranını girin.'); $('zmSonuc').style.display = 'none'; return; }
        hata('hataZm', '');
        const ay = parseInt($('zmAy').value, 10);
        const yeniBrut = r2(brut * (1 + oran / 100));
        const eski = bordro12(brut, true)[ay], yeni = bordro12(yeniBrut, true)[ay];
        const netArtis = r2(yeni.net - eski.net), netOran = netArtis / eski.net * 100;
        const bicimYuzde = x => '%' + x.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        $('zmYeniBrut').textContent = tl(yeniBrut);
        $('zmEskiNet').textContent = tl(eski.net);
        $('zmYeniNet').textContent = tl(yeni.net);
        $('zmNetArtis').textContent = `${tl(netArtis)} (${bicimYuzde(netOran)})`;
        $('zmMaliyet').textContent = `${tl(eski.maliyet)} → ${tl(yeni.maliyet)}`;
        $('zmAyEtiket1').textContent = `Eski net (${AYLAR[ay]}):`;
        $('zmAyEtiket2').textContent = `Yeni net (${AYLAR[ay]}):`;
        const reel = $('zmReelSatir');
        if (!isNaN(enf)) {
            const r = ((1 + netOran / 100) / (1 + enf / 100) - 1) * 100;
            $('zmReel').textContent = `${bicimYuzde(r)} ${r >= 0 ? '(alım gücü arttı)' : '(alım gücü azaldı)'}`;
            reel.style.display = 'flex';
        } else reel.style.display = 'none';
        $('zmSonuc').style.display = 'block';
    }

    if (bagla('btnFm', ['fmBrut', 'fmSaat50', 'fmSaat25', 'fmUbgt'], hesaplaFazlaMesai)) ayListesiDoldur('fmAy', gecerliAy);
    if (bagla('btnIzin', ['izBrut', 'izKullanilan'], hesaplaIzin)) {
        const bugun = new Date();
        $('izCikis').value = `${bugun.getFullYear()}-${String(bugun.getMonth() + 1).padStart(2, '0')}-${String(bugun.getDate()).padStart(2, '0')}`;
    }
    if (bagla('btnZam', ['zmBrut', 'zmOran', 'zmEnf'], hesaplaZam)) ayListesiDoldur('zmAy', gecerliAy);

    // Döviz çevirici
    const dvKaynak = $('dvKaynak');
    const veri = window.KURLAR;
    if (dvKaynak && veri && veri.kurlar) {
        const dvHedef = $('dvHedef');
        const secenekler = [{ kod: 'TRY', isim: 'TÜRK LİRASI' }, ...veri.kurlar];
        secenekler.forEach(k => {
            dvKaynak.add(new Option(`${k.kod} · ${k.isim}`, k.kod, false, k.kod === 'USD'));
            dvHedef.add(new Option(`${k.kod} · ${k.isim}`, k.kod, false, k.kod === 'TRY'));
        });
        const kurBul = kod => veri.kurlar.find(x => x.kod === kod);
        const kurYaz = x => x.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        const cevir = () => {
            const miktar = parseFloat($('dvMiktar').value);
            const kaynak = dvKaynak.value, hedef = dvHedef.value;
            if (isNaN(miktar) || miktar < 0) { $('dvSonucKutu').style.display = 'none'; return; }
            // Dövizden TL'ye: döviz alış; TL'den dövize: döviz satış
            const kk = kaynak === 'TRY' ? null : kurBul(kaynak);
            const hk = hedef === 'TRY' ? null : kurBul(hedef);
            const tlTutar = kk ? miktar * kk.dovizAlis / kk.birim : miktar;
            const sonuc = hk ? tlTutar / (hk.dovizSatis / hk.birim) : tlTutar;
            const aciklama = [];
            if (kk) aciklama.push(`${kk.birim} ${kk.kod} = ${kurYaz(kk.dovizAlis)} TL (alış)`);
            if (hk) aciklama.push(`${hk.birim} ${hk.kod} = ${kurYaz(hk.dovizSatis)} TL (satış)`);
            $('dvSonucEtiket').textContent = `${miktar.toLocaleString('tr-TR')} ${kaynak} =`;
            $('dvSonuc').textContent = `${sonuc.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${hedef}`;
            $('dvKurAciklama').textContent = aciklama.length ? aciklama.join(' · ') : 'Aynı para birimi';
            $('dvSonucKutu').style.display = 'block';
        };
        ['dvMiktar', 'dvKaynak', 'dvHedef'].forEach(id => $(id).addEventListener('input', cevir));
        dvKaynak.addEventListener('change', cevir);
        dvHedef.addEventListener('change', cevir);
        cevir();
    }
})();
