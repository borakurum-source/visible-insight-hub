import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/site/BrandLogo";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "OneCite'a Giriş Yap | Yapay Zeka Görünürlük Paneli" },
      {
        name: "description",
        content:
          "Google hesabınla OneCite paneline giriş yap; marka kaynak payını ve yapay zeka görünürlüğünü tek yerden izle.",
      },
      { property: "og:title", content: "OneCite'a Giriş Yap" },
      {
        property: "og:description",
        content: "Google ile saniyeler içinde OneCite paneline giriş yap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void navigate({ to: "/app" });
    });
    void supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) void navigate({ to: "/app" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google ile giriş yapılamadı. Lütfen tekrar deneyin.");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/app" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/60 p-8 shadow-sm">
        <BrandLogo variant="horizontal" size="sm" linkTo="/" />
        <h1 className="mt-6 font-display text-2xl font-semibold text-foreground">Panele giriş yap</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Google hesabınla saniyeler içinde OneCite paneline eriş.
        </p>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-8 w-full gap-3"
          onClick={signInWithGoogle}
          disabled={loading}
        >
          <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.7l4-3Z" />
            <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
          </svg>
          {loading ? "Yönlendiriliyor..." : "Google ile devam et"}
        </Button>

        {error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}