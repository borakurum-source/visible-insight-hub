import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Eye } from "lucide-react";
import { adminDeletePost, adminGetPost, adminListPosts, adminSavePost } from "@/lib/admin.functions";
import { AdminCard, AdminHeading, dateTime, EmptyRow, Pill, Table } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/blog")({
  head: () => ({ meta: [{ title: "Blog — OneCite Yönetim" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: BlogAdminPage,
});

type FormState = {
  id?: string;
  slug: string; title: string; description: string; category: string; tags: string;
  body: string; answerSummary: string; faq: string; sources: string;
  coverImageUrl: string; ogImageUrl: string; canonicalUrl: string; author: string;
  status: "draft" | "published";
};

const EMPTY: FormState = {
  slug: "", title: "", description: "", category: "Yapay zeka arama rehberleri", tags: "",
  body: "", answerSummary: "", faq: "", sources: "",
  coverImageUrl: "", ogImageUrl: "", canonicalUrl: "", author: "OneCite", status: "draft",
};

// "Soru | Cevap" satirlarini yapiya cevirir.
const parseFaq = (value: string) =>
  value.split("\n").map((line) => line.split("|")).filter((parts) => parts.length >= 2)
    .map((parts) => ({ question: parts[0]!.trim(), answer: parts.slice(1).join("|").trim() }));
const parseSources = (value: string) =>
  value.split("\n").map((line) => line.split("|")).filter((parts) => parts.length >= 2)
    .map((parts) => ({ label: parts[0]!.trim(), url: parts.slice(1).join("|").trim() }));

function BlogAdminPage() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListPosts);
  const load = useServerFn(adminGetPost);
  const save = useServerFn(adminSavePost);
  const remove = useServerFn(adminDeletePost);
  const [form, setForm] = useState<FormState | null>(null);

  const posts = useQuery({ queryKey: ["admin", "posts"], queryFn: () => list() });
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });

  const openMutation = useMutation({
    mutationFn: (id: string) => load({ data: { id } }),
    onSuccess: (row: any) => {
      if (!row) return;
      setForm({
        id: row.id, slug: row.slug, title: row.title, description: row.description ?? "",
        category: row.category ?? "", tags: (row.tags ?? []).join(", "),
        body: row.body ?? "", answerSummary: row.answer_summary ?? "",
        faq: (row.faq ?? []).map((f: any) => `${f.question} | ${f.answer}`).join("\n"),
        sources: (row.sources ?? []).map((s: any) => `${s.label} | ${s.url}`).join("\n"),
        coverImageUrl: row.cover_image_url ?? "", ogImageUrl: row.og_image_url ?? "",
        canonicalUrl: row.canonical_url ?? "", author: row.author ?? "OneCite",
        status: row.status === "published" ? "published" : "draft",
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveMutation = useMutation({
    mutationFn: (status: "draft" | "published") => {
      const f = form!;
      return save({
        data: {
          ...(f.id ? { id: f.id } : {}),
          slug: f.slug, title: f.title, description: f.description, category: f.category,
          tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
          body: f.body, answerSummary: f.answerSummary,
          faq: parseFaq(f.faq), sources: parseSources(f.sources),
          coverImageUrl: f.coverImageUrl, ogImageUrl: f.ogImageUrl, canonicalUrl: f.canonicalUrl,
          author: f.author, status,
        },
      });
    },
    onSuccess: () => { toast.success("Yazı kaydedildi"); setForm(null); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Yazı silindi"); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const set = (patch: Partial<FormState>) => setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  return (
    <div className="space-y-5">
      <AdminHeading
        title="Blog"
        description="SEO ve GEO uyumlu makale yönetimi: özet cevap, SSS, kaynaklar, görsel ve video gömme."
        action={<Button size="sm" onClick={() => setForm({ ...EMPTY })}><Plus className="mr-1.5 h-4 w-4" /> Yeni yazı</Button>}
      />

      {form ? (
        <AdminCard title={form.id ? "Yazıyı düzenle" : "Yeni yazı"}>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label className="text-xs">Başlık (H1, 60 karaktere kadar)</Label>
                <Input value={form.title} onChange={(e) => set({ title: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9ğüşiöç]+/gi, "-") })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">URL (slug)</Label>
                <Input value={form.slug} onChange={(e) => set({ slug: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Meta açıklama (160 karaktere kadar)</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs">GEO cevap özeti (yapay zekanın alıntılayacağı 2-3 cümle)</Label>
              <Textarea rows={3} value={form.answerSummary} onChange={(e) => set({ answerSummary: e.target.value })} /></div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5"><Label className="text-xs">Kategori</Label><Input value={form.category} onChange={(e) => set({ category: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Etiketler (virgülle)</Label><Input value={form.tags} onChange={(e) => set({ tags: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Yazar</Label><Input value={form.author} onChange={(e) => set({ author: e.target.value })} /></div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5"><Label className="text-xs">Kapak görseli URL</Label><Input value={form.coverImageUrl} onChange={(e) => set({ coverImageUrl: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Sosyal önizleme (OG) görseli</Label><Input value={form.ogImageUrl} onChange={(e) => set({ ogImageUrl: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Canonical URL (opsiyonel)</Label><Input value={form.canonicalUrl} onChange={(e) => set({ canonicalUrl: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">İçerik (Markdown)</Label>
              <Textarea rows={18} className="font-mono text-xs" value={form.body} onChange={(e) => set({ body: e.target.value })} />
              <p className="text-[11px] text-slate-500">
                Görsel: ![açıklama](https://...) · Video: satır başında https://www.youtube.com/watch?v=... bağlantısını yazın, gömülü oynatıcı olarak gösterilir.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label className="text-xs">SSS (her satır: Soru | Cevap)</Label>
                <Textarea rows={5} value={form.faq} onChange={(e) => set({ faq: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Kaynaklar (her satır: Başlık | URL)</Label>
                <Textarea rows={5} value={form.sources} onChange={(e) => set({ sources: e.target.value })} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={saveMutation.isPending || !form.title || !form.slug} onClick={() => saveMutation.mutate("published")}>
                {saveMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />} Yayınla
              </Button>
              <Button size="sm" variant="outline" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate("draft")}>Taslak kaydet</Button>
              <Button size="sm" variant="ghost" onClick={() => setForm(null)}>Vazgeç</Button>
            </div>
          </div>
        </AdminCard>
      ) : null}

      <AdminCard title="Yazılar">
        {posts.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-sky-600" /> : (
          <Table head={["Başlık", "Durum", "Kategori", "Güncelleme", ""]}>
            {(posts.data ?? []).map((post) => (
              <tr key={post.id}>
                <td className="px-3 py-2">
                  <div className="text-slate-900">{post.title}</div>
                  <div className="text-xs text-slate-500">/makaleler/{post.slug}</div>
                </td>
                <td className="px-3 py-2"><Pill tone={post.status === "published" ? "good" : "warn"}>{post.status === "published" ? "Yayında" : "Taslak"}</Pill></td>
                <td className="px-3 py-2 text-xs text-slate-500">{post.category}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{dateTime(post.updated_at)}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    {post.status === "published" ? (
                      <Button size="sm" variant="ghost" asChild><a href={`/makaleler/${post.slug}`} target="_blank" rel="noreferrer"><Eye className="h-3.5 w-3.5" /></a></Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => openMutation.mutate(post.id)}>Düzenle</Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(post.id)}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {(posts.data ?? []).length === 0 ? <EmptyRow colSpan={5}>Henüz yazı yok.</EmptyRow> : null}
          </Table>
        )}
      </AdminCard>
    </div>
  );
}
