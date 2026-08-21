import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { startMeasurement, runMeasurementChunk, finishMeasurement } from "@/lib/panel.functions";

const CHUNK = 3;

export type MeasurementProgress = { done: number; total: number };

export function useMeasurementRun(brandId: string | undefined) {
  const queryClient = useQueryClient();
  const start = useServerFn(startMeasurement);
  const runChunk = useServerFn(runMeasurementChunk);
  const finish = useServerFn(finishMeasurement);
  const [progress, setProgress] = useState<MeasurementProgress | null>(null);

  const run = useCallback(async () => {
    if (!brandId || progress !== null) return;
    setProgress({ done: 0, total: 0 });
    try {
      const { batch, promptIds } = await start({ data: { brandId } });
      if (promptIds.length === 0) {
        await finish({ data: { batchId: batch.id, brandId } });
        toast.success("Ölçüm tamamlandı, skorunuz güncellendi.");
        await queryClient.invalidateQueries({ queryKey: ["measurement-state", brandId] });
        await queryClient.invalidateQueries({ queryKey: ["brand-overview", brandId] });
        return;
      }
      setProgress({ done: 0, total: promptIds.length });
      let totalFailed = 0;
      for (let i = 0; i < promptIds.length; i += CHUNK) {
        const slice = promptIds.slice(i, i + CHUNK);
        const result = await runChunk({ data: { batchId: batch.id, brandId, promptIds: slice } });
        totalFailed += result.failedPromptIds?.length ?? 0;
        setProgress({ done: Math.min(i + CHUNK, promptIds.length), total: promptIds.length });
      }
      await finish({
        data: { batchId: batch.id, brandId, ...(totalFailed > 0 ? { failedCount: totalFailed } : {}) },
      });
      if (totalFailed > 0) {
        const measured = promptIds.length - totalFailed;
        toast.warning(`${totalFailed} soru ölçülemedi, ${measured} soru başarıyla ölçüldü.`);
      } else {
        toast.success("Ölçüm tamamlandı, skorunuz güncellendi.");
      }
      await queryClient.invalidateQueries({ queryKey: ["measurement-state", brandId] });
      await queryClient.invalidateQueries({ queryKey: ["brand-overview", brandId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ölçüm başarısız oldu.");
    } finally {
      setProgress(null);
    }
  }, [brandId, progress, start, runChunk, finish, queryClient]);

  return { run, progress, running: progress !== null };
}
