import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Tum fonksiyonlar assertAdmin ile korunur; arayuz kontrolu tek basina guvenlik degildir.

export const adminWhoAmI = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    const { data: profile } = await context.supabase
      .from("profiles").select("email, full_name").eq("id", context.userId).maybeSingle();
    return {
      isAdmin: Boolean(roleRow),
      email: profile?.email ?? null,
      fullName: profile?.full_name ?? null,
    };
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 3600_000).toISOString();
    const monthAgo = new Date(now - 30 * 24 * 3600_000).toISOString();

    const [profiles, subs, errors, usage, batches, recentUsers] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, plan, trial_ends_at, suspended, created_at"),
      supabaseAdmin.from("subscriptions").select("status, current_period_end, environment"),
      supabaseAdmin.from("error_logs").select("id, level, message, path, created_at, resolved").gte("created_at", dayAgo).order("created_at", { ascending: false }).limit(10),
      supabaseAdmin.from("api_usage_log").select("provider, cost_usd, status, created_at").gte("created_at", monthAgo),
      supabaseAdmin.from("measurement_batches").select("id, created_at").gte("created_at", monthAgo),
      supabaseAdmin.from("profiles").select("id, email, full_name, plan, created_at").order("created_at", { ascending: false }).limit(8),
    ]);

    const rows = profiles.data ?? [];
    const usageRows = usage.data ?? [];
    const nowIso = new Date().toISOString();
    return {
      totals: {
        customers: rows.length,
        suspended: rows.filter((r) => r.suspended).length,
        trialing: rows.filter((r) => (r.plan === "trial" || r.plan === "free") && (r.trial_ends_at ?? "") > nowIso).length,
        trialExpired: rows.filter((r) => (r.plan === "trial" || r.plan === "free") && (r.trial_ends_at ?? "") <= nowIso).length,
        paying: (subs.data ?? []).filter((s) => s.status === "active" || s.status === "trialing").length,
        measurements30d: (batches.data ?? []).length,
        errors24h: (errors.data ?? []).length,
        apiCost30d: usageRows.reduce((sum, r) => sum + Number(r.cost_usd ?? 0), 0),
        apiCalls30d: usageRows.length,
        apiErrors30d: usageRows.filter((r) => r.status !== "ok").length,
      },
      recentErrors: errors.data ?? [],
      recentUsers: recentUsers.data ?? [],
    };
  });

export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const [{ data: profiles }, { data: brands }, { data: members }, { data: subs }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, email, full_name, plan, plan_source, plan_expires_at, trial_ends_at, suspended, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("brands").select("id, created_by"),
      supabaseAdmin.from("brand_members").select("brand_id, user_id"),
      supabaseAdmin.from("subscriptions").select("user_id, status, current_period_end"),
    ]);
    const brandCount = new Map<string, number>();
    for (const m of members ?? []) brandCount.set(m.user_id, (brandCount.get(m.user_id) ?? 0) + 1);
    for (const b of brands ?? []) if (!brandCount.has(b.created_by)) brandCount.set(b.created_by, 1);
    const subMap = new Map((subs ?? []).map((s) => [s.user_id, s]));
    return (profiles ?? []).map((p) => ({
      ...p,
      brandCount: brandCount.get(p.id) ?? 0,
      subscriptionStatus: subMap.get(p.id)?.status ?? null,
      periodEnd: subMap.get(p.id)?.current_period_end ?? null,
    }));
  });

