import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LIST_COLUMNS =
  "slug, title, description, category, tags, cover_image_url, read_minutes, published_at, created_at, status, author";

export const listBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { publicSupabase } = await import("./blog.public.server");
  const { data } = await publicSupabase()
    .from("blog_posts")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(100);
  return data ?? [];
});

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const { publicSupabase } = await import("./blog.public.server");
    const { data: row } = await publicSupabase()
      .from("blog_posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    return row;
  });

/** Sitemap icin yayindaki yazilarin slug ve guncelleme tarihi. */
export const listBlogSitemapEntries = createServerFn({ method: "GET" }).handler(async () => {
  const { publicSupabase } = await import("./blog.public.server");
  const { data } = await publicSupabase()
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(500);
  return data ?? [];
});

/** Yonetici onizlemesi: taslaklar dahil tum yazilar. */
export const adminListAllBlogPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const { data } = await supabaseAdmin
      .from("blog_posts")
      .select(LIST_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

/** Yonetici onizlemesi: taslak yazinin detayi. */
export const adminGetBlogPost = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./admin.server");
    const { supabaseAdmin } = await assertAdmin(context);
    const { data: row } = await supabaseAdmin.from("blog_posts").select("*").eq("slug", data.slug).maybeSingle();
    return row;
  });
