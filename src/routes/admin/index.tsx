import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { adminOverview, adminProviderStatus } from "@/lib/admin.functions";
import { AdminCard, AdminHeading, dateTime, money, Pill, PLAN_LABEL, StatCard, Table, EmptyRow } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Genel Bakış — OneCite Yönetim" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const fetchOverview = useServerFn(adminOverview);
  const fetchProviders = useServerFn(adminProviderStatus);
  const overview = useQuery({ queryKey: ["admin", "overview"], queryFn: () => fetchOverview() });
  const providers = useQuery({ queryKey: ["admin", "providers"], queryFn: () => fetchProviders() });

  if (overview.isLoading) return <Loader2 className="h-5 w-5 animate-spin text-cyan" />;
  const totals = overview.data?.totals;

  return (
    <div className="space-y-6">
      <AdminHeading title="Genel bakış" description="Hesaplar, gelir, API maliyeti ve sistem sağlığı tek ekranda." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam hesap" value={totals?.customers ?? 0} hint={`${totals?.suspended ?? 0} askıda`} />
        <StatCard label="Ödeyen abone" value={totals?.paying ?? 0} tone="good" hint={`${totals?.trialing ?? 0} denemede`} />
        <StatCard label="Denemesi biten" value={totals?.trialExpired ?? 0} tone="warn" hint="Dönüşüm fırsatı" />
        <StatCard label="30 gün API maliyeti" value={money(totals?.apiCost30d ?? 0)} hint={`${totals?.apiCalls30d ?? 0} çağrı`} />
        <StatCard label="30 gün ölçüm" value={totals?.measurements30d ?? 0} />
        <StatCard label="API hataları (30g)" value={totals?.apiErrors30d ?? 0} tone={(totals?.apiErrors30d ?? 0) > 0 ? "warn" : "good"} />
        <StatCard label="Hata logu (24s)" value={totals?.errors24h ?? 0} tone={(totals?.errors24h ?? 0) > 0 ? "bad" : "good"} />
        <StatCard
          label="Tahmini brüt marj"
          value={totals ? money(Math.max(0, totals.paying * 49 - totals.apiCost30d)) : "—"}
          hint="Ödeyen abone × ~$49 − API"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Sağlayıcı durumu" action={<Link to="/admin/api" className="text-xs text-cyan">Detay</Link>}>
          <div className="space-y-2">
            {providers.data?.map((p) => (
              <div key={p.key} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm text-white">{p.label}</div>
                  <div className="truncate text-xs text-slate-500">{p.usage}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="tabular-nums">{p.calls7d} çağrı</span>
                  <Pill tone={p.health === "ok" ? "good" : p.health === "missing" ? "bad" : "warn"}>
                    {p.health === "ok" ? "Aktif" : p.health === "missing" ? "Anahtar yok" : "Sorunlu"}
                  </Pill>
                </div>
              </div>
            )) ?? <div className="text-sm text-slate-500">Yükleniyor…</div>}
          </div>
        </AdminCard>

        <AdminCard title="Son hatalar" action={<Link to="/admin/errors" className="text-xs text-cyan">Tümü</Link>}>
          <div className="space-y-2">
            {(overview.data?.recentErrors ?? []).map((e: any) => (
              <div key={e.id} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <Pill tone={e.level === "error" || e.level === "fatal" ? "bad" : "warn"}>{e.level}</Pill>
                  <span className="text-[11px] text-slate-500">{dateTime(e.created_at)}</span>
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-slate-300">{e.message}</div>
              </div>
            ))}
            {(overview.data?.recentErrors ?? []).length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">Son 24 saatte hata yok.</div>
            ) : null}
          </div>
        </AdminCard>
      </div>

      <AdminCard title="Yeni kayıtlar" action={<Link to="/admin/customers" className="text-xs text-cyan">Tüm müşteriler</Link>}>
        <Table head={["Hesap", "Plan", "Kayıt"]}>
          {(overview.data?.recentUsers ?? []).map((u: any) => (
            <tr key={u.id}>
              <td className="px-3 py-2">
                <div className="text-white">{u.full_name || "—"}</div>
                <div className="text-xs text-slate-500">{u.email}</div>
              </td>
              <td className="px-3 py-2"><Pill tone={u.plan === "trial" ? "info" : "good"}>{PLAN_LABEL[u.plan] ?? u.plan}</Pill></td>
              <td className="px-3 py-2 text-xs text-slate-400">{dateTime(u.created_at)}</td>
            </tr>
          ))}
          {(overview.data?.recentUsers ?? []).length === 0 ? <EmptyRow colSpan={3}>Kayıt yok.</EmptyRow> : null}
        </Table>
      </AdminCard>
    </div>
  );
}
