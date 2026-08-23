// AEO Site Health: ince createServerFn sarmalayıcılar — orkestrasyon mantığı
// site-health.server.ts'te. runSiteHealthAudit dışındakiler saf RLS/RPC
// okuma-yazmasıdır; supabaseAdmin burada KULLANILMAZ (bkz. güvenlik notları).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// createServerFn'in serileştirme doğrulayıcısı `unknown` alanları reddeder
// (Record<string, unknown> bu yüzden çalışmaz) — bu yüzden select edilen
// kolonlarla birebir eşleşen somut satır tipleri kullanılır.
type SiteHealthPageRow = {
  id: string;
  url: string;
  technical_score: number;
  aeo_score: number;
  issue_count: number;
  last_audited_at: string;
};

type SiteHealthFindingRow = {
  id: string;
  title: string;
  detection: string;
  recommendation: string;
  affected_entities: Array<{ url: string }> | null;
  category: string | null;
  severity: string | null;
  rule_id: string | null;
  status: string;
  created_at: string;
};

// brandId sahipliğini context.supabase (RLS) üzerinden doğrular, domain'i alır,
// sonra runAudit()'i (service-role, kendi başına üyelik kontrolü yapmaz) çağırır.
export const runSiteHealthAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: brand, error } = await context.supabase
      .from("brands")
      .select("domain")
      .eq("id", data.brandId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!brand?.domain) throw new Error("Marka bulunamadı veya erişim yok");
    const { runAudit } = await import("./site-health.server");
    return runAudit(data.brandId, brand.domain);
  });

export const listSiteHealthPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("site_health_pages" as never)
      .select("id,url,technical_score,aeo_score,issue_count,last_audited_at" as never)
      .eq("brand_id" as never, data.brandId)
      .order("issue_count" as never, { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as SiteHealthPageRow[];
  });

export const listSiteHealthFindings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("findings" as never)
      .select(
        "id,title,detection,recommendation,affected_entities,category,severity,rule_id,status,created_at" as never,
      )
      .eq("brand_id" as never, data.brandId)
      .eq("finding_type" as never, "site_health")
      .order("created_at" as never, { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as SiteHealthFindingRow[];
  });

// RPC'ler brand_members üyeliğini kendi içinde (SECURITY DEFINER) doğrular —
// bu yüzden context.supabase kullanılır, supabaseAdmin DEĞİL: admin client bu
// dahili kontrolü atlayarak herhangi bir kullanıcının başka markanın bulgusunu
// çözmesine/yeniden açmasına izin verirdi.
export const resolveSiteHealthFinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { findingId: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc(
      "resolve_site_health_finding" as never,
      { _finding_id: data.findingId } as never,
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reopenSiteHealthFinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { findingId: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc(
      "reopen_site_health_finding" as never,
      { _finding_id: data.findingId } as never,
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
