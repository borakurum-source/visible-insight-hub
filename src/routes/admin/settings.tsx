import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldPlus, ShieldMinus } from "lucide-react";
import { toast } from "sonner";
import { adminAuditLog, adminListAdmins, adminSetRole } from "@/lib/admin.functions";
import { AdminCard, AdminHeading, dateTime, EmptyRow, Pill, Table } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Yetki & Denetim — OneCite Yönetim" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const fetchAdmins = useServerFn(adminListAdmins);
  const fetchAudit = useServerFn(adminAuditLog);
  const setRole = useServerFn(adminSetRole);
  const [email, setEmail] = useState("");

  const admins = useQuery({ queryKey: ["admin", "admins"], queryFn: () => fetchAdmins() });
  const audit = useQuery({ queryKey: ["admin", "audit"], queryFn: () => fetchAudit() });

  const roleMutation = useMutation({
    mutationFn: (input: { email: string; grant: boolean }) => setRole({ data: { email: input.email, role: "admin", grant: input.grant } }),
    onSuccess: () => {
      toast.success("Yetki güncellendi");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const adminRows = (admins.data ?? []).filter((r) => r.role === "admin");

  return (
    <div className="space-y-5">
      <AdminHeading title="Yetki & denetim" description="Yönetici hesaplarını yönetin ve tüm yönetim işlemlerinin kaydını görün." />

      <AdminCard title="Yöneticiler">
        <div className="mb-4 flex flex-wrap gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yeni-admin@1cite.com" className="max-w-xs" />
          <Button size="sm" onClick={() => roleMutation.mutate({ email, grant: true })} disabled={!email || roleMutation.isPending}>
            <ShieldPlus className="mr-1 h-3.5 w-3.5" /> Yönetici yap
          </Button>
        </div>
        {admins.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-sky-600" /> : (
          <Table head={["Hesap", "Rol", "Tarih", ""]}>
            {adminRows.map((row) => (
              <tr key={`${row.user_id}-${row.role}`}>
                <td className="px-3 py-2">
                  <div className="text-slate-900">{row.fullName || "—"}</div>
                  <div className="text-xs text-slate-500">{row.email}</div>
                </td>
                <td className="px-3 py-2"><Pill tone="info">{row.role}</Pill></td>
                <td className="px-3 py-2 text-xs text-slate-500">{dateTime(row.created_at)}</td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => row.email && roleMutation.mutate({ email: row.email, grant: false })}>
                    <ShieldMinus className="mr-1 h-3.5 w-3.5" /> Kaldır
                  </Button>
                </td>
              </tr>
            ))}
            {adminRows.length === 0 ? <EmptyRow colSpan={4}>Yönetici yok.</EmptyRow> : null}
          </Table>
        )}
      </AdminCard>

      <AdminCard title="Denetim kaydı">
        {audit.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-sky-600" /> : (
          <Table head={["Zaman", "Yönetici", "İşlem", "Hedef", "Detay"]}>
            {(audit.data ?? []).map((row: any) => (
              <tr key={row.id}>
                <td className="px-3 py-2 text-xs text-slate-500">{dateTime(row.created_at)}</td>
                <td className="px-3 py-2 text-xs text-slate-600">{row.admin_email ?? row.admin_id}</td>
                <td className="px-3 py-2"><Pill>{row.action}</Pill></td>
                <td className="px-3 py-2 text-xs text-slate-500">{row.target_type ?? "—"}</td>
                <td className="px-3 py-2 text-[11px] text-slate-500">{row.detail ? JSON.stringify(row.detail) : "—"}</td>
              </tr>
            ))}
            {(audit.data ?? []).length === 0 ? <EmptyRow colSpan={5}>Kayıt yok.</EmptyRow> : null}
          </Table>
        )}
      </AdminCard>
    </div>
  );
}
