import { useRef, useState } from "react";
import {
  Bold, Code, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Quote, Table as TableIcon,
} from "lucide-react";
import { toast } from "sonner";
import { MiniMarkdown } from "@/components/site/mini-markdown";
import { useImageUploader } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Action = { icon: typeof Bold; label: string; before: string; after?: string; block?: boolean };

const ACTIONS: Action[] = [
  { icon: Heading2, label: "Başlık 2", before: "## ", block: true },
  { icon: Heading3, label: "Başlık 3", before: "### ", block: true },
  { icon: Bold, label: "Kalın", before: "**", after: "**" },
  { icon: Italic, label: "İtalik", before: "*", after: "*" },
  { icon: List, label: "Madde listesi", before: "- ", block: true },
  { icon: ListOrdered, label: "Numaralı liste", before: "1. ", block: true },
  { icon: Quote, label: "Alıntı", before: "> ", block: true },
  { icon: Link2, label: "Bağlantı", before: "[", after: "](https://)" },
  { icon: Code, label: "Kod", before: "`", after: "`" },
];

const TABLE_SNIPPET = "\n| Başlık | Başlık |\n|---|---|\n| Hücre | Hücre |\n";

export function MarkdownEditor({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"yaz" | "onizleme">("yaz");
  const { uploading, run } = useImageUploader();

  const insert = (before: string, after = "", block = false) => {
    const area = areaRef.current;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = value.slice(start, end);
    const prefix = block && start > 0 && value[start - 1] !== "\n" ? "\n" : "";
    const next = `${value.slice(0, start)}${prefix}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      area.focus();
      const caret = start + prefix.length + before.length + selected.length;
      area.setSelectionRange(caret, caret);
    });
  };

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    const url = await run(file);
    if (!url) return;
    insert(`![${file.name.replace(/\.[^.]+$/, "")}](${url})`, "", true);
    toast.success("Görsel içeriğe eklendi");
  };

  return (
    <div className="rounded-lg border border-slate-200">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            title={action.label}
            aria-label={action.label}
            onClick={() => insert(action.before, action.after ?? "", action.block ?? false)}
            className="rounded p-1.5 text-slate-600 hover:bg-white hover:text-slate-900"
          >
            <action.icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          title="Tablo"
          aria-label="Tablo ekle"
          onClick={() => insert(TABLE_SNIPPET, "", true)}
          className="rounded p-1.5 text-slate-600 hover:bg-white hover:text-slate-900"
        >
          <TableIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Görsel yükle"
          aria-label="Görsel yükle"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="rounded p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </button>
        <div className="ml-auto flex gap-1">
          {(["yaz", "onizleme"] as const).map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={tab === item ? "default" : "ghost"}
              onClick={() => setTab(item)}
            >
              {item === "yaz" ? "Yaz" : "Önizleme"}
            </Button>
          ))}
        </div>
      </div>

      {tab === "yaz" ? (
        <Textarea
          ref={areaRef}
          rows={20}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onDrop={(e) => {
            const file = e.dataTransfer.files?.[0];
            if (file?.type.startsWith("image/")) { e.preventDefault(); void handleImage(file); }
          }}
          className="min-h-[420px] rounded-none border-0 font-mono text-xs focus-visible:ring-0"
          placeholder="## Başlık&#10;&#10;Metninizi yazın. Araç çubuğundan başlık, liste, tablo, bağlantı ve görsel ekleyebilirsiniz."
        />
      ) : (
        <div className="max-h-[520px] overflow-y-auto bg-white px-5 py-3">
          {value.trim() ? <MiniMarkdown content={value} /> : <p className="py-10 text-center text-sm text-slate-400">Önizlenecek içerik yok.</p>}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => { void handleImage(e.target.files?.[0]); e.target.value = ""; }}
      />
    </div>
  );
}