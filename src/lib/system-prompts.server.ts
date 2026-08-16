// Sistem talimatlarını veritabanındaki admin sürümüyle birlikte çözer.
import type { SupabaseClient } from "@supabase/supabase-js";
import { SYSTEM_PROMPT_MAP } from "./system-prompts";

type AnyClient = SupabaseClient<any, any, any>;

export async function resolveSystemPrompt(supabase: AnyClient, key: string): Promise<string> {
  const fallback = SYSTEM_PROMPT_MAP[key]?.content ?? "";
  try {
    const { data } = await supabase.from("system_prompts").select("content").eq("key", key).maybeSingle();
    const content = (data?.content ?? "").trim();
    return content || fallback;
  } catch {
    return fallback;
  }
}
