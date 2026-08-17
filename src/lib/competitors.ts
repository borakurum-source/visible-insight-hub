// Rakip kayıtları için tek doğruluk kaynağı.
// brand_intelligence.competitors jsonb'si eskiden düz metin dizisiydi (["Hipaş Plastik"]).
// Artık {name, domain} nesneleri tutuyoruz; okuma tarafında eski kayıtlar normalize ediliyor.

export type CompetitorType = "direct" | "indirect";
export type CompetitorEntry = { name: string; domain: string; type: CompetitorType };

export const COMPETITOR_TYPE_LABEL: Record<CompetitorType, string> = {
  direct: "Doğrudan rakip",
  indirect: "Dolaylı rakip",
};

function normalizeType(value: unknown): CompetitorType {
  return String(value ?? "").toLowerCase() === "indirect" ? "indirect" : "direct";
}

export function cleanDomain(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export function normalizeCompetitors(raw: unknown): CompetitorEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: CompetitorEntry[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const name = item.trim();
      if (name) out.push({ name, domain: "", type: "direct" });
      continue;
    }
    if (item && typeof item === "object") {
      const record = item as { name?: unknown; domain?: unknown; type?: unknown };
      const name = String(record.name ?? "").trim();
      const domain = cleanDomain(record.domain as string | undefined);
      if (name || domain) out.push({ name: name || domain, domain, type: normalizeType(record.type) });
    }
  }
  return out;
}

export function competitorNames(entries: CompetitorEntry[]): string[] {
  return entries.map((e) => e.name).filter(Boolean);
}

function fold(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c] ?? c)
    .replace(/\s+/g, " ")
    .trim();
}

/** Bir rakip; yanıt metninde ya da kaynak gösterilen alan adlarında geçiyor mu? */
export function competitorMatches(
  entry: CompetitorEntry,
  input: { answer?: string | null; domains?: string[] },
): boolean {
  const domain = cleanDomain(entry.domain);
  if (domain) {
    const answer = fold(String(input.answer ?? ""));
    if (answer.includes(domain)) return true;
    if ((input.domains ?? []).some((d) => {
      const clean = cleanDomain(d);
      return clean === domain || clean.endsWith(`.${domain}`) || domain.endsWith(`.${clean}`);
    })) {
      return true;
    }
  }
  const name = fold(entry.name);
  if (name.length < 3) return false;
  const answer = fold(String(input.answer ?? ""));
  if (answer.includes(name) || answer.includes(name.replace(/\s+/g, ""))) return true;
  const slug = name.replace(/\s+/g, "");
  return (input.domains ?? []).some((d) => cleanDomain(d).split(".")[0] === slug);
}

/** Bir alan adı takip edilen rakiplerden birine mi ait? */
export function domainIsTracked(entries: CompetitorEntry[], domain: string): boolean {
  return entries.some((entry) => competitorMatches(entry, { domains: [domain] }));
}