export const adminCustomerDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const { data: profileRow } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, plan, plan_source, plan_expires_at, trial_ends_at, suspended, created_at")
      .eq("id", data.userId).maybeSingle();
    let profile = profileRow;
    if (!profile) {
      // Profil satırı yoksa auth kaydından türet (blank screen yerine kullanılabilir detay)
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      const u = authUser?.user;
      profile = {
        id: data.userId,
        email: u?.email ?? null,
        full_name: (u?.user_metadata?.["full_name"] as string | undefined) ?? null,
        plan: "expired",
        plan_source: "manual",
        plan_expires_at: null,
        trial_ends_at: null,
        suspended: false,
        created_at: u?.created_at ?? new Date().toISOString(),
      } as typeof profileRow;
    }

    const { data: memberships } = await supabaseAdmin.from("brand_members").select("brand_id, role").eq("user_id", data.userId);
    const brandIds = (memberships ?? []).map((m) => m.brand_id);
    const [brands, prompts, competitors, content, subs, notes, errors, usage] = await Promise.all([
      brandIds.length ? supabaseAdmin.from("brands").select("id, name, domain, onboarding_completed, created_at").in("id", brandIds) : Promise.resolve({ data: [] as any[] }),
      brandIds.length ? supabaseAdmin.from("prompts").select("id, status").in("brand_id", brandIds) : Promise.resolve({ data: [] as any[] }),
      brandIds.length ? supabaseAdmin.from("competitor_candidates").select("id, status").in("brand_id", brandIds) : Promise.resolve({ data: [] as any[] }),
      brandIds.length ? supabaseAdmin.from("content_drafts").select("id").in("brand_id", brandIds) : Promise.resolve({ data: [] as any[] }),
      supabaseAdmin.from("subscriptions").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }),
      supabaseAdmin.from("admin_notes").select("id, note, admin_id, created_at").eq("user_id", data.userId).order("created_at", { ascending: false }),
      supabaseAdmin.from("error_logs").select("id, level, message, path, created_at").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(10),
      brandIds.length ? supabaseAdmin.from("api_usage_log").select("provider, cost_usd").in("brand_id", brandIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const integrations = brandIds.length
      ? (await supabaseAdmin.from("integration_connections").select("brand_id, provider, status, last_sync_at").in("brand_id", brandIds)).data ?? []
      : [];

    return {
      profile,
      brands: brands.data ?? [],
      integrations,
      usage: {
        prompts: (prompts.data ?? []).filter((p: any) => p.status === "approved" || p.status === "tracked").length,
        promptsTotal: (prompts.data ?? []).length,
        competitors: (competitors.data ?? []).filter((c: any) => c.status === "approved").length,
        content: (content.data ?? []).length,
        apiCost: (usage.data ?? []).reduce((sum: number, r: any) => sum + Number(r.cost_usd ?? 0), 0),
      },
      subscriptions: subs.data ?? [],
      notes: notes.data ?? [],
      errors: errors.data ?? [],
    };
  });

export const adminSetPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; plan: string; expiresAt?: string | null; reason?: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    const allowed = ["trial", "expired", "starter", "growth", "agency"];
    if (!allowed.includes(data.plan)) throw new Error("Geçersiz plan");
    const { error } = await session.supabaseAdmin
      .from("profiles")
      .update({ plan: data.plan, plan_source: "manual", plan_expires_at: data.expiresAt ?? null })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await audit(session, "plan.change", { type: "user", id: data.userId }, { plan: data.plan, expiresAt: data.expiresAt ?? null, reason: data.reason ?? null });
    return { ok: true };
  });

export const adminExtendTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; days: number }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    const days = Math.max(1, Math.min(365, Math.round(data.days)));
    const { data: profile } = await session.supabaseAdmin.from("profiles").select("trial_ends_at").eq("id", data.userId).maybeSingle();
    const base = profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date() ? new Date(profile.trial_ends_at) : new Date();
    const next = new Date(base.getTime() + days * 24 * 3600_000).toISOString();
    const { error } = await session.supabaseAdmin.from("profiles").update({ trial_ends_at: next, plan: "trial", plan_source: "manual" }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    await audit(session, "trial.extend", { type: "user", id: data.userId }, { days, until: next });
    return { ok: true, until: next };
  });

export const adminToggleSuspend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; suspended: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    const { error } = await session.supabaseAdmin.from("profiles").update({ suspended: data.suspended }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    await audit(session, data.suspended ? "account.suspend" : "account.unsuspend", { type: "user", id: data.userId });
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; confirmEmail: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    if (data.userId === session.adminId) throw new Error("Kendi hesabınızı silemezsiniz");
    const { data: profile } = await session.supabaseAdmin.from("profiles").select("email").eq("id", data.userId).maybeSingle();
    if (!profile) throw new Error("Hesap bulunamadı");
    if ((profile.email ?? "").toLowerCase() !== data.confirmEmail.trim().toLowerCase()) {
      throw new Error("Onay için hesabın e-posta adresini birebir yazın");
    }
    const { data: owned } = await session.supabaseAdmin.from("brands").select("id").eq("created_by", data.userId);
    for (const brand of owned ?? []) {
      await session.supabaseAdmin.from("brands").delete().eq("id", brand.id);
    }
    await session.supabaseAdmin.from("brand_members").delete().eq("user_id", data.userId);
    await session.supabaseAdmin.auth.admin.deleteUser(data.userId);
    await session.supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    await audit(session, "account.delete", { type: "user", id: data.userId }, { email: profile.email });
    return { ok: true };
  });

