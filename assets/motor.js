/*
 * maas-hesaplama.com hesap motoru
 * Yıl değiştiğinde yalnızca P (parametreler) bloğunu güncellemek yeterlidir.
 * Bu dosya hem tarayıcıda hem de sayfa üretici (Node.js) tarafından kullanılır.
 */
(function (kok) {
    const P = {
        yil: 2026,
        sonGuncelleme: '1 Kasım 2026',
        asgariUcret: 33030.00,
        sgkTavan: 297270.00,          // Aylık prime esas kazanç üst sınırı
        sgkIsci: 0.14,
        issizlikIsci: 0.01,
        sgkIsveren: 0.2175,
        sgkIsverenTesvikli: 0.1675,   // 5 puanlık teşvik uygulanmış hali
        issizlikIsveren: 0.02,
        damga: 0.00759,
        // Ücret gelirleri için gelir vergisi tarifesi: [üst sınır, oran]
        dilimler: [
            [190000, 0.15],
            [400000, 0.20],
            [1500000, 0.27],
            [5000000, 0.35],
            [Infinity, 0.40]
        ],
        // Kıdem tazminatı tavanları: [başlangıç tarihi (dahil), tavan]
        kidemTavanlari: [
            ['2026-01-01', 64948.77],
            ['2026-07-01', 73729.87]
        ]
    };

    const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const r2 = x => Math.round(Number((x * 100).toFixed(6))) / 100;
    const tl = x => x.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';

    // Kümülatif matraha göre toplam gelir vergisi
    function tarifeVergisi(matrah) {
        let vergi = 0, alt = 0;
        for (const [ust, oran] of P.dilimler) {
            if (matrah <= ust) return vergi + (matrah - alt) * oran;
            vergi += (ust - alt) * oran;
            alt = ust;
        }
        return vergi;
    }

    // Önceki kümülatif matraha ek olarak bu ayın matrahının vergisi
    function aylikVergi(oncekiKumulatif, matrah) {
        return tarifeVergisi(oncekiKumulatif + matrah) - tarifeVergisi(oncekiKumulatif);
    }

    function dilimOrani(kumulatif) {
        for (const [ust, oran] of P.dilimler) if (kumulatif <= ust) return oran;
        return P.dilimler[P.dilimler.length - 1][1];
    }

    // Asgari ücret istisnaları (her ay için, asgari ücretin kendi kümülatif matrahına göre)
    const AU_MATRAH = r2(P.asgariUcret * (1 - P.sgkIsci - P.issizlikIsci));
    const AU_GV_ISTISNA = Array.from({ length: 12 }, (_, i) => r2(aylikVergi(AU_MATRAH * i, AU_MATRAH)));
    const AU_DV_ISTISNA = r2(P.asgariUcret * P.damga);

    // Sabit brüt maaşla 12 aylık bordro
    function bordro12(brut, tesvikli) {
        const satirlar = [];
        let kumulatif = 0;
        const pek = Math.min(brut, P.sgkTavan);
        const isverenOrani = tesvikli ? P.sgkIsverenTesvikli : P.sgkIsveren;
        for (let ay = 0; ay < 12; ay++) {
            const sgk = r2(pek * P.sgkIsci);
            const issizlik = r2(pek * P.issizlikIsci);
            const matrah = r2(brut - sgk - issizlik);
            const hesGV = r2(aylikVergi(kumulatif, matrah));
            const istGV = Math.min(hesGV, AU_GV_ISTISNA[ay]);
            const gv = r2(hesGV - istGV);
            const hesDV = r2(brut * P.damga);
            const istDV = Math.min(hesDV, AU_DV_ISTISNA);
            const dv = r2(hesDV - istDV);
            kumulatif = r2(kumulatif + matrah);
            const net = r2(brut - sgk - issizlik - gv - dv);
            const isverenSgk = r2(pek * isverenOrani);
            const isverenIssizlik = r2(pek * P.issizlikIsveren);
            const maliyet = r2(brut + isverenSgk + isverenIssizlik);
            satirlar.push({ ay, brut, sgk, issizlik, matrah, kumulatif, hesGV, istGV, gv, hesDV, istDV, dv, net, isverenSgk, isverenIssizlik, maliyet });
        }
        return satirlar;
    }

    // Belirli bir ayda hedef neti veren sabit brüt (ikili arama)
    function nettenBrut(hedefNet, ay, tesvikli) {
        let alt = 0, ust = Math.max(hedefNet * 3, 100000);
        while (bordro12(ust, tesvikli)[ay].net < hedefNet) ust *= 2;
        for (let i = 0; i < 80; i++) {
            const orta = (alt + ust) / 2;
            if (bordro12(orta, tesvikli)[ay].net < hedefNet) alt = orta; else ust = orta;
        }
        let brut = r2(ust);
        while (bordro12(brut, tesvikli)[ay].net < hedefNet) brut = r2(brut + 0.01);
        return brut;
    }

    // İki tarih arasındaki süre (yıl, ay, gün). Çıkış günü dahil.
    function sureHesapla(baslangic, bitis) {
        const b = new Date(bitis.getTime());
        b.setDate(b.getDate() + 1);
        let yil = b.getFullYear() - baslangic.getFullYear();
        let ay = b.getMonth() - baslangic.getMonth();
        let gun = b.getDate() - baslangic.getDate();
        if (gun < 0) {
            ay--;
            gun += new Date(b.getFullYear(), b.getMonth(), 0).getDate();
        }
        if (ay < 0) { yil--; ay += 12; }
        return { yil, ay, gun };
    }

    function kidemTavani(cikisStr) {
        let tavan = null;
        for (const [tarih, t] of P.kidemTavanlari) if (cikisStr >= tarih) tavan = t;
        return tavan;
    }

    function ihbarHaftasi(sure) {
        const toplamAy = sure.yil * 12 + sure.ay + sure.gun / 30;
        if (toplamAy < 6) return 2;
        if (toplamAy < 18) return 4;
        if (toplamAy < 36) return 6;
        return 8;
    }

    const Motor = { P, AYLAR, r2, tl, tarifeVergisi, aylikVergi, dilimOrani, AU_MATRAH, AU_GV_ISTISNA, AU_DV_ISTISNA, bordro12, nettenBrut, sureHesapla, kidemTavani, ihbarHaftasi };

    if (typeof module !== 'undefined' && module.exports) module.exports = Motor;
    else kok.Motor = Motor;
})(this);
