import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity, AlertTriangle, BarChart3, Braces, CreditCard, LayoutDashboard,
  LogOut, Mail, ShieldCheck, Users, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminWhoAmI } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "OneCite Yönetim" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Genel bakış", icon: LayoutDashboard, exact: true },
  { to: "/admin/customers", label: "Müşteriler", icon: Users },
  { to: "/admin/subscriptions", label: "Abonelikler", icon: CreditCard },
  { to: "/admin/api", label: "API & maliyet", icon: BarChart3 },
  { to: "/admin/errors", label: "Hata logları", icon: AlertTriangle },
  { to: "/admin/emails", label: "E-posta", icon: Mail },
  { to: "/admin/prompts", label: "Sistem talimatları", icon: Braces },
  { to: "/admin/settings", label: "Yetki & denetim", icon: ShieldCheck },
];

function AdminLayout() {
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(Boolean(data.session));
      setSessionReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setHasSession(Boolean(session));
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const whoAmI = useServerFn(adminWhoAmI);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "whoami", hasSession],
    queryFn: () => whoAmI(),
    enabled: sessionReady && hasSession,
    retry: false,
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin", replace: true });
  }

  if (!sessionReady || (hasSession && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070C15] text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!hasSession) return <AdminLogin />;
  if (!data?.isAdmin) return <AdminDenied email={data?.email ?? null} onSignOut={signOut} />;

  return (
    <div className="flex min-h-screen bg-[#070C15] text-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-[#0B1220] p-4 md:flex">
        <div className="mb-6 px-2">
          <div className="text-sm font-bold tracking-tight text-white">OneCite</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-cyan">Yönetim</div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  active ? "bg-cyan/15 text-cyan" : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          <div className="truncate px-2 text-xs text-slate-400">{data.email}</div>
          <Link to="/app" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white">
            <Activity className="h-3.5 w-3.5" /> Müşteri paneline dön
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-400 hover:text-white" onClick={signOut}>
            <LogOut className="mr-2 h-3.5 w-3.5" /> Çıkış
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#0B1220] px-3 py-2 md:hidden">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className="whitespace-nowrap rounded-md px-2 py-1 text-xs text-slate-300">
              {item.label}
            </Link>
          ))}
        </div>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) toast.error("Giriş başarısız: " + error.message);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070C15] px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#0B1220] p-6 text-slate-100">
        <div>
          <div className="text-lg font-bold text-white">OneCite Yönetim</div>
          <p className="mt-1 text-sm text-slate-400">Bu alan yalnızca yönetici hesapları içindir.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-email">E-posta</Label>
          <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Parola</Label>
          <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Giriş yap
        </Button>
        <p className="text-center text-xs text-slate-500">
          Parolanız yoksa <Link to="/auth" className="text-cyan underline">müşteri girişinden</Link> oturum açıp bu sayfaya dönün.
        </p>
      </form>
    </div>
  );
}

function AdminDenied({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070C15] px-4 text-center">
      <div className="max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#0B1220] p-6 text-slate-200">
        <ShieldCheck className="mx-auto h-8 w-8 text-red-400" />
        <div className="text-lg font-semibold text-white">Yetkiniz yok</div>
        <p className="text-sm text-slate-400">{email ?? "Bu hesap"} yönetici değil. Farklı bir hesapla giriş yapın.</p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onSignOut}>Çıkış yap</Button>
          <Button asChild className="flex-1"><Link to="/app">Panele dön</Link></Button>
        </div>
      </div>
    </div>
  );
}
