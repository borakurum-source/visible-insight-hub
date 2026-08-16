# Ana Sayfa: Akış ve Yapı Analizi + Düzeltme Planı

## Mevcut sıra (koddan)
```text
1  Hero (koyu, ölçüm formu)      6  Kanıt metaforu bandı (koyu)
2  Kanıt şeridi (FilmFolk)       7  FilmFolk vakası
3  Neden OneCite (3 kart)        8  Kimin için (3 kart)
4  Kaynak/Sinyal/Uygulama (3 kart) 9  Planlar (4 kart)
5  Ürün ekranları (3 satır)      10 SSS   11 Kapanış CTA
```

## Görüşüm

**İyi olan:** Hero'da formun doğrudan sayfada olması, koyu/açık ritim, gerçek ürün ekranları, tek net dönüşüm hedefi (`/free-ai-readiness-report`).

**Sorunlar:**

1. **Bölüm 3, 4, 5 aynı şeyi üç kez anlatıyor.** "Neden OneCite" (3 kart), "Kaynak → Sinyal → Uygulama" (3 kart), "Ürünün içinden" (3 satır) — üçü de aynı üçlemenin farklı ambalajı. Kullanıcı ortada tempoyu kaybediyor.
2. **FilmFolk iki kez geçiyor.** 2. bölümdeki şerit (41 / 28,1 puan / 286) ile 7. bölümdeki kart (aynı rakamlar + 30,7 / 58,9) birebir tekrar. Sosyal kanıt güç kazanmıyor, sulanıyor.
3. **Kanıt metaforu bandı (6) yanlış yerde.** "Eksik kanıt görünürlüğü keser" problem argümanı; problem bölümünün (3) yanına ait. Şu an ürün turunu ikiye bölüyor.
4. **Hero'da iki rakip çağrı var.** Form + altında üç rozet + `MarketingShell`'deki "Ücretsiz ölçüm" butonu. Aynı ekranda üç farklı giriş, tıklama dağılıyor.
5. **Kart formatı monoton.** 3+3+3+4 kart art arda; ritim tek düze.
6. **Planlar bölümü sadece limit listeliyor**, hangi planın kime uyduğunu söylemiyor; "Kimin için" bölümü hemen üstünde ama iki bölüm birbirine bağlanmamış.
7. **Kanıt şeridi bağlamsız açılıyor.** Hero'nun hemen ardından "%28,1 puan" kimin için ne demek belli değil.

## Önerdiğim yeni akış
```text
1  Hero                  form + tek CTA, rozetler tek satıra iner
2  Kanıt şeridi          "Örnek ölçüm: FilmFolk" bağlamı öne, rakamlar sadeleşir
3  Problem               "Neden OneCite" + kanıt metaforu bandı birleşir (koyu)
4  Nasıl çalışır         Kaynak → Sinyal → Uygulama, gerçek ürün ekranlarıyla
                         birlikte (bölüm 4 ve 5 tek bölüme kaynaşır, 3 satır)
5  Vaka: FilmFolk        tek yerde tam hikâye (öncesi/sonrası + link)
6  Kimin için + Planlar   üç profil, her biri doğrudan ilgili plana bağlanır
7  SSS
8  Kapanış CTA
```
11 bölüm → 8 bölüm. Sayfa yaklaşık üçte bir kısalır, her argüman bir kez ve en güçlü halinde geçer.

## Uygulanacak değişiklikler
- `NedenOneCite` ile `KanıtMetaforuBandı` tek koyu problem bölümünde birleştirilir.
- `KaynakSinyalUygulama` ile `UrunAkisi` tek "Nasıl çalışır" bölümüne kaynaştırılır: her adım = başlık + metin + gerçek ekran görseli (dönüşümlü hizalama).
- `ProofStrip` rakamları FilmFolk kartından çıkarılır; şeritte kalır, vaka kartı hikâyeye (ne yapıldı, ne değişti) odaklanır.
- `KimIcin` kartlarının CTA'ları plan kartlarına bağlanır; `PlanlaraBakis` başlığına "Kimin için" eşlemesi eklenir (her plana bir cümlelik "kime uygun" satırı).
- Hero: rozet satırı sadeleşir, ikincil link kaldırılır — tek eylem formda kalır.
- Bölüm dolgusu tek ölçek (`py-16 md:py-24`), koyu/açık ritim: koyu (hero) → açık → koyu (problem) → açık → açık → açık → açık → koyu (CTA).

## Teknik notlar
- Tek dosya: `src/routes/index.tsx`. Bölüm bileşenleri birleşir/silinir; içerik metinleri korunur, yeniden düzenlenir.
- Kullanılan görseller aynı kalır (`heroEvidenceGap` problem bölümüne, `shotKb/shotMetrics/shotContent` nasıl çalışır bölümüne).
- `pricingData.ts`, `faqData.ts`, `MarketingShell` ve panel tarafında değişiklik yok.
- SEO: mevcut head + FAQPage JSON-LD korunur; H2 sayısı azaldığı için başlık hiyerarşisi netleşir.