export const adminAddNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; note: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    const note = data.note.trim();
    if (note.length < 3) throw new Error("Not çok kısa");
    const { error } = await session.supabaseAdmin.from("admin_notes").insert({ user_id: data.userId, admin_id: session.adminId, note });
    if (error) throw new Error(error.message);
    await audit(session, "note.add", { type: "user", id: data.userId });
    return { ok: true };
  });

export const adminListSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const { data: subs } = await supabaseAdmin.from("subscriptions").select("*").order("created_at", { ascending: false });
    const ids = Array.from(new Set((subs ?? []).map((s) => s.user_id)));
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, email, plan").in("id", ids)
      : { data: [] as any[] };
    const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return (subs ?? []).map((s) => ({ ...s, email: map.get(s.user_id)?.email ?? null, profilePlan: map.get(s.user_id)?.plan ?? null }));
  });

export const adminApiUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { days?: number }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const days = Math.max(1, Math.min(90, data.days ?? 30));
    const since = new Date(Date.now() - days * 24 * 3600_000).toISOString();
    const { data: rows } = await supabaseAdmin
      .from("api_usage_log")
      .select("provider, operation, model, brand_id, duration_ms, input_tokens, output_tokens, cost_usd, cached, status, error, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    const list = rows ?? [];

    const byProvider = new Map<string, { provider: string; calls: number; errors: number; cost: number; tokens: number; totalMs: number; maxMs: number; cached: number }>();
    const byDay = new Map<string, { day: string; calls: number; cost: number; errors: number }>();
    for (const row of list) {
      const p = byProvider.get(row.provider) ?? { provider: row.provider, calls: 0, errors: 0, cost: 0, tokens: 0, totalMs: 0, maxMs: 0, cached: 0 };
      p.calls += 1;
      if (row.status !== "ok") p.errors += 1;
      if (row.cached) p.cached += 1;
      p.cost += Number(row.cost_usd ?? 0);
      p.tokens += (row.input_tokens ?? 0) + (row.output_tokens ?? 0);
      p.totalMs += row.duration_ms ?? 0;
      p.maxMs = Math.max(p.maxMs, row.duration_ms ?? 0);
      byProvider.set(row.provider, p);

      const day = String(row.created_at).slice(0, 10);
      const d = byDay.get(day) ?? { day, calls: 0, cost: 0, errors: 0 };
      d.calls += 1;
      d.cost += Number(row.cost_usd ?? 0);
      if (row.status !== "ok") d.errors += 1;
      byDay.set(day, d);
    }

    const brandIds = Array.from(new Set(list.map((r) => r.brand_id).filter(Boolean))) as string[];
    const { data: brands } = brandIds.length
      ? await supabaseAdmin.from("brands").select("id, name").in("id", brandIds)
      : { data: [] as any[] };
    const brandNames = new Map((brands ?? []).map((b: any) => [b.id, b.name]));
    const byBrand = new Map<string, { brand: string; calls: number; cost: number }>();
    for (const row of list) {
      if (!row.brand_id) continue;
      const key = brandNames.get(row.brand_id) ?? row.brand_id;
      const b = byBrand.get(key) ?? { brand: key, calls: 0, cost: 0 };
      b.calls += 1;
      b.cost += Number(row.cost_usd ?? 0);
      byBrand.set(key, b);
    }

    return {
      days,
      providers: Array.from(byProvider.values())
        .map((p) => ({ ...p, avgMs: p.calls ? Math.round(p.totalMs / p.calls) : 0 }))
        .sort((a, b) => b.cost - a.cost),
      daily: Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day)),
      brands: Array.from(byBrand.values()).sort((a, b) => b.cost - a.cost).slice(0, 15),
      failures: list.filter((r) => r.status !== "ok").slice(0, 40),
      slowest: [...list].sort((a, b) => (b.duration_ms ?? 0) - (a.duration_ms ?? 0)).slice(0, 10),
      totals: {
        calls: list.length,
        cost: list.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0),
        errors: list.filter((r) => r.status !== "ok").length,
        cached: list.filter((r) => r.cached).length,
      },
    };
  });

