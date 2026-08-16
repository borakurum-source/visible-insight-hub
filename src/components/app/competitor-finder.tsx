import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Search, Swords, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Hint } from "@/components/app/hint";
import { getCompetitors, saveCompetitors, searchCompetitors } from "@/lib/panel.functions";

// Rakibini bilmeyen kullanıcı için: sektörden gerçek rakip adayları bulan arama kartı.
export function CompetitorFinder({ brandId }: { brandId: string }) {
  const queryClient = useQueryClient();
  const fetchSaved = useServerFn(getCompetitors);
  const runSearch = useServerFn(searchCompetitors);
  const persist = useServerFn(saveCompetitors);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ name: string; domain: string; reason: string }>>([]);

  const saved = useQuery({
    queryKey: ["competitors", brandId],
    queryFn: () => fetchSaved({ data: { brandId } }),
  });

  const search = useMutation({
    mutationFn: () => runSearch({ data: { brandId, query } }),
    onSuccess: (rows) => {
      setResults(rows);
      if (!rows.length) toast.info("Yeni rakip adayı bulunamadı. Aramayı biraz daraltın.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const save = useMutation({
    mutationFn: (list: string[]) => persist({ data: { brandId, competitors: list } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["competitors", brandId] });
      toast.success("Rakip listesi güncellendi.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const list = saved.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Swords className="h-4 w-4 text-primary" aria-hidden="true" />
          Rakip keşfi
          <Hint title="Rakip keşfi">
            <p>Rakiplerinizi bilmiyorsanız buradan arayın: sektörünüzü yazın, gerçek firmaları listeleyelim.</p>
            <p>Eklediğiniz rakipler, yapay zeka yanıtlarında <strong>sizin yerinize kimin çıktığını</strong> ölçmek için kullanılır.</p>
          </Hint>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") search.mutate(); }}
            placeholder="Örn. Türkiye'de abs kör kalıp üreticileri"
            aria-label="Rakip ara"
          />
          <Button onClick={() => search.mutate()} disabled={search.isPending}>
            {search.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-1.5 hidden sm:inline">Ara</span>
          </Button>
        </div>

        {results.length ? (
          <ul className="space-y-1.5">
            {results.map((row) => (
              <li key={row.domain + row.name} className="flex items-start gap-2 rounded-md border border-border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{row.name} <span className="font-mono text-[10px] text-muted-foreground">{row.domain}</span></p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{row.reason}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={save.isPending || list.includes(row.name)}
                  onClick={() => save.mutate([...list, row.name])}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Ekle
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Takip edilen rakipler</p>
          {list.length ? (
            <div className="flex flex-wrap gap-1.5">
              {list.map((name) => (
                <Badge key={name} variant="secondary" className="gap-1 pr-1">
                  {name}
                  <button
                    type="button"
                    aria-label={`${name} rakibini kaldır`}
                    className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                    onClick={() => save.mutate(list.filter((item) => item !== name))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Henüz rakip eklenmedi. Yukarıdan arayıp ekleyebilirsiniz.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
