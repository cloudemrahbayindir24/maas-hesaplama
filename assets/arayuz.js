/* Sayfadaki hesaplama araçlarını hesap motoruna bağlar. Yalnızca sayfada bulunan araçlar etkinleşir. */
(function () {
    const { P, AYLAR, r2, tl, aylikVergi, dilimOrani, bordro12, nettenBrut, sureHesapla, kidemTavani, ihbarHaftasi } = window.Motor;
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
})();
