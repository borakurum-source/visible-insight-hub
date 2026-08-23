import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CheckCircle2,
  Compass,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Trash2,
  X,
  ZapOff,
} from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { OPPORTUNITY_SUBNAV, PanelSubnav } from "@/components/app/panel-subnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listOpportunities, decideOpportunity, createTaskFromOpportunity } from "@/lib/prompt-discovery.functions";
import { usePromptDiscovery } from "@/lib/use-prompt-discovery";
import { useActiveBrand } from "@/lib/use-panel";
import { rowSourceLabel } from "@/lib/prompt-demand/config";
import type { Database } from "@/integrations/supabase/types";

type OpportunityRow = Database["onecite"]["Tables"]["prompt_opportunities"]["Row"];

export const Route = createFileRoute("/_authenticated/app/prompt-discovery")({
  head: () => ({
    meta: [
      { title: "Prompt Keşfi — OneCite Paneli" },
      {
        name: "description",
        content: "Marka adı geçmeyen ama AI asistanlarının markanızı önerebileceği fırsat adaylarını keşfedin.",
      },
      { property: "og:title", content: "Prompt Keşfi — OneCite Paneli" },
      {
        property: "og:description",
        content: "Kalıcı Fırsat Defteri: adaylar DB'ye yazılır, ölçülür, reddedilenler hatırlanır.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PromptDiscoveryPage,
});

function statusIcon(status: string) {
  switch (status) {
    case "actionable":
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "measuring":
      return <Loader2 className="h-4 w-4 animate-spin text-warning" />;
    case "deferred":
      return <ZapOff className="h-4 w-4 text-muted-foreground" />;
    case "tracked":
      return <CheckCircle2 className="h-4 w-4 text-primary" />;
    case "rejected":
      return <X className="h-4 w-4 text-destructive" />;
    default:
      return null;
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: "Yeni",
    measuring: "Ölçülüyor",
    actionable: "Aksiyona hazır",
    deferred: "Veri eksik",
    tracked: "İzleniyor",
    rejected: "Reddedildi",
  };
  return labels[status] || status;
}

function reasonBadge(status: string, reason: string | null) {
  if (status === "deferred" && reason) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        {reason}
      </Badge>
    );
  }
  return null;
}

function PromptDiscoveryPage() {
  const { brand } = useActiveBrand();
  const queryClient = useQueryClient();
  const fetchOpportunities = useServerFn(listOpportunities);
  const decideOpp = useServerFn(decideOpportunity);
  const createTask = useServerFn(createTaskFromOpportunity);

  const [statusFilter, setStatusFilter] = useState("all");

  const opportunities = useQuery({
    queryKey: ["prompt-opportunities", brand?.id],
    queryFn: () =>
      fetchOpportunities({ data: { brandId: brand!.id, status: statusFilter === "all" ? undefined : statusFilter } }),
    enabled: Boolean(brand?.id),
  });

  const { progress, startDiscovery, reset } = usePromptDiscovery(brand?.id ?? "");

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "track" | "reject" }) =>
      decideOpp({ data: { id, decision } }),
    onSuccess: (_data, { decision, id }) => {
      if (decision === "track") {
        toast.success("Promptlara eklendi");
      } else {
        toast.success("Reddedildi ve hatırlanacak");
      }
      void queryClient.invalidateQueries({ queryKey: ["prompt-opportunities", brand?.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const doCreateTask = useMutation({
    mutationFn: (id: string) => createTask({ data: { id } }),
    onSuccess: () => {
      toast.success("Aksiyon oluşturuldu");
      void queryClient.invalidateQueries({ queryKey: ["prompt-opportunities", brand?.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const stats = useMemo(() => {
    const rows = opportunities.data ?? [];
    return {
      actionable: rows.filter((r) => r.status === "actionable").length,
      measuring: rows.filter((r) => r.status === "measuring").length,
      deferred: rows.filter((r) => r.status === "deferred").length,
      tracked: rows.filter((r) => r.status === "tracked").length,
      total: rows.length,
    };
  }, [opportunities.data]);

  const visible = useMemo(() => {
    if (!opportunities.data) return [];
    if (statusFilter === "all") return opportunities.data;
    return opportunities.data.filter((r) => r.status === statusFilter);
  }, [opportunities.data, statusFilter]);

  if (!brand) {
    return (
      <>
        <PanelSubnav items={OPPORTUNITY_SUBNAV} />
        <PanelPageHeading
          meta={{ title: "Prompt Keşfi", description: "Önce bir marka ekleyin.", icon: Compass }}
        />
        <Card>
          <CardContent className="py-10 text-center">
            <Button asChild>
              <Link to="/app/onboarding">Markanı ekle</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PanelSubnav items={OPPORTUNITY_SUBNAV} />
      <PanelPageHeading
        meta={{
          title: "Prompt Keşfi",
          description:
            "Marka adı hiç geçmeyen ama bir AI asistanının markanızı önerebileceği fırsat adaylarını kalıcı defterinde takip edin.",
          icon: Compass,
        }}
        action={
          <Button
            size="sm"
            onClick={() => {
              reset();
              startDiscovery();
            }}
            disabled={progress.phase !== "idle"}
          >
            {progress.phase !== "idle" ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-3.5 w-3.5" />
            )}
            Keşif çalıştır
          </Button>
        }
      />

      {/* İlerleme */}
      {progress.phase !== "idle" && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>
                  {progress.phase === "discovery"
                    ? "Adaylar keşfediliyor…"
                    : progress.phase === "measuring"
                      ? `Ölçülüyor (${progress.measuredCount}/${progress.totalOpportunities})`
                      : "Tamamlandı"}
                </span>
                <span>{progress.percentComplete}%</span>
              </div>
              <Progress value={progress.percentComplete} className="h-2" />
              {progress.error && (
                <p className="text-xs text-destructive">{progress.error}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Aksiyona hazır", value: stats.actionable, variant: "default" as const },
          { label: "Ölçülüyor", value: stats.measuring, variant: "secondary" as const },
          { label: "Veri eksik", value: stats.deferred, variant: "outline" as const },
          { label: "İzleniyor", value: stats.tracked, variant: "outline" as const },
        ].map(({ label, value, variant }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Durum filtresi */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtre:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hepsi ({stats.total})</SelectItem>
            <SelectItem value="actionable">Aksiyona hazır ({stats.actionable})</SelectItem>
            <SelectItem value="measuring">Ölçülüyor ({stats.measuring})</SelectItem>
            <SelectItem value="deferred">Veri eksik ({stats.deferred})</SelectItem>
            <SelectItem value="tracked">İzleniyor ({stats.tracked})</SelectItem>
            <SelectItem value="rejected">Reddedildi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fırsat listesi */}
      {opportunities.isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {stats.total === 0
              ? '"Keşif çalıştır" butonuyla başlayın.'
              : `Bu filtre için fırsat yok.`}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((opp) => (
            <Card key={String(opp.id)}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {/* Başlık + durum rozeti */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-snug">{opp.text}</p>
                      {opp.rationale && (
                        <p className="mt-1 text-xs text-muted-foreground">{opp.rationale}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {statusIcon(opp.status ?? "new")}
                      <Badge variant="secondary" className="text-xs">
                        {statusLabel(opp.status ?? "new")}
                      </Badge>
                    </div>
                  </div>

                  {/* Skorlar + kaynaklar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {opp.expected_value !== null ? (
                      <Badge variant="outline" className="gap-1 text-[10px] text-success border-success/40">
                        <TrendingUp className="h-3 w-3" /> Fırsat {opp.expected_value}
                      </Badge>
                    ) : (
                      reasonBadge(opp.status ?? "new", opp.status_reason)
                    )}

                    {opp.demand_source && (
                      <Badge variant="outline" className="text-[10px]">
                        {rowSourceLabel[opp.demand_source as any] ?? opp.demand_source}
                      </Badge>
                    )}

                    {opp.observed_visibility !== null && (
                      <Badge variant="outline" className="text-[10px]">
                        Görünürlük {Math.round(opp.observed_visibility)}%
                      </Badge>
                    )}

                    {opp.evidence_gap_type && (
                      <Badge variant="outline" className="text-[10px]">
                        {opp.evidence_gap_type}
                      </Badge>
                    )}
                  </div>

                  {/* Aksiyonlar */}
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => decide.mutate({ id: String(opp.id), decision: "reject" })}
                      disabled={decide.isPending}
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" /> Reddet
                    </Button>

                    {(opp.status === "actionable" || opp.status === "tracked") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => doCreateTask.mutate(String(opp.id))}
                        disabled={doCreateTask.isPending || opp.status !== "actionable"}
                        title={opp.status !== "actionable" ? "Yalnızca aksiyona hazır fırsatlar" : ""}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Aksiyon oluştur
                      </Button>
                    )}

                    {opp.status !== "tracked" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => decide.mutate({ id: String(opp.id), decision: "track" })}
                        disabled={decide.isPending}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Promptlara ekle
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
