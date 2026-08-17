import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, RotateCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminClearResolvedErrors, adminListErrors, adminResolveError } from "@/lib/admin.functions";
import { AdminCard, AdminHeading, dateTime, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/errors")({
  head: () => ({ meta: [{ title: "Hata Logları — OneCite Yönetim" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ErrorsPage,
});

function ErrorsPage() {
  const [level, setLevel] = useState("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("open");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchErrors = useServerFn(adminListErrors);
  const resolve = useServerFn(adminResolveError);
  const clearResolved = useServerFn(adminClearResolvedErrors);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "errors", level, source, status, search],
    queryFn: () => fetchErrors({ data: { level, source, search, ...(status === "all" ? {} : { resolved: status === "resolved" }) } }),
  });

  const resolveMutation = useMutation({
    mutationFn: (input: { id: string; resolved: boolean }) => resolve({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "errors"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const clearMutation = useMutation({
    mutationFn: () => clearResolved(),
    onSuccess: () => { toast.success("Çözülen kayıtlar temizlendi"); queryClient.invalidateQueries({ queryKey: ["admin", "errors"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <AdminHeading
        title="Hata logları"
        description="Sunucu ve tarayıcı tarafındaki hatalar; çözülenleri işaretleyip listeyi temiz tutun."
        action={
          <Button size="sm" variant="outline" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Çözülenleri temizle
          </Button>
        }
      />

      <AdminCard>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hata mesajında ara" className="pl-9" />
          </div>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm seviyeler</SelectItem>
              <SelectItem value="fatal">Fatal</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm kaynaklar</SelectItem>
              <SelectItem value="server">Sunucu</SelectItem>
              <SelectItem value="client">Tarayıcı</SelectItem>
              <SelectItem value="cron">Cron</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Açık</SelectItem>
              <SelectItem value="resolved">Çözülen</SelectItem>
              <SelectItem value="all">Hepsi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-cyan" /> : (
          <div className="space-y-2">
            {(data ?? []).map((row: any) => (
              <div key={row.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={row.level === "warn" ? "warn" : "bad"}>{row.level}</Pill>
                    <Pill>{row.source}</Pill>
                    {row.count > 1 ? <Pill tone="info">×{row.count}</Pill> : null}
                    {row.path ? <span className="text-xs text-slate-500">{row.path}</span> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">{dateTime(row.last_seen_at ?? row.created_at)}</span>
                    <Button size="sm" variant="ghost" onClick={() => resolveMutation.mutate({ id: row.id, resolved: !row.resolved })}>
                      {row.resolved ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                <button type="button" className="mt-2 block w-full text-left text-sm text-slate-200" onClick={() => setExpanded(expanded === row.id ? null : row.id)}>
                  {row.message}
                </button>
                {expanded === row.id ? (
                  <pre className="mt-2 max-h-64 overflow-auto rounded bg-black/40 p-3 text-[11px] leading-5 text-slate-400">
{row.stack || "Stack yok"}
{row.context ? `\n\ncontext: ${JSON.stringify(row.context, null, 2)}` : ""}
                  </pre>
                ) : null}
              </div>
            ))}
            {(data ?? []).length === 0 ? <div className="py-10 text-center text-sm text-slate-500">Kayıt yok. İyi haber.</div> : null}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
