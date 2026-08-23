// Prompt Discovery tarayıcı çalışması hook'u.
// use-evidence-bridge.ts modelini izler: start → chunk loop → finish + ilerleme + toast.

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { runDiscovery, measureOpportunityChunk, finishDiscoveryRun } from "./prompt-discovery.functions";

export type DiscoveryProgress = {
  phase: "idle" | "discovery" | "measuring" | "finished";
  batchId: string | null;
  totalOpportunities: number;
  measuredCount: number;
  percentComplete: number;
  error: string | null;
};

const MEASURE_LIMIT = 3; // Chunk boyutu (bir çalıştırmada ölçülecek aday sayısı)
const MAX_MEASURE_ATTEMPTS = 12; // 504/546/timeout durumunda retry

export function usePromptDiscovery(brandId: string) {
  const queryClient = useQueryClient();
  const discover = useServerFn(runDiscovery);
  const measureChunk = useServerFn(measureOpportunityChunk);
  const finishRun = useServerFn(finishDiscoveryRun);

  const [progress, setProgress] = useState<DiscoveryProgress>({
    phase: "idle",
    batchId: null,
    totalOpportunities: 0,
    measuredCount: 0,
    percentComplete: 0,
    error: null,
  });

  const startDiscovery = useCallback(async () => {
    try {
      setProgress({
        phase: "discovery",
        batchId: null,
        totalOpportunities: 0,
        measuredCount: 0,
        percentComplete: 0,
        error: null,
      });

      // 1. Aday üret + skorla
      const result = await discover({ data: { brandId } });
      toast.success(`${result.candidateCount} aday keşfedildi`, { id: "discovery-start" });

      // 2. Ölçüme geç
      setProgress((p) => ({
        ...p,
        phase: "measuring",
        batchId: result.batchId,
        totalOpportunities: result.candidateCount,
      }));

      // 3. Chunk döngüsü
      let measuredTotal = 0;
      for (let attempt = 0; attempt < MAX_MEASURE_ATTEMPTS; attempt++) {
        try {
          const chunk = await measureChunk({
            data: { brandId, batchId: result.batchId, limit: MEASURE_LIMIT },
          });

          measuredTotal += chunk.measured;
          const pct =
            result.candidateCount > 0
              ? Math.round((measuredTotal / result.candidateCount) * 100)
              : 100;

          setProgress((p) => ({
            ...p,
            measuredCount: measuredTotal,
            percentComplete: pct,
          }));

          if (chunk.total === 0 || measuredTotal >= result.candidateCount) {
            // Tamamlandı
            break;
          }

          // Retry gerekiyorsa, biraz bekle
          if (attempt < MAX_MEASURE_ATTEMPTS - 1) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        } catch (err) {
          const msg = String(err);
          if (msg.includes("504") || msg.includes("546") || msg.includes("timeout")) {
            // Geçici hata, retry
            console.log(`Attempt ${attempt + 1}/${MAX_MEASURE_ATTEMPTS} failed, retrying...`);
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          throw err;
        }
      }

      // 4. Sonlandır (durum makinesi çalıştır)
      await finishRun({ data: { brandId, batchId: result.batchId } });

      setProgress((p) => ({
        ...p,
        phase: "finished",
        percentComplete: 100,
      }));

      toast.success("Fırsat Defteri güncellendi", { id: "discovery-finish" });

      // Defteri yenile
      void queryClient.invalidateQueries({ queryKey: ["prompt-opportunities", brandId] });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setProgress((p) => ({
        ...p,
        phase: "idle",
        error: errorMsg,
      }));
      toast.error(`Keşif başarısız: ${errorMsg}`, { id: "discovery-error" });
    }
  }, [brandId, discover, measureChunk, finishRun, queryClient]);

  const reset = useCallback(() => {
    setProgress({
      phase: "idle",
      batchId: null,
      totalOpportunities: 0,
      measuredCount: 0,
      percentComplete: 0,
      error: null,
    });
  }, []);

  return { progress, startDiscovery, reset };
}
