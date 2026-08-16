import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav } from "@/components/app/panel-subnav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClaim, deleteClaim, listClaims } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/claims")({
  head: () => ({
    meta: [
      { title: "Marka İddiaları — OneCite Paneli" },
      { name: "description", content: "Yapay zekânın markanız hakkında tekrarlamasını istediğiniz kanıtlı ifadeler." },
      { property: "og:title", content: "Marka İddiaları — OneCite Paneli" },
      { property: "og:description", content: "Kanıtlı marka ifadelerinizi yönetin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClaimsPage,
});

function ClaimsPage() {
  const { brand } = useActiveBrand();
  const queryClient = useQueryClient();
  const fetchClaims = useServerFn(listClaims);
  const addClaim = useServerFn(createClaim);
  const removeClaim = useServerFn(deleteClaim);
  const [statement, setStatement] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const key = ["claims", brand?.id];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchClaims({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ["brand-overview", brand?.id] });
  };

  const createMutation = useMutation({
    mutationFn: () => addClaim({ data: { brandId: brand!.id, statement: statement.trim(), ...(evidenceUrl.trim() ? { evidenceUrl: evidenceUrl.trim() } : {}) } }),
    onSuccess: () => { setStatement(""); setEvidenceUrl(""); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeClaim({ data: { id } }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  if (!brand) {
    return (
      <>
        <PanelSubnav items={[{ to: "/app/knowledge-base", label: "Bilgi Bankası" }, { to: "/app/claims", label: "Marka İddiaları" }, { to: "/app/graph", label: "Bilgi Grafiği" }]} />
        <PanelPageHeading meta={{ title: "Marka İddiaları", description: "Önce bir marka ekleyin.", icon: ShieldCheck }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PanelSubnav items={[{ to: "/app/knowledge-base", label: "Bilgi Bankası" }, { to: "/app/claims", label: "Marka İddiaları" }, { to: "/app/graph", label: "Bilgi Grafiği" }]} />
      <PanelPageHeading
        meta={{
          title: "Marka İddiaları",
          description: "Yapay zekânın markanız hakkında tekrarlamasını istediğiniz, kaynağa dayalı kısa ifadeler.",
          icon: ShieldCheck,
        }}
      />

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Textarea value={statement} onChange={(event) => setStatement(event.target.value)} rows={2} placeholder="Örn. OneCite, Türkçe yapay zekâ cevaplarında marka alıntılarını takip eder." />
          <div className="flex flex-wrap gap-2">
            <Input value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="Kanıt bağlantısı (opsiyonel)" className="max-w-md" />
            <Button onClick={() => createMutation.mutate()} disabled={!statement.trim() || createMutation.isPending}>
              <Plus className="mr-1.5 h-4 w-4" /> Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…</p>
          ) : data.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Henüz iddia eklenmedi.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((claim) => (
                <li key={claim.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block">{claim.statement}</span>
                    {claim.evidence_url ? (
                      <a href={claim.evidence_url} target="_blank" rel="noreferrer" className="font-mono text-xs text-muted-foreground hover:text-primary">{claim.evidence_url}</a>
                    ) : null}
                  </span>
                  <Button size="icon" variant="ghost" aria-label="İddiayı sil" onClick={() => deleteMutation.mutate(claim.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
