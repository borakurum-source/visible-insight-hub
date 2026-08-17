// Statik makaleler ile veritabanindaki blog yazilarini tek bir goruntu modeline tasir.
export type BlogFaqItem = { question: string; answer: string };
export type BlogSource = { title: string; url: string };

export type BlogListItem = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  coverImageUrl: string | null;
  readingTime: string;
  dateLabel: string;
  status: "published" | "draft";
  origin: "static" | "db";
};

export type BlogDetail = BlogListItem & {
  body: string;
  answerSummary: string;
  faq: BlogFaqItem[];
  sources: BlogSource[];
  author: string;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
};

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function formatTrDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${TR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function parseFaq(value: unknown): BlogFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as Record<string, unknown>;
      return { question: String(row?.["question"] ?? ""), answer: String(row?.["answer"] ?? "") };
    })
    .filter((item) => item.question && item.answer);
}

export function parseSources(value: unknown): BlogSource[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as Record<string, unknown>;
      const url = String(row?.["url"] ?? "");
      return { title: String(row?.["title"] ?? url), url };
    })
    .filter((item) => item.url);
}

type DbRow = Record<string, any>;

export function dbToListItem(row: DbRow): BlogListItem {
  return {
    slug: String(row["slug"]),
    title: String(row["title"] ?? ""),
    description: String(row["description"] ?? ""),
    category: String(row["category"] ?? "Blog"),
    tags: Array.isArray(row["tags"]) ? (row["tags"] as string[]) : [],
    coverImageUrl: (row["cover_image_url"] as string | null) ?? null,
    readingTime: `${Number(row["read_minutes"] ?? 5)} dk okuma`,
    dateLabel: formatTrDate((row["published_at"] as string | null) ?? (row["created_at"] as string | null)),
    status: row["status"] === "published" ? "published" : "draft",
    origin: "db",
  };
}

export function dbToDetail(row: DbRow): BlogDetail {
  return {
    ...dbToListItem(row),
    body: String(row["body"] ?? ""),
    answerSummary: String(row["answer_summary"] ?? ""),
    faq: parseFaq(row["faq"]),
    sources: parseSources(row["sources"]),
    author: String(row["author"] ?? "OneCite"),
    ogImageUrl: (row["og_image_url"] as string | null) ?? null,
    canonicalUrl: (row["canonical_url"] as string | null) ?? null,
    publishedAt: (row["published_at"] as string | null) ?? null,
    updatedAt: (row["updated_at"] as string | null) ?? null,
  };
}
