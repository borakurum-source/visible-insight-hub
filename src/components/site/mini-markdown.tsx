// Basit, bağımlılıksız markdown -> JSX dönüştürücü. Tam CommonMark desteklemez;
// makale içeriklerindeki başlık, paragraf, liste, tablo, alıntı ve bağlantı
// kalıplarını karşılar.
function inline(text: string, keyPrefix: string) {
  const parts = text.split(/(!?\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    const image = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      return (
        <img
          key={key}
          src={image[2]}
          alt={image[1]}
          loading="lazy"
          className="my-6 w-full rounded-2xl border border-border object-cover"
        />
      );
    }
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={key}>{bold[1]}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={key} href={link[2]} className="text-primary underline-offset-2 hover:underline">{link[1]}</a>;
    return <span key={key}>{part}</span>;
  });
}

export function MiniMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) { i++; continue; }
    if (line.startsWith("---")) { i++; continue; }
    const standaloneImage = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (standaloneImage) {
      blocks.push(
        <figure key={key++} className="my-8">
          <img src={standaloneImage[2]} alt={standaloneImage[1]} loading="lazy" className="w-full rounded-2xl border border-border object-cover" />
          {standaloneImage[1] ? <figcaption className="mt-2 text-center text-xs text-muted-foreground">{standaloneImage[1]}</figcaption> : null}
        </figure>,
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) { blocks.push(<h1 key={key++} className="text-3xl font-extrabold text-foreground mt-10 mb-4">{inline(line.slice(2), `h1-${key}`)}</h1>); i++; continue; }
    if (line.startsWith("## ")) { blocks.push(<h2 key={key++} className="text-2xl font-extrabold text-foreground mt-10 mb-4">{inline(line.slice(3), `h2-${key}`)}</h2>); i++; continue; }
    if (line.startsWith("### ")) { blocks.push(<h3 key={key++} className="text-xl font-bold text-foreground mt-8 mb-3">{inline(line.slice(4), `h3-${key}`)}</h3>); i++; continue; }
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith(">")) { quoteLines.push((lines[i] ?? "").replace(/^>\s?/, "")); i++; }
      blocks.push(<blockquote key={key++} className="border-l-2 border-cyan bg-muted px-4 py-3 my-5 text-foreground">{quoteLines.join(" ")}</blockquote>);
      continue;
    }
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) { tableLines.push(lines[i] ?? ""); i++; }
      const rows = tableLines.filter((l) => !/^\|[\s-:|]+\|$/.test(l.trim())).map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      const [head, ...body] = rows;
      blocks.push(
        <div key={key++} className="my-6 overflow-x-auto">
          <table className="w-full text-sm">
            {head && <thead><tr>{head.map((c, ci) => <th key={ci} className="border-b border-border px-3 py-3 text-left font-bold text-foreground">{inline(c, `th-${ci}`)}</th>)}</tr></thead>}
            <tbody>{body.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} className="border-b border-border px-3 py-3 text-muted-foreground">{inline(c, `td-${ri}-${ci}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^(-|\d+\.)\s/.test(line.trim())) {
      const listLines: string[] = [];
      while (i < lines.length && /^(-|\d+\.)\s/.test((lines[i] ?? "").trim())) { listLines.push((lines[i] ?? "").trim()); i++; }
      const ordered = /^\d+\./.test(listLines[0] ?? "");
      const Tag = ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={key++} className={`my-4 space-y-1 pl-6 text-muted-foreground ${ordered ? "list-decimal" : "list-disc"}`}>
          {listLines.map((l, li) => <li key={li}>{inline(l.replace(/^(-|\d+\.)\s/, ""), `li-${li}`)}</li>)}
        </Tag>,
      );
      continue;
    }
    const paraLines: string[] = [];
    while (i < lines.length && (lines[i] ?? "").trim() && !/^(#|>|\||-|\d+\.)/.test((lines[i] ?? "").trim())) { paraLines.push(lines[i] ?? ""); i++; }
    if (paraLines.length) blocks.push(<p key={key++} className="mt-5 text-base leading-8 text-muted-foreground">{inline(paraLines.join(" "), `p-${key}`)}</p>);
    else i++;
  }
  return <>{blocks}</>;
}
