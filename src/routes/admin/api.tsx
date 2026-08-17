import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { adminApiUsage, adminProviderStatus } from "@/lib/admin.functions";
import { AdminCard, AdminHeading, dateTime, EmptyRow, money, Pill, StatCard, Table } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/api")({
  head: () => ({ meta: [{ title: "API & Maliyet — OneCite Yönetim" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ApiPage,
});

function ApiPage() {
  const [days, setDays] = useState(30);
  const fetchUsage = useServerFn(adminApiUsage);
  const fetchProviders = useServerFn(adminProviderStatus);
  const usage = useQuery({ queryKey: ["admin", "api-usage", days], queryFn: () => fetchUsage({ data: { days } }) });
  const providers = useQuery({ queryKey: ["admin", "providers"], queryFn: () => fetchProviders() });
  const maxDaily = Math.max(1, ...(usage.data?.daily ?? []).map((d) => d.cost));

  return (
    <div className="space-y-5">
      <AdminHeading
        title="API & maliyet"
        description="Sağlayıcı bazında çağrı, gecikme, hata ve tahmini maliyet takibi."
        action={
          <div className="flex gap-1">
            {[7, 30, 90].map((d) => (
              <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>{d}g</Button>
            ))}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Toplam çağrı" value={usage.data?.totals.calls ?? 0} />
        <StatCard label="Tahmini maliyet" value={money(usage.data?.totals.cost ?? 0)} />
        <StatCard label="Hatalı çağrı" value={usage.data?.totals.errors ?? 0} tone={(usage.data?.totals.errors ?? 0) > 0 ? "warn" : "good"} />
        <StatCard label="Önbellekten" value={usage.data?.totals.cached ?? 0} tone="good" hint="Tasarruf edilen çağrı" />
      </div>

      <AdminCard title="Sağlayıcı anahtarları">
        <Table head={["Sağlayıcı", "Kullanım", "Anahtar", "7g çağrı", "7g hata", "Son çağrı"]}>
          {(providers.data ?? []).map((p) => (
            <tr key={p.key}>
              <td className="px-3 py-2 text-white">{p.label}</td>
              <td className="px-3 py-2 text-xs text-slate-400">{p.usage}</td>
              <td className="px-3 py-2"><Pill tone={p.configured ? "good" : "bad"}>{p.configured ? "Tanımlı" : "Eksik"}</Pill></td>
              <td className="px-3 py-2 tabular-nums text-slate-300">{p.calls7d}</td>
              <td className="px-3 py-2 tabular-nums text-slate-300">{p.errors7d}</td>
              <td className="px-3 py-2 text-xs text-slate-500">{dateTime(p.lastCall)}</td>
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-xs text-slate-500">
          Anahtar ekleme/çıkarma sunucu tarafı gizli değişkenlerinden yönetilir; bu ekran anahtarın tanımlı olup olmadığını ve sağlığını gösterir.
        </p>
      </AdminCard>

      <AdminCard title="Sağlayıcı bazında maliyet">
        {usage.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-cyan" /> : (
          <Table head={["Sağlayıcı", "Çağrı", "Hata", "Token", "Ort. süre", "En yavaş", "Maliyet"]}>
            {(usage.data?.providers ?? []).map((p) => (
              <tr key={p.provider}>
                <td className="px-3 py-2 text-white">{p.provider}</td>
                <td className="px-3 py-2 tabular-nums text-slate-300">{p.calls}</td>
                <td className="px-3 py-2 tabular-nums text-slate-300">{p.errors}</td>
                <td className="px-3 py-2 tabular-nums text-slate-300">{p.tokens.toLocaleString("tr-TR")}</td>
                <td className="px-3 py-2 tabular-nums text-slate-300">{p.avgMs} ms</td>
                <td className="px-3 py-2 tabular-nums text-slate-300">{p.maxMs} ms</td>
                <td className="px-3 py-2 tabular-nums text-cyan">{money(p.cost)}</td>
              </tr>
            ))}
            {(usage.data?.providers ?? []).length === 0 ? <EmptyRow colSpan={7}>Bu aralıkta kayıt yok.</EmptyRow> : null}
          </Table>
        )}
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Günlük maliyet">
          <div className="flex h-40 items-end gap-1">
            {(usage.data?.daily ?? []).map((d) => (
              <div key={d.day} className="group relative flex-1" title={`${d.day}: ${money(d.cost)} / ${d.calls} çağrı`}>
                <div className="w-full rounded-t bg-cyan/60" style={{ height: `${Math.max(2, (d.cost / maxDaily) * 150)}px` }} />
              </div>
            ))}
            {(usage.data?.daily ?? []).length === 0 ? <div className="text-sm text-slate-500">Veri yok.</div> : null}
          </div>
        </AdminCard>

        <AdminCard title="En çok tüketen markalar">
          <Table head={["Marka", "Çağrı", "Maliyet"]}>
            {(usage.data?.brands ?? []).map((b) => (
              <tr key={b.brand}>
                <td className="px-3 py-2 text-white">{b.brand}</td>
                <td className="px-3 py-2 tabular-nums text-slate-300">{b.calls}</td>
                <td className="px-3 py-2 tabular-nums text-cyan">{money(b.cost)}</td>
              </tr>
            ))}
            {(usage.data?.brands ?? []).length === 0 ? <EmptyRow colSpan={3}>Veri yok.</EmptyRow> : null}
          </Table>
        </AdminCard>
      </div>

      <AdminCard title="Son hatalı çağrılar">
        <Table head={["Zaman", "Sağlayıcı", "İşlem", "Hata"]}>
          {(usage.data?.failures ?? []).map((f, index) => (
            <tr key={`${f.created_at}-${index}`}>
              <td className="px-3 py-2 text-xs text-slate-400">{dateTime(f.created_at)}</td>
              <td className="px-3 py-2 text-white">{f.provider}</td>
              <td className="px-3 py-2 text-xs text-slate-400">{f.operation}</td>
              <td className="px-3 py-2 text-xs text-red-300">{f.error}</td>
            </tr>
          ))}
          {(usage.data?.failures ?? []).length === 0 ? <EmptyRow colSpan={4}>Hatalı çağrı yok.</EmptyRow> : null}
        </Table>
      </AdminCard>
    </div>
  );
}
