import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Image as ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { uploadBlogImage } from "@/lib/blog-media.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });

export function useImageUploader() {
  const upload = useServerFn(uploadBlogImage);
  const [uploading, setUploading] = useState(false);

  const run = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error("Yalnızca görsel dosyası yükleyebilirsiniz (PNG, JPG, WebP)");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Görsel en fazla 5 MB olabilir");
      return null;
    }
    setUploading(true);
    try {
      const data = await fileToBase64(file);
      const result = await upload({ data: { fileName: file.name, contentType: file.type, data } });
      return result.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Görsel yüklenemedi");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, run };
}

export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, run } = useImageUploader();
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const url = await run(file);
    if (url) {
      onChange(url);
      toast.success("Görsel yüklendi");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        {value ? (
          <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
            <Trash2 className="h-3 w-3" /> Kaldır
          </button>
        ) : null}
      </div>

      {value ? (
        <img src={value} alt={label} className="aspect-[16/9] w-full rounded-lg border border-slate-200 object-cover" />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFile(e.dataTransfer.files?.[0]); }}
          className={`flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-xs transition-colors ${dragging ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-300 bg-slate-50 text-slate-500 hover:border-slate-400"}`}
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-sky-600" /> : <UploadCloud className="h-5 w-5" />}
          <span>{uploading ? "Yükleniyor…" : "Görseli sürükleyin veya seçmek için tıklayın"}</span>
          <span className="text-[11px] text-slate-400">PNG, JPG, WebP · en fazla 5 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ""; }}
      />

      <div className="flex items-center gap-2">
        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <Input
          value={value}
          placeholder="veya görsel adresini yapıştırın"
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs"
        />
        {value ? null : (
          <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
            Dosya seç
          </Button>
        )}
      </div>
      {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}