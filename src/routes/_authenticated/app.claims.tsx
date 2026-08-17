import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Database, Loader2, PenLine, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, KNOWLEDGE_SUBNAV } from "@/components/app/panel-subnav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClaim, deleteClaim, getClaimsInsight } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/claims")({
  head: () => ({
    meta: [
      { title: "Marka İddiaları — OneCite Paneli" },
      { name: "description", content: "Yapay zekanın markanız hakkında tekrarlamasını istediğiniz kanıtlı ifadeler." },
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
  const fetchClaims = useServerFn(getClaimsInsight);
  const addClaim = useServerFn(createClaim);
  const removeClaim = useServerFn(deleteClaim);
  const [statement, setStatement] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const key = ["claims", brand?.id];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchClaims({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });
  const claims = data?.claims ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ["brand-overview", brand?.id] });
    void queryClient.invalidateQueries({ queryKey: ["knowledge-sources", brand?.id] });
  };

  const createMutation = useMutation({
    mutationFn: () => addClaim({ data: { brandId: brand!.id, statement: statement.trim(), ...(evidenceUrl.trim() ? { evidenceUrl: evidenceUrl.trim() } : {}) } }),
    onSuccess: () => {
      setStatement("");
      setEvidenceUrl("");
      invalidate();
      toast.success("İddia eklendi", {
        description: "Bilgi bankasına indekslendi; içerik üretimi ve ölçümde bu cümle kullanılacak.",
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeClaim({ data: { id, brandId: brand!.id } }),
    onSuccess: () => { invalidate(); toast.success("İddia silindi"); },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!brand) {
    return (
      <>
        <PanelSubnav items={KNOWLEDGE_SUBNAV} />
        <PanelPageHeading meta={{ title: "Marka İddiaları", description: "Önce bir marka ekleyin.", icon: ShieldCheck }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PanelSubnav items={KNOWLEDGE_SUBNAV} />
      <PanelPageHeading
        hint={
          <>
            <p>İddia, yapay zekanın markanız hakkında tekrar etmesini istediğiniz tek cümlelik, kanıtlanabilir bir bilgidir.</p>
            <p>Her iddiaya bir kaynak bağlantısı ekleyin; kanıtsız iddialar alıntılanmaz.</p>
          </>
        }
        meta={{
          title: "Marka İddiaları",
          description: "Eklediğiniz her cümle bilgi bankasına indekslenir, içerik taslaklarında kullanılır ve ölçümde takip edilir.",
          icon: ShieldCheck,
        }}
      />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
          {[
            { icon: Database, title: "1 · Bilgi bankasına yazılır", text: "İddia eklediğiniz an “Marka İddiaları” kaynağı olarak indekslenir (vektöre çevrilir)." },
            { icon: PenLine, title: "2 · İçerikte kullanılır", text: "İçerik üretiminde taslaklar bu cümleleri ve kanıt bağlantılarını birebir tekrar eder." },
            { icon: Search, title: "3 · Ölçümde takip edilir", text: "Ölçüm sonrası yapay zeka yanıtlarında iddianızın tekrar edilip edilmediğini burada görürsünüz." },
          ].map((step) => (
            <div key={step.title} className="flex gap-3">
              <step.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.text}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Textarea value={statement} onChange={(event) => setStatement(event.target.value)} rows={2} placeholder="Örn. OneCite, Türkçe yapay zeka cevaplarında marka alıntılarını takip eder." />
          <div className="flex flex-wrap gap-2">
            <Input value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="Kanıt bağlantısı (opsiyonel)" className="max-w-md" />
            <Button onClick={() => createMutation.mutate()} disabled={!statement.trim() || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />} Ekle
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Kanıt bağlantısı, iddianın doğrulandığı sayfadır (ürün sayfası, referans, sertifika, basın haberi). Kanıtlı iddialar skorunuzun “Kanıt gücü” kırılımını yükseltir.
          </p>
        </CardContent>
      </Card>

      {data ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-xs text-muted-foreground">
            <span>
              Bilgi bankası durumu:{" "}
              <span className="font-medium text-foreground">
                {data.indexStatus === "hazir" ? `indekslendi · ${data.indexedChunks} parça` : data.indexStatus ?? "henüz indekslenmedi"}
              </span>
            </span>
            <span>
              Taranan yapay zeka yanıtı: <span className="font-medium text-foreground">{data.measuredAnswers}</span>
            </span>
            <Button asChild size="sm" variant="ghost" className="ml-auto h-7">
              <Link to="/app/measurement">Ölçümü çalıştır <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…</p>
          ) : claims.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Henüz iddia eklenmedi. 5-8 kanıtlı iddia ile başlamanız önerilir.</p>
          ) : (
            <ul className="divide-y divide-border">
              {claims.map((claim) => (
                <li key={claim.id} className="flex flex-wrap items-start gap-3 p-3 text-sm">
                  <span className="min-w-0 flex-1 space-y-1.5">
                    <span className="block">{claim.statement}</span>
                    {claim.evidence_url ? (
                      <a href={claim.evidence_url} target="_blank" rel="noreferrer" className="block truncate font-mono text-xs text-muted-foreground hover:text-primary">{claim.evidence_url}</a>
                    ) : null}
                    <span className="flex flex-wrap items-center gap-1.5">
                      {claim.evidence_url ? (
                        <Badge variant="secondary" className="gap-1 text-[11px]">
                          <CheckCircle2 className="h-3 w-3" /> Kanıtlı
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] text-amber-500">Kanıt bağlantısı ekleyin</Badge>
                      )}
                      <Badge variant={claim.echoes > 0 ? "default" : "outline"} className="text-[11px]">
                        {claim.echoes > 0 ? `${claim.echoes} yanıtta tekrar edildi` : "AI yanıtlarında henüz görülmedi"}
                      </Badge>
                      {claim.evidenceCited ? (
                        <Badge variant="secondary" className="text-[11px]">Kanıt bağlantısı atıf aldı</Badge>
                      ) : null}
                    </span>
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

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4 text-sm">
          <span className="text-muted-foreground">İddialarınız hazır. Sıradaki adım: bu cümleleri sitenizde yayınlanacak içeriğe dönüştürün.</span>
          <Button asChild size="sm" variant="outline" className="ml-auto">
            <Link to="/app/content">İçerik üret <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
