import { createServerFn } from "@tanstack/react-start";

/** Tarayici tarafi hatalarini kalici loga yazar. Kimlik dogrulamasi gerektirmez,
 *  bu yuzden alanlar kirpilir ve sadece hata metni saklanir. */
export const reportClientError = createServerFn({ method: "POST" })
  .inputValidator((input: { message: string; stack?: string; path?: string; level?: "error" | "warn" }) => input)
  .handler(async ({ data }) => {
    const { recordError } = await import("./observability.server");
    recordError({
      level: data.level ?? "error",
      source: "client",
      message: data.message.slice(0, 500),
      stack: data.stack?.slice(0, 4000) ?? null,
      path: data.path?.slice(0, 300) ?? null,
    });
    return { ok: true };
  });
