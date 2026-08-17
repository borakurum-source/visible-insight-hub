import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail, RotateCcw, Save, Send } from "lucide-react";
import { toast } from "sonner";
import {
  adminBroadcast, adminListEmailLogs, adminListEmailTemplates,
  adminResetEmailTemplate, adminSaveEmailTemplate, adminSendEmail,
} from "@/lib/admin.functions";
import { AdminCard, AdminHeading, dateTime, EmptyRow, Pill, PLAN_LABEL, Table } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/emails")({
  head: () => ({ meta: [{ title: "E-posta Yönetimi — OneCite Yönetim" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: EmailsPage,
});

function EmailsPage() {
  return (
    <div className="space-y-5">
      <AdminHeading title="E-posta yönetimi" description="Şablonları düzenleyin, tekil veya toplu bildirim gönderin, gönderim kayıtlarını izleyin." />
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Şablonlar</TabsTrigger>
          <TabsTrigger value="send">Gönder</TabsTrigger>
          <TabsTrigger value="logs">Kayıtlar</TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
        <TabsContent value="send" className="mt-4"><SendTab /></TabsContent>
        <TabsContent value="logs" className="mt-4"><LogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function TemplatesTab() {
  const queryClient = useQueryClient();
  const fetchTemplates = useServerFn(adminListEmailTemplates);
  const saveTemplate = useServerFn(adminSaveEmailTemplate);
  const resetTemplate = useServerFn(adminResetEmailTemplate);
  const sendEmail = useServerFn(adminSendEmail);
  const [drafts, setDrafts] = useState<Record<string, { subject: string; body: string }>>({});
  const [testTo, setTestTo] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin", "email-templates"], queryFn: () => fetchTemplates() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "email-templates"] });

  const saveMutation = useMutation({
    mutationFn: (input: { key: string; subject: string; body: string }) => saveTemplate({ data: input }),
    onSuccess: () => { toast.success("Şablon kaydedildi"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const resetMutation = useMutation({
    mutationFn: (key: string) => resetTemplate({ data: { key } }),
    onSuccess: () => { toast.success("Varsayılana döndü"); setDrafts({}); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const testMutation = useMutation({
    mutationFn: (input: { to: string; subject: string; body: string }) => sendEmail({ data: input }),
    onSuccess: (res: any) => (res.sent ? toast.success("Test gönderildi") : toast.error("Gönderilemedi: " + res.reason)),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-cyan" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <Label className="text-xs text-slate-400">Test adresi</Label>
        <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="ornek@1cite.com" className="max-w-xs" />
      </div>
      {(data ?? []).map((tpl) => {
        const draft = drafts[tpl.key] ?? { subject: tpl.subject, body: tpl.body };
        return (
          <AdminCard
            key={tpl.key}
            title={tpl.title}
            action={tpl.customized ? <Pill tone="warn">v{tpl.version} özel · {dateTime(tpl.updatedAt)}</Pill> : <Pill>varsayılan</Pill>}
          >
            <p className="mb-2 text-xs text-slate-500">
              {tpl.description} · Değişkenler: {tpl.variables.map((v: string) => `{{${v}}}`).join(", ")}
            </p>
            <div className="space-y-2">
              <Input value={draft.subject} onChange={(e) => setDrafts((p) => ({ ...p, [tpl.key]: { ...draft, subject: e.target.value } }))} placeholder="Konu" />
              <Textarea rows={8} value={draft.body} onChange={(e) => setDrafts((p) => ({ ...p, [tpl.key]: { ...draft, body: e.target.value } }))} className="font-mono text-xs" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => saveMutation.mutate({ key: tpl.key, ...draft })} disabled={saveMutation.isPending}>
                <Save className="mr-1 h-3.5 w-3.5" /> Kaydet
              </Button>
              <Button size="sm" variant="outline" disabled={!testTo} onClick={() => testMutation.mutate({ to: testTo, subject: draft.subject, body: draft.body })}>
                <Send className="mr-1 h-3.5 w-3.5" /> Test gönder
              </Button>
              {tpl.customized ? (
                <Button size="sm" variant="ghost" onClick={() => resetMutation.mutate(tpl.key)}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Varsayılana dön
                </Button>
              ) : null}
            </div>
          </AdminCard>
        );
      })}
    </div>
  );
}

function SendTab() {
  const sendEmail = useServerFn(adminSendEmail);
  const broadcast = useServerFn(adminBroadcast);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("<p>Merhaba {{name}},</p>\n<p></p>");
  const [plan, setPlan] = useState("all");

  const singleMutation = useMutation({
    mutationFn: () => sendEmail({ data: { to, subject, body } }),
    onSuccess: (res: any) => (res.sent ? toast.success("Gönderildi") : toast.error("Gönderilemedi: " + res.reason)),
    onError: (e: Error) => toast.error(e.message),
  });
  const broadcastMutation = useMutation({
    mutationFn: () => broadcast({ data: { plan, subject, body } }),
    onSuccess: (res: any) => toast.success(`${res.sent}/${res.total} gönderildi`),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AdminCard title="Tekil gönderim">
        <div className="space-y-2">
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Alıcı e-posta" />
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Konu" />
          <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-xs" />
          <Button size="sm" onClick={() => singleMutation.mutate()} disabled={singleMutation.isPending || !to || !subject}>
            <Mail className="mr-1 h-3.5 w-3.5" /> Gönder
          </Button>
        </div>
      </AdminCard>
      <AdminCard title="Toplu bildirim">
        <p className="mb-2 text-xs text-slate-500">Sol taraftaki konu ve içerik kullanılır. {"{{name}}"} ve {"{{email}}"} değişkenleri desteklenir.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm hesaplar</SelectItem>
              {["trial", "expired", "starter", "growth", "agency"].map((p) => (
                <SelectItem key={p} value={p}>{PLAN_LABEL[p] ?? p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => broadcastMutation.mutate()} disabled={broadcastMutation.isPending || !subject}>
            {broadcastMutation.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
            Toplu gönder
          </Button>
        </div>
      </AdminCard>
    </div>
  );
}

function LogsTab() {
  const fetchLogs = useServerFn(adminListEmailLogs);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "email-logs"], queryFn: () => fetchLogs() });
  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-cyan" />;
  return (
    <AdminCard>
      <Table head={["Zaman", "Alıcı", "Konu", "Şablon", "Durum"]}>
        {(data ?? []).map((row: any) => (
          <tr key={row.id}>
            <td className="px-3 py-2 text-xs text-slate-400">{dateTime(row.created_at)}</td>
            <td className="px-3 py-2 text-white">{row.to_email}</td>
            <td className="px-3 py-2 text-xs text-slate-300">{row.subject}</td>
            <td className="px-3 py-2 text-xs text-slate-500">{row.template_key ?? "—"}</td>
            <td className="px-3 py-2">
              <Pill tone={row.status === "sent" ? "good" : row.status === "suppressed" ? "warn" : "bad"}>{row.status}</Pill>
            </td>
          </tr>
        ))}
        {(data ?? []).length === 0 ? <EmptyRow colSpan={5}>Gönderim kaydı yok.</EmptyRow> : null}
      </Table>
    </AdminCard>
  );
}
