import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const BLOG_MEDIA_BUCKET = "blog-media";
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

export type UploadBlogImageInput = {
  fileName: string;
  contentType: string;
  /** Base64 (data URL onekli olabilir) gorsel icerigi. */
  data: string;
};

/** Yonetici gorsel yukler; dosya turu ve boyutu sunucu tarafinda dogrulanir. */
export const uploadBlogImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UploadBlogImageInput) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);

    if (!ALLOWED.includes(data.contentType)) {
      throw new Error("Yalnızca PNG, JPG, WebP, AVIF veya GIF yükleyebilirsiniz");
    }
    const base64 = data.data.includes(",") ? data.data.slice(data.data.indexOf(",") + 1) : data.data;
    const bytes = Buffer.from(base64, "base64");
    if (bytes.byteLength === 0) throw new Error("Dosya okunamadı");
    if (bytes.byteLength > MAX_BYTES) throw new Error("Görsel en fazla 5 MB olabilir");

    const extension = (data.fileName.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const safeName = data.fileName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "gorsel";
    const path = `${new Date().getFullYear()}/${Date.now()}-${safeName}.${extension}`;

    const { error } = await supabaseAdmin.storage
      .from(BLOG_MEDIA_BUCKET)
      .upload(path, bytes, { contentType: data.contentType, upsert: false, cacheControl: "31536000" });
    if (error) throw new Error(error.message);

    return { path, url: `/api/public/blog-media/${path}` };
  });