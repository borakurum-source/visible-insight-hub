-- 1) blog_posts: anon can only read non-internal columns (excludes created_by)
REVOKE SELECT ON public.blog_posts FROM anon;
GRANT SELECT (id, slug, title, description, category, tags, cover_image_url, og_image_url, canonical_url, body, answer_summary, faq, sources, read_minutes, status, author, published_at, created_at, updated_at) ON public.blog_posts TO anon;

-- 2) public_reports: no client access at all; only trusted server code
REVOKE ALL ON public.public_reports FROM anon, authenticated;
GRANT ALL ON public.public_reports TO service_role;

-- 3) reports: drop unused public-sharing flag so no future policy can leak on it
ALTER TABLE public.reports DROP COLUMN IF EXISTS is_public;
REVOKE ALL ON public.reports FROM anon;

-- 4) storage.objects: explicit admin-only policies for the private blog-media bucket
DROP POLICY IF EXISTS "Admins manage blog media" ON storage.objects;
CREATE POLICY "Admins manage blog media"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'blog-media' AND public.has_role(auth.uid(), 'admin'));