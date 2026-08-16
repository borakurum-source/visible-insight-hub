// Ölçüm sonrası otomatik öncelikli görev üretimi (sunucu tarafı).
// Ölçüm sonuçlarına göre en fazla 3 somut görev üretir (aynı başlık tekrar açılmaz).
export async function createPriorityTasks(
  supabase: { from: (table: string) => any },
  brandId: string,
  citationRows: Array<{ is_own_domain: boolean }>,
) {
  const [{ data: prompts }, { data: runs }, { data: sources }, { data: existing }] = await Promise.all([
    supabase.from("prompts").select("id, text").eq("brand_id", brandId).eq("status", "approved"),
    supabase.from("prompt_runs").select("prompt_id, brand_mentioned").eq("brand_id", brandId),
    supabase.from("knowledge_sources").select("id, index_status").eq("brand_id", brandId),
    supabase.from("geo_tasks").select("title").eq("brand_id", brandId).neq("status", "done"),
  ]);

  const promptById = new Map<string, string>(((prompts ?? []) as Array<{ id: string; text: string }>).map((p) => [p.id, p.text]));
  const stats = new Map<string, { total: number; mentioned: number }>();
  for (const run of (runs ?? []) as Array<{ prompt_id: string; brand_mentioned: boolean }>) {
    const entry = stats.get(run.prompt_id) ?? { total: 0, mentioned: 0 };
    entry.total += 1;
    if (run.brand_mentioned) entry.mentioned += 1;
    stats.set(run.prompt_id, entry);
  }

  const missing = Array.from(stats.entries())
    .filter(([, s]) => s.total > 0 && s.mentioned === 0)
    .map(([id]) => promptById.get(id))
    .filter(Boolean) as string[];

  const ownShare = citationRows.length
    ? Math.round((citationRows.filter((c) => c.is_own_domain).length / citationRows.length) * 100)
    : 0;
  const unindexed = ((sources ?? []) as Array<{ index_status: string }>).filter((s) => s.index_status !== "hazir").length;

  const candidates: Array<{ title: string; description: string; priority: string }> = [];
  if (missing.length) {
    candidates.push({
      title: `"${missing[0]!.slice(0, 90)}" sorusu için kanıt içeriği yazın`,
      description: `Bu soruda markanız hiç geçmiyor. Toplam ${missing.length} soruda görünmüyorsunuz. İçerik ekranından taslak üretebilirsiniz.`,
      priority: "high",
    });
  }
  if (ownShare < 30) {
    candidates.push({
      title: "Kendi sitenizden alıntı payını yükseltin",
      description: `Atıfların yalnızca %${ownShare} kadarı sizin alan adınızdan. Rakiplerin alıntılandığı konularda karşılaştırma ve veri sayfası yayımlayın.`,
      priority: ownShare < 15 ? "high" : "medium",
    });
  }
  if (unindexed > 0) {
    candidates.push({
      title: `${unindexed} bilgi kaynağını indeksleyin`,
      description: "İndekslenmemiş kaynaklar marka zekâsında kullanılamıyor; Bilgi Bankası ekranından indeksleyin.",
      priority: "medium",
    });
  }
  if (missing.length > 1) {
    candidates.push({
      title: `"${missing[1]!.slice(0, 90)}" sorusu için kanıt içeriği yazın`,
      description: "Bu soruda da markanız geçmiyor. Kanıt boşlukları ekranından kapsamı kontrol edin.",
      priority: "medium",
    });
  }

  const seen = new Set(((existing ?? []) as Array<{ title: string }>).map((t) => t.title));
  const rows = candidates.filter((c) => !seen.has(c.title)).slice(0, 3).map((c) => ({ ...c, brand_id: brandId, status: "todo" }));
  if (!rows.length) return 0;
  const { error } = await supabase.from("geo_tasks").insert(rows);
  if (error) {
    console.error("Öncelikli görevler oluşturulamadı", error.message);
    return 0;
  }
  return rows.length;
}
