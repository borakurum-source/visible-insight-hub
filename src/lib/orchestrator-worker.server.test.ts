import { describe, expect, it, vi } from "vitest";
import { runStagePipeline } from "./orchestrator-worker.server";

describe("orchestrator worker fencing", () => {
  it("stops immediately when the lease heartbeat rejects a stale claim token", async () => {
    const execute = vi.fn(async () => undefined);
    const complete = vi.fn(async () => true);
    await expect(
      runStagePipeline(
        { id: "job", runId: "run", claimToken: "stale", stage: "project_definition" },
        {
          heartbeat: async () => false,
          execute,
          advance: async () => true,
          complete,
          fail: async () => true,
        },
      ),
    ).rejects.toThrow("lease lost");
    expect(execute).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });

  it("executes all twelve durable stages in order and completes once", async () => {
    const stages: string[] = [];
    const complete = vi.fn(async () => true);
    await runStagePipeline(
      { id: "job", runId: "run", claimToken: "token", stage: "project_definition" },
      {
        heartbeat: async () => true,
        execute: async (stage) => {
          stages.push(stage);
        },
        advance: async () => true,
        complete,
        fail: async () => true,
      },
    );
    expect(stages).toHaveLength(12);
    expect(stages[0]).toBe("project_definition");
    expect(stages.at(-1)).toBe("monitoring");
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
