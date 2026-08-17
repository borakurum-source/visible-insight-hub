import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { adminListSubscriptions } from "@/lib/admin.functions";
import { AdminCard, AdminHeading, dateOnly, EmptyRow, Pill, PLAN_LABEL, StatCard, Table } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "Abonelikler — OneCite Yönetim" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const fetchSubs = useServerFn(adminListSubscriptions);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "subscriptions"], queryFn: () => fetchSubs() });
  const rows = data ?? [];
  const active = rows.filter((r) => r.status === "active" || r.status === "trialing").length;
  const canceling = rows.filter((r) => r.cancel_at_period_end).length;

  return (
    <div className="space-y-5">
      <AdminHeading title="Abonelikler" description="Paddle üzerinden gelen abonelik kayıtları ve durumları." />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Aktif abonelik" value={active} tone="good" />
        <StatCard label="Dönem sonunda iptal" value={canceling} tone="warn" />
        <StatCard label="Toplam kayıt" value={rows.length} />
      </div>
      <AdminCard>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-sky-600" /> : (
          <Table head={["Hesap", "Durum", "Plan", "Ortam", "Dönem sonu", "Paddle ID"]}>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2 text-slate-900">{row.email ?? row.user_id}</td>
                <td className="px-3 py-2">
                  <Pill tone={row.status === "active" ? "good" : row.status === "canceled" ? "bad" : "warn"}>{row.status}</Pill>
                  {row.cancel_at_period_end ? <Pill tone="warn">iptal edilecek</Pill> : null}
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">{PLAN_LABEL[row.profilePlan ?? ""] ?? row.profilePlan ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{row.environment}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{dateOnly(row.current_period_end)}</td>
                <td className="px-3 py-2 text-[11px] text-slate-500">{row.paddle_subscription_id}</td>
              </tr>
            ))}
            {rows.length === 0 ? <EmptyRow colSpan={6}>Henüz abonelik yok.</EmptyRow> : null}
          </Table>
        )}
      </AdminCard>
    </div>
  );
}
