import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Braces, RotateCcw, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QuerySkeleton } from "@/components/app/panel-query-states";
import { listSystemPrompts, resetSystemPrompt, saveSystemPrompt } from "@/lib/system-prompts.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/system-prompts")({
  head: () => ({
    meta: [
      { title: "Sistem Talimatları — OneCite Paneli" },
      { name: "description", content: "Panelin yapay zekâ davranışını yöneten sistem talimatlarını görüntüleyin ve düzenleyin." },
      { property: "og:title", content: "Sistem Talimatları — OneCite Paneli" },
      { property: "og:description", content: "AI sistem talimatları yönetimi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SystemPromptsPage,
});

const STAGE_LABEL: Record<string, string> = {
  kurulum: "Kurulum",
  kesif: "Keşif",
  olcum: "Ölçüm",
  uretim: "Üretim",
};

function SystemPromptsPage() {
  const { isAdmin } = useActiveBrand();
  const queryClient = useQueryClient();
  const fetchPrompts = useServerFn(listSystemPrompts);
  const save = useServerFn(saveSystemPrompt);
  const reset = useServerFn(resetSystemPrompt);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({ queryKey: ["system-prompts"], queryFn: () => fetchPrompts() });

  const saveMutation = useMutation({
    mutationFn: (vars: { key: string; content: string }) => save({ data: vars }),
    onSuccess: () => {
      toast.success("Talimat kaydedildi.");
      void queryClient.invalidateQueries({ queryKey: ["system-prompts"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resetMutation = useMutation({
    mutationFn: (key: string) => reset({ data: { key } }),
    onSuccess: (_r, key) => {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast.success("Varsayılana döndürüldü.");
      void queryClient.invalidateQueries({ queryKey: ["system-prompts"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PanelPageHeading
        meta={{
          title: "Sistem Talimatları",
          description:
            "Marka analizi, prompt keşfi, ölçüm ve içerik üretiminde yapay zekânın uyduğu kurallar. İşin kalbi burada.",
          icon: Braces,
        }}
      />

      {isLoading ? (
        <QuerySkeleton rows={3} />
      ) : (
        <div className="space-y-4">
          {!isAdmin ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                Talimatları görüntüleyebilirsiniz; düzenleme yalnızca yöneticilere açık.
              </CardContent>
            </Card>
          ) : null}

          {(data?.items ?? []).map((item) => {
            const value = drafts[item.key] ?? item.content;
            const dirty = value !== item.content;
            return (
              <Card key={item.key}>
                <CardHeader className="gap-1 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <Badge variant="secondary">{STAGE_LABEL[item.stage] ?? item.stage}</Badge>
                    <Badge variant="outline" className="font-mono text-[11px]">{item.model}</Badge>
                    {item.customized ? <Badge variant="outline" className="border-primary/40 text-primary">özelleştirildi · v{item.version}</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={value}
                    readOnly={!isAdmin}
                    rows={12}
                    className="font-mono text-xs leading-relaxed"
                    onChange={(event) => setDrafts((prev) => ({ ...prev, [item.key]: event.target.value }))}
                  />
                  {isAdmin ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={!dirty || saveMutation.isPending}
                        onClick={() => saveMutation.mutate({ key: item.key, content: value })}
                      >
                        <Save className="mr-1.5 h-3.5 w-3.5" /> Kaydet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={(!item.customized && !dirty) || resetMutation.isPending}
                        onClick={() => resetMutation.mutate(item.key)}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Varsayılana dön
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
