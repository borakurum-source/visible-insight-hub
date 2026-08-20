CREATE TABLE onecite.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Rehber',
  tags text[] NOT NULL DEFAULT '{}',
  cover_image_url text,
  og_image_url text,
  canonical_url text,
  body text NOT NULL DEFAULT '',
  answer_summary text NOT NULL DEFAULT '',
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  read_minutes integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'draft',
  author text NOT NULL DEFAULT 'OneCite',
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON onecite.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON onecite.blog_posts TO authenticated;
GRANT ALL ON onecite.blog_posts TO service_role;

ALTER TABLE onecite.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published posts"
  ON onecite.blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can read all posts"
  ON onecite.blog_posts FOR SELECT TO authenticated
  USING (onecite.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert posts"
  ON onecite.blog_posts FOR INSERT TO authenticated
  WITH CHECK (onecite.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts"
  ON onecite.blog_posts FOR UPDATE TO authenticated
  USING (onecite.has_role(auth.uid(), 'admin'))
  WITH CHECK (onecite.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posts"
  ON onecite.blog_posts FOR DELETE TO authenticated
  USING (onecite.has_role(auth.uid(), 'admin'));

CREATE INDEX blog_posts_status_published_idx ON onecite.blog_posts (status, published_at DESC);

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON onecite.blog_posts
  FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();