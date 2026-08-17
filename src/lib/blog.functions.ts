import { createServerFn } from "@tanstack/react-start";

const LIST_COLUMNS = "slug, title, description, category, tags, cover_image_url, read_minutes, published_at, author";

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
