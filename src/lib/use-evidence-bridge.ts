import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { startEvidenceBridge, runEvidenceBridgeChunk, finishEvidenceBridge } from "@/lib/panel.functions";

export type EvidenceBridgeProgress = { done: number; total: number };

export function useEvidenceBridge(brandId: string | undefined) {
  const queryClient = useQueryClient();
  const start = useServerFn(startEvidenceBridge);
  const runChunk = useServerFn(runEvidenceBridgeChunk);
  const finish = useServerFn(finishEvidenceBridge);
  const [progress, setProgress] = useState<EvidenceBridgeProgress | null>(null);

  const run = useCallback(
    async (promptId: string, competitorDomain: string) => {
      if (!brandId || progress !== null) return;

      setProgress({ done: 0, total: 1 });
      try {
        const { batch, runId } = await start({ data: { brandId, promptId, competitorDomain } });
        if (!runId) throw new Error("Evidence bridge run could not be created");

        setProgress({ done: 0, total: 1 });
        await runChunk({ data: { batchId: batch.id, brandId, runId, competitorDomain } });
        setProgress({ done: 1, total: 1 });

        await finish({ data: { batchId: batch.id, brandId } });
        toast.success("Kanıt analizi tamamlandı.");
        await queryClient.invalidateQueries({ queryKey: ["evidence-bridge", brandId] });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Kanıt analizi başarısız oldu.");
      } finally {
        setProgress(null);
      }
    },
    [brandId, progress, start, runChunk, finish, queryClient],
  );

  return { run, progress, running: progress !== null };
}
