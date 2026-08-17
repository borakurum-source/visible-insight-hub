import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, ShieldOff, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import {
  adminAddNote, adminCustomerDetail, adminDeleteUser, adminExtendTrial,
  adminListCustomers, adminSetPlan, adminToggleSuspend, adminUserEmailAction,
} from "@/lib/admin.functions";
import { AdminCard, AdminHeading, dateOnly, dateTime, EmptyRow, money, Pill, PLAN_LABEL, Table } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Müşteriler — OneCite Yönetim" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CustomersPage,
});

const PLANS = ["trial", "expired", "starter", "growth", "agency"];

function CustomersPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const fetchCustomers = useServerFn(adminListCustomers);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "customers"], queryFn: () => fetchCustomers() });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((row) => {
      if (planFilter !== "all" && row.plan !== planFilter) return false;
      if (!term) return true;
      return `${row.email ?? ""} ${row.full_name ?? ""}`.toLowerCase().includes(term);
    });
  }, [data, search, planFilter]);

  return (
    <div className="space-y-5">
      <AdminHeading title="Müşteriler" description="Hesapları arayın, plan değiştirin, deneme uzatın, askıya alın veya silin." />

      <AdminCard>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="E-posta veya isim ara" className="pl-9" />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm planlar</SelectItem>
              {PLANS.map((p) => <SelectItem key={p} value={p}>{PLAN_LABEL[p] ?? p}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-slate-500">{rows.length} kayıt</span>
        </div>

        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
        ) : (
          <Table head={["Hesap", "Plan", "Abonelik", "Marka", "API (30g)", "Deneme bitişi", "Kayıt", ""]}>
            {rows.map((row) => (
              <tr key={row.id} className={row.suspended ? "opacity-60" : ""}>
                <td className="px-3 py-2">
                  <div className="text-slate-900">{row.full_name || "—"}</div>
                  <div className="text-xs text-slate-500">{row.email}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Pill tone={row.plan === "expired" ? "bad" : row.plan === "trial" ? "info" : "good"}>{PLAN_LABEL[row.plan] ?? row.plan}</Pill>
                    {row.plan_source === "manual" ? <Pill tone="warn">Manuel</Pill> : null}
                    {row.suspended ? <Pill tone="bad">Askıda</Pill> : null}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">{row.subscriptionStatus ?? "—"}</td>
                <td className="px-3 py-2 text-xs tabular-nums text-slate-500">{row.brandCount}</td>
                <td className="px-3 py-2 text-xs tabular-nums text-sky-600">{money(row.apiCost30d ?? 0)}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{dateOnly(row.trial_ends_at)}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{dateOnly(row.created_at)}</td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => setSelected(row.id)}>
                    <UserCog className="mr-1 h-3.5 w-3.5" /> Yönet
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? <EmptyRow colSpan={8}>Kayıt bulunamadı.</EmptyRow> : null}
          </Table>
        )}
      </AdminCard>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto border-slate-200 bg-white text-slate-900 sm:max-w-xl">
          {selected ? <CustomerDetail userId={selected} onClose={() => setSelected(null)} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CustomerDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const fetchDetail = useServerFn(adminCustomerDetail);
  const setPlan = useServerFn(adminSetPlan);
  const extendTrial = useServerFn(adminExtendTrial);
  const toggleSuspend = useServerFn(adminToggleSuspend);
  const deleteUser = useServerFn(adminDeleteUser);
  const addNote = useServerFn(adminAddNote);
  const emailAction = useServerFn(adminUserEmailAction);

  const { data, isLoading } = useQuery({ queryKey: ["admin", "customer", userId], queryFn: () => fetchDetail({ data: { userId } }) });
  const [plan, setPlanValue] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "customer", userId] });
    queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
  };

  const planMutation = useMutation({
    mutationFn: () => setPlan({ data: { userId, plan: plan || data!.profile.plan, reason } }),
    onSuccess: () => { toast.success("Plan güncellendi"); setReason(""); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const trialMutation = useMutation({
    mutationFn: (days: number) => extendTrial({ data: { userId, days } }),
    onSuccess: () => { toast.success("Deneme uzatıldı"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const suspendMutation = useMutation({
    mutationFn: (suspended: boolean) => toggleSuspend({ data: { userId, suspended } }),
    onSuccess: () => { toast.success("Durum güncellendi"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteUser({ data: { userId, confirmEmail } }),
    onSuccess: () => { toast.success("Hesap silindi"); onClose(); queryClient.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const noteMutation = useMutation({
    mutationFn: () => addNote({ data: { userId, note } }),
    onSuccess: () => { toast.success("Not eklendi"); setNote(""); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const emailMutation = useMutation({
    mutationFn: (action: "reset_password" | "resend_verification" | "change_email") =>
      emailAction({ data: { userId, action, newEmail } }),
    onSuccess: (result: any) => {
      toast.success(result.message);
      if (result.link) navigator.clipboard?.writeText(result.link).then(() => toast.info("Bağlantı panoya kopyalandı"));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <div className="p-6"><Loader2 className="h-5 w-5 animate-spin text-sky-600" /></div>;
  const profile = data.profile;

  return (
    <div className="space-y-5">
      <SheetHeader>
        <SheetTitle className="text-slate-900">{profile.full_name || profile.email}</SheetTitle>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{profile.email}</span>
          <Pill tone={profile.plan === "expired" ? "bad" : "info"}>{PLAN_LABEL[profile.plan] ?? profile.plan}</Pill>
          {profile.suspended ? <Pill tone="bad">Askıda</Pill> : null}
          <span>Kayıt: {dateOnly(profile.created_at)}</span>
        </div>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[
          { label: "Marka", value: data.brands.length },
          { label: "Prompt", value: `${data.usage.prompts}/${data.usage.promptsTotal}` },
          { label: "Rakip", value: data.usage.competitors },
          { label: "API maliyeti", value: money(data.usage.apiCost) },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{item.label}</div>
            <div className="text-sm font-semibold text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>

      <AdminCard title="Plan yönetimi">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={plan || profile.plan} onValueChange={setPlanValue}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>{PLANS.map((p) => <SelectItem key={p} value={p}>{PLAN_LABEL[p] ?? p}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Gerekçe (opsiyonel)" className="min-w-[180px] flex-1" />
            <Button size="sm" onClick={() => planMutation.mutate()} disabled={planMutation.isPending}>Bedelsiz uygula</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            Deneme bitişi: {dateOnly(profile.trial_ends_at)}
            {[7, 14, 30].map((d) => (
              <Button key={d} size="sm" variant="outline" onClick={() => trialMutation.mutate(d)} disabled={trialMutation.isPending}>+{d} gün</Button>
            ))}
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Markalar ve entegrasyonlar">
        {data.brands.length === 0 ? <p className="text-sm text-slate-500">Marka yok.</p> : (
          <div className="space-y-2">
            {data.brands.map((brand: any) => (
              <div key={brand.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm text-slate-900">{brand.name}</div>
                    <div className="text-xs text-slate-500">{brand.domain}</div>
                  </div>
                  <Pill tone={brand.onboarding_completed ? "good" : "warn"}>{brand.onboarding_completed ? "Kurulum tamam" : "Kurulum yarım"}</Pill>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {data.integrations.filter((i: any) => i.brand_id === brand.id).map((i: any) => (
                    <Pill key={i.provider} tone={i.status === "connected" ? "good" : "warn"}>{i.provider}: {i.status}</Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="E-posta işlemleri">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => emailMutation.mutate("reset_password")}>Parola sıfırlama bağlantısı</Button>
          <Button size="sm" variant="outline" onClick={() => emailMutation.mutate("resend_verification")}>Doğrulama bağlantısı</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Yeni e-posta" className="min-w-[200px] flex-1" />
          <Button size="sm" variant="outline" onClick={() => emailMutation.mutate("change_email")} disabled={!newEmail}>E-postayı değiştir</Button>
        </div>
      </AdminCard>

      <AdminCard title="Notlar">
        <div className="flex gap-2">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dahili not" rows={2} />
          <Button size="sm" onClick={() => noteMutation.mutate()} disabled={noteMutation.isPending || note.trim().length < 3}>Ekle</Button>
        </div>
        <div className="mt-3 space-y-2">
          {data.notes.map((n: any) => (
            <div key={n.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <div className="text-[10px] text-slate-500">{dateTime(n.created_at)}</div>
              {n.note}
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Tehlikeli işlemler">
        <div className="space-y-3">
          <Button size="sm" variant="outline" className="w-full" onClick={() => suspendMutation.mutate(!profile.suspended)}>
            <ShieldOff className="mr-2 h-3.5 w-3.5" />
            {profile.suspended ? "Askıyı kaldır" : "Hesabı askıya al"}
          </Button>
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <Label className="text-xs text-red-600">Hesabı kalıcı sil — onay için e-postayı yazın</Label>
            <div className="mt-2 flex gap-2">
              <Input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder={profile.email ?? ""} />
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Sil
              </Button>
            </div>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
