import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listSystemPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { SYSTEM_PROMPTS } = await import("./system-prompts");
    const [{ data: overrides }, { data: roleRow }] = await Promise.all([
      context.supabase.from("system_prompts").select("key, content, version, updated_at"),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle(),
    ]);
    const map = new Map((overrides ?? []).map((row) => [row.key, row]));
    return {
      isAdmin: Boolean(roleRow),
      items: SYSTEM_PROMPTS.map((def) => {
        const override = map.get(def.key);
        return {
          ...def,
          content: (override?.content ?? "").trim() || def.content,
          defaultContent: def.content,
          customized: Boolean((override?.content ?? "").trim()),
          version: override?.version ?? 1,
          updatedAt: override?.updated_at ?? null,
        };
      }),
    };
  });

export const saveSystemPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string; content: string }) => input)
  .handler(async ({ data, context }) => {
    const { SYSTEM_PROMPT_MAP } = await import("./system-prompts");
    const def = SYSTEM_PROMPT_MAP[data.key];
    if (!def) throw new Error("Bilinmeyen talimat");
    const content = data.content.trim();
    if (content.length < 40) throw new Error("Talimat en az 40 karakter olmalı");

    const { data: existing } = await context.supabase
      .from("system_prompts").select("id, version").eq("key", data.key).maybeSingle();

    const payload = {
      key: def.key,
      title: def.title,
      description: def.description,
      stage: def.stage,
      model: def.model,
      content,
      version: (existing?.version ?? 0) + 1,
      updated_by: context.userId,
    };
    const { error } = await context.supabase.from("system_prompts").upsert(payload, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true, version: payload.version };
  });

export const resetSystemPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("system_prompts").delete().eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