export const adminProviderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const providers = [
      { key: "perplexity", label: "Perplexity", env: "PERPLEXITY_API_KEY", usage: "Ölçüm, arama, embedding" },
      { key: "deepseek", label: "DeepSeek", env: "DEEPSEEK_API_KEY", usage: "Analiz, içerik ve prompt üretimi" },
      { key: "lovable-ai", label: "Lovable AI", env: "LOVABLE_API_KEY", usage: "E-posta ve yardımcı modeller" },
      { key: "firecrawl", label: "Firecrawl", env: "FIRECRAWL_API_KEY", usage: "Site tarama / render" },
      { key: "google", label: "Google (GSC & GA4)", env: "GOOGLE_OAUTH_CLIENT_ID", usage: "Müşteri bazlı trafik verisi" },
      { key: "paddle", label: "Paddle", env: "PADDLE_LIVE_API_KEY", usage: "Ödeme ve abonelik" },
    ];
    const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
    const { data: rows } = await supabaseAdmin
      .from("api_usage_log").select("provider, status, created_at").gte("created_at", since);
    return providers.map((p) => {
      const own = (rows ?? []).filter((r) => r.provider === p.key);
      const lastCall = own.map((r) => r.created_at).sort().at(-1) ?? null;
      const errors = own.filter((r) => r.status !== "ok").length;
      return {
        ...p,
        configured: Boolean(process.env[p.env]),
        calls7d: own.length,
        errors7d: errors,
        lastCall,
        health: !process.env[p.env] ? "missing" : errors > own.length * 0.2 && own.length > 0 ? "degraded" : "ok",
      };
    });
  });

