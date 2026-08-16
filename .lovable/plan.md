# Panel: Atıf Kaynakları, Sistem Talimatları, Marka Zekası ve Ölçüm Grafikleri

## Önceki 9 maddenin gerçek durumu (kod okumasıyla doğrulandı)

| İstek | Durum |
| --- | --- |
| Yan menü eşitle | Yapıldı — sol menü ve sayfa içi hap menüler aynı hiyerarşiyi (İzle / Anla / Harekete Geç / Çalışma Alanı) kullanıyor |
| Bilgi grafiği düzelt | Kısmen — 3B vektör haritası ve varlık ağı çalışıyor, ama adı ve konumlandırması hâlâ "Bilgi Grafiği" |
| RAG sürecini tamamla | Kısmen — parçalama, embedding, vektör arama ve taslak üretimi var; otomatik yeniden indeksleme, kaynak ağırlığı ve içerikle bağ kurma eksik |
| GSC / GA4 + grafikler | Yapılmadı — entegrasyon sayfası tamamen sahte veri, komuta merkezinde hiç grafik yok |
| Otomatik API tetikleyicileri | Yapıldı — prompt keşfi ve kurulum adımları artık yalnız butonla çalışıyor |
| Panelde kurumsal logo | Yapıldı — sol menüde marka logosu kullanılıyor |
| Sol panel kompaktlık | Yapıldı — "Marka ekle" marka seçicinin içine alındı |
| UX/UI geliştirmeleri | Kısmen — aşağıdaki listeye taşındı |
| Yeni özellik önerileri | Aşağıda |

## Bu turda yapılacaklar

### 1. Atıf kaynakları görünür olsun
Bugün Perplexity'nin döndürdüğü gerçek bağlantı adresleri atılıyor, yalnızca alan adı saklanıyor. Değişiklik:
- Ölçüm sırasında her kaynağın tam adresi, başlığı ve hangi soruda çıktığı kaydedilir.
- Ölçüm sayfasına soru bazlı açılır "Kaynaklar" listesi: her satırda tıklanabilir bağlantı, alan adı, "sizin siteniz / rakip / tarafsız" etiketi.
- Atıf Kaynakları sayfası alan adı + tekil bağlantı kırılımı, ilk görülme tarihi ve "bu kaynağa nasıl girerim" aksiyonu gösterir.

### 2. Sistem talimatları merkezi (işin kalbi)
Bugün talimatlar 6 ayrı dosyada tek satırlık metinler halinde. Yapılacak:
- Tüm talimatlar tek bir talimat kütüphanesinde toplanır (marka analizi, kaynak seçimi, soru üretimi, ölçüm, boşluk analizi, içerik taslağı, iddia doğrulama).
- Her talimat yeniden yazılır: rol, hedef, GEO/atıf kriterleri, kaçınılacaklar, çıktı formatı, dil ve ton kuralları — kısa bir satır değil, tam operasyonel talimat.
- Panelde "Sistem Talimatları" ekranı: hangi adımda hangi talimatın, hangi modelin (Perplexity / DeepSeek) çalıştığı şeffaf görünür. Admin düzenleyip sürüm kaydedebilir; normal kullanıcı sadece okur.

### 3. RAG süreci uçtan uca
```text
Kaynaklar (site sayfaları, notlar, iddialar, GSC sorguları)
   -> Metin çıkarımı + değişiklik damgası (aynı içerik tekrar işlenmez)
   -> Parçalama (~1000 karakter, örtüşmeli)
   -> Embedding + kaynak ağırlığı (kendi siten > 3. taraf)
   -> Vektör deposu + 3B izdüşüm
   -> Geri getirme: soru -> en yakın kanıtlar
   -> Kullanım: boşluk analizi, içerik taslağı, iddia kontrolü, ölçüm yorumu
   -> Geri besleme: ölçümde çıkan yeni atıf kaynakları tekrar bilgi bankasına aday olur
```
Eksik halkalar tamamlanır: içerik değişince yeniden indeksleme, kaynak ağırlığı skorlaması, geri getirilen kanıtın taslak içinde kaynak olarak gösterilmesi, ölçüm sonrası aday kaynak önerisi.

### 4. "Bilgi Grafiği" -> "Marka Zekası"
Ad panelde, menüde, fiyatlandırmada ve pazarlama sayfalarında güncellenir. Sayfa üç sekme olur: Kanıt Haritası (3B), Varlık Ağı, Geri Getirme Testi. Üstte tek cümlelik özet: "Markanız hakkında yapay zekânın kullanabileceği kanıt hafızası." Marka Zekası; ölçüm, içerik ve boşluk ekranlarına karşılıklı bağlanır (her ekrandan "bu konudaki kanıtları gör" kısayolu).

### 5. Google Search Console ve GA4 bağlantısı (gerçek OAuth)
- Search Console için Lovable konnektörü üzerinden gerçek bağlantı kurulur; doğrulanmış mülk listesi çekilir, kullanıcı kendi mülkünü seçer, günlük anlık görüntü sunucuda saklanır.
- GA4 için aynı desende bağlantı ve günlük özet.
- Önemli sınır: standart konnektör, uygulamayı yöneten hesabın Google yetkisini kullanır. Her müşterinin kendi Google hesabını bağlaması için son kullanıcı OAuth akışı gerekir; bunu ayrı bir adım olarak kuracağız ve mevcut değilse özel OAuth akışı yazacağız.

### 6. Komuta merkezi görselleştirmesi
Gerçek veriden çizilen grafikler eklenir:
- Görünürlük skoru zaman serisi (her ölçüm turu bir nokta).
- Rakip payı: hangi marka kaç soruda geçti, sıralama ortalaması.
- Atıf kaynağı dağılımı: kendi siteniz vs. 3. taraf vs. rakip.
- Soru kategorisi kırılımı (marka / kategori / rakip / problem).
- GSC bağlıysa: tıklama-gösterim eğrisi ve "yapay zekâ görünürlüğü olan sorular" kesişimi.

### 7. UX/UI ve önerilen yeni özellikler
- Her ekranda tek birincil aksiyon, boş durumlarda ne yapılacağını söyleyen kart.
- Ölçüm sonrası otomatik "3 öncelikli aksiyon" listesi (görev ekranına düşer).
- Haftalık otomatik ölçüm + e-posta özeti (bildirim altyapısı hazır).
- Rakip izleme listesi ve rakip-bazlı kanıt boşluğu raporu.
- Paylaşılabilir müşteri raporu bağlantısının yenilenmesi.

## Teknik notlar
- `citations` tablosuna `title`, `prompt_id`, `citation_type` alanları; `measurement_batches` geçmişi grafiklerin kaynağı olur.
- Yeni `system_prompts` tablosu (anahtar, başlık, içerik, model, sürüm) + admin-yazma / üye-okuma kuralları.
- Yeni `integration_connections` ve `analytics_snapshots` tabloları; GSC/GA4 verisi sunucu tarafında günlük tazelenir, sayfa isteğinde Google'a çağrı yapılmaz.
- Grafikler mevcut recharts tabanlı bileşenlerle, tasarım tokenlarına uygun çizilir.
- Sıra: (1) veritabanı değişiklikleri, (2) atıf kaydı + görünürlük, (3) talimat kütüphanesi, (4) Marka Zekası adlandırma ve bağlar, (5) RAG tamamlama, (6) grafikler, (7) GSC/GA4 OAuth.
