import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { listSystemPrompts, resetSystemPrompt, saveSystemPrompt } from "@/lib/system-prompts.functions";
import { AdminCard, AdminHeading, dateTime, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/prompts")({
  head: () => ({ meta: [{ title: "Sistem Talimatları — OneCite Yönetim" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPromptsPage,
});

function AdminPromptsPage() {
  const queryClient = useQueryClient();
  const fetchPrompts = useServerFn(listSystemPrompts);
  const save = useServerFn(saveSystemPrompt);
  const reset = useServerFn(resetSystemPrompt);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({ queryKey: ["admin", "system-prompts"], queryFn: () => fetchPrompts() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "system-prompts"] });

  const saveMutation = useMutation({
    mutationFn: (input: { key: string; content: string }) => save({ data: input }),
    onSuccess: () => { toast.success("Talimat kaydedildi"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const resetMutation = useMutation({
    mutationFn: (key: string) => reset({ data: { key } }),
    onSuccess: () => { toast.success("Varsayılana döndürüldü"); setDrafts({}); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-cyan" />;

  return (
    <div className="space-y-5">
      <AdminHeading title="Sistem talimatları" description="Ölçüm, keşif ve içerik üretimini yöneten yapay zekâ talimatları." />
      {(data?.items ?? []).map((item) => {
        const value = drafts[item.key] ?? item.content;
        return (
          <AdminCard
            key={item.key}
            title={item.title}
            action={
              <div className="flex items-center gap-2">
                <Pill>{item.stage}</Pill>
                <Pill tone="info">{item.model}</Pill>
                {item.customized ? <Pill tone="warn">v{item.version} özel</Pill> : null}
              </div>
            }
          >
            <p className="mb-2 text-xs text-slate-500">{item.description} · Güncelleme: {dateTime(item.updatedAt)}</p>
            <Textarea rows={10} value={value} onChange={(e) => setDrafts((prev) => ({ ...prev, [item.key]: e.target.value }))} className="font-mono text-xs" />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => saveMutation.mutate({ key: item.key, content: value })} disabled={saveMutation.isPending}>
                <Save className="mr-1 h-3.5 w-3.5" /> Kaydet
              </Button>
              {item.customized ? (
                <Button size="sm" variant="outline" onClick={() => resetMutation.mutate(item.key)}>
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