export const adminListErrors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { level?: string; resolved?: boolean; search?: string; source?: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    let query = supabaseAdmin.from("error_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.level && data.level !== "all") query = query.eq("level", data.level);
    if (data.source && data.source !== "all") query = query.eq("source", data.source);
    if (typeof data.resolved === "boolean") query = query.eq("resolved", data.resolved);
    if (data.search?.trim()) query = query.ilike("message", `%${data.search.trim()}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminResolveError = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; resolved: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    const session = await assertAdmin(context);
    const { error } = await session.supabaseAdmin.from("error_logs").update({
      resolved: data.resolved,
      resolved_at: data.resolved ? new Date().toISOString() : null,
      resolved_by: data.resolved ? session.adminId : null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminClearResolvedErrors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    const { error } = await session.supabaseAdmin.from("error_logs").delete().eq("resolved", true);
    if (error) throw new Error(error.message);
    await audit(session, "errors.clear_resolved");
    return { ok: true };
  });

export const adminListEmailLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const { data } = await supabaseAdmin.from("email_logs").select("*").order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

export const adminListEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const { TEMPLATE_DEFS } = await import("./admin-email-defs");
    const { data: rows } = await supabaseAdmin.from("email_templates").select("*");
    const map = new Map((rows ?? []).map((r) => [r.key, r]));
    return TEMPLATE_DEFS.map((def) => {
      const row = map.get(def.key);
      return {
        ...def,
        subject: row?.subject ?? def.subject,
        body: row?.body ?? def.body,
        customized: Boolean(row),
        version: row?.version ?? 1,
        updatedAt: row?.updated_at ?? null,
      };
    });
  });

export const adminSaveEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string; subject: string; body: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    const { TEMPLATE_DEFS } = await import("./admin-email-defs");
    const def = TEMPLATE_DEFS.find((t) => t.key === data.key);
    if (!def) throw new Error("Bilinmeyen şablon");
    if (data.subject.trim().length < 3) throw new Error("Konu çok kısa");
    if (data.body.trim().length < 20) throw new Error("İçerik çok kısa");
    const { data: existing } = await session.supabaseAdmin.from("email_templates").select("version").eq("key", data.key).maybeSingle();
    const { error } = await session.supabaseAdmin.from("email_templates").upsert({
      key: data.key,
      title: def.title,
      subject: data.subject.trim(),
      body: data.body,
      version: (existing?.version ?? 0) + 1,
      updated_by: session.adminId,
    }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    await audit(session, "email_template.save", { type: "template", id: data.key });
    return { ok: true };
  });

export const adminResetEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    await session.supabaseAdmin.from("email_templates").delete().eq("key", data.key);
    await audit(session, "email_template.reset", { type: "template", id: data.key });
    return { ok: true };
  });

export const adminSendEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { to: string; subject: string; body: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    const { sendRawEmail } = await import("./admin-email.server");
    const result = await sendRawEmail(data.to, data.subject, data.body);
    await audit(session, "email.send", { type: "email", id: data.to }, { subject: data.subject });
    return result;
  });

export const adminBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan: string; subject: string; body: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    let query = session.supabaseAdmin.from("profiles").select("id, email, full_name, plan").not("email", "is", null);
    if (data.plan !== "all") query = query.eq("plan", data.plan);
    const { data: recipients } = await query;
    const list = (recipients ?? []).filter((r) => r.email);
    const { sendRawEmail } = await import("./admin-email.server");
    let sent = 0;
    let failed = 0;
    for (const person of list) {
      const ok = await sendRawEmail(person.email!, data.subject, data.body, { name: person.full_name ?? "", email: person.email! });
      if (ok.sent) sent += 1;
      else failed += 1;
    }
    await audit(session, "email.broadcast", { type: "plan", id: data.plan }, { sent, failed, subject: data.subject });
    return { sent, failed, total: list.length };
  });

export const adminUserEmailAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; action: "reset_password" | "resend_verification" | "change_email"; newEmail?: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    const { data: profile } = await session.supabaseAdmin.from("profiles").select("email").eq("id", data.userId).maybeSingle();
    const email = profile?.email;
    if (!email) throw new Error("Hesabın e-posta adresi yok");

    if (data.action === "change_email") {
      const next = (data.newEmail ?? "").trim().toLowerCase();
      if (!next.includes("@")) throw new Error("Geçerli bir e-posta girin");
      const { error } = await session.supabaseAdmin.auth.admin.updateUserById(data.userId, { email: next, email_confirm: true });
      if (error) throw new Error(error.message);
      await session.supabaseAdmin.from("profiles").update({ email: next }).eq("id", data.userId);
      await audit(session, "email.change", { type: "user", id: data.userId }, { from: email, to: next });
      return { ok: true, message: "E-posta güncellendi" };
    }

    const type = data.action === "reset_password" ? "recovery" : "signup";
    const { data: link, error } = await session.supabaseAdmin.auth.admin.generateLink({ type: type as any, email });
    if (error) throw new Error(error.message);
    await audit(session, `email.${data.action}`, { type: "user", id: data.userId });
    return { ok: true, message: "Bağlantı oluşturuldu", link: link?.properties?.action_link ?? null };
  });

export const adminListAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role, created_at");
    const ids = (roles ?? []).map((r) => r.user_id);
    const { data: profiles } = ids.length ? await supabaseAdmin.from("profiles").select("id, email, full_name").in("id", ids) : { data: [] as any[] };
    const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return (roles ?? []).map((r) => ({ ...r, email: map.get(r.user_id)?.email ?? null, fullName: map.get(r.user_id)?.full_name ?? null }));
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; role: "admin" | "member"; grant: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, audit } = await import("./admin.server");
    const session = await assertAdmin(context);
    const email = data.email.trim().toLowerCase();
    const { data: profile } = await session.supabaseAdmin.from("profiles").select("id, email").ilike("email", email).maybeSingle();
    if (!profile) throw new Error("Bu e-postaya sahip hesap bulunamadı");
    if (!data.grant && profile.id === session.adminId && data.role === "admin") {
      throw new Error("Kendi yönetici yetkinizi kaldıramazsınız");
    }
    if (data.grant) {
      const { error } = await session.supabaseAdmin.from("user_roles").upsert({ user_id: profile.id, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await session.supabaseAdmin.from("user_roles").delete().eq("user_id", profile.id).eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    await audit(session, data.grant ? "role.grant" : "role.revoke", { type: "user", id: profile.id }, { role: data.role, email });
    return { ok: true };
  });

export const adminAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const { data } = await supabaseAdmin.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });
