import { describe, expect, it } from "vitest";
import { buildBrandSignalsBlock } from "./kb.server";

describe("buildBrandSignalsBlock", () => {
  it("intel yoksa boş string döner", () => {
    expect(buildBrandSignalsBlock(null)).toBe("");
    expect(buildBrandSignalsBlock(undefined)).toBe("");
  });

  it("tüm alanlar boşsa boş string döner (başlık bile eklenmez)", () => {
    expect(buildBrandSignalsBlock({})).toBe("");
    expect(
      buildBrandSignalsBlock({
        scope: null,
        naming_aliases: [],
        author_profiles: [],
        testimonials: [],
      }),
    ).toBe("");
  });

  it("sadece dolu olan alanlar satıra dönüşür, boş alanlar için satır üretilmez", () => {
    const block = buildBrandSignalsBlock({
      scope: "Ülke geneli",
      voice_notes: "Samimi ama teknik",
      leadership: [],
      partnerships: null,
    });
    expect(block).toContain("- Etki alanı: Ülke geneli");
    expect(block).toContain("- Marka sesi: Samimi ama teknik");
    expect(block).not.toContain("Liderlik");
    expect(block).not.toContain("Ortaklıklar");
  });

  it("dizi alanlar (yazar profilleri, liderlik vb.) noktalı virgülle birleştirilir", () => {
    const block = buildBrandSignalsBlock({
      author_profiles: ["Ayşe Yılmaz — CTO", "Mehmet Kaya — Baş Editör"],
      naming_aliases: ["Örnek A.Ş.", "ÖrnekMarka"],
    });
    expect(block).toContain("- Yazar profilleri: Ayşe Yılmaz — CTO; Mehmet Kaya — Baş Editör");
    expect(block).toContain("- Marka takma adları: Örnek A.Ş., ÖrnekMarka");
  });

  it("dizi alanındaki boş/geçersiz string'ler filtrelenir", () => {
    const block = buildBrandSignalsBlock({
      testimonials: ["Gerçek bir referans", "", "   ", 42 as unknown as string],
    });
    expect(block).toBe(
      "Marka E-E-A-T sinyalleri (yalnızca aşağıdakileri kullan, eksik olanı uydurma):\n- Referanslar: Gerçek bir referans",
    );
  });

  it("uydurma yapılmaması için talimat başlığı, en az bir alan doluyken her zaman eklenir", () => {
    const block = buildBrandSignalsBlock({ disclosure_policy: "Sponsorlu içerik açıkça belirtilir" });
    expect(block.startsWith("Marka E-E-A-T sinyalleri (yalnızca aşağıdakileri kullan, eksik olanı uydurma):")).toBe(
      true,
    );
  });
});
