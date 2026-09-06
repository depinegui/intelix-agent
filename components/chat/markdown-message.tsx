import React from "react";

function inline(text: string, blockKey: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]*`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\s)]+\))/g);
  return parts.map((part, index) => {
    const key = `${blockKey}-inline-${index}`;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={key} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={key}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) return <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline underline-offset-2">{link[1]}</a>;
    return part;
  });
}

export function MarkdownMessage({ content }: { content: string }) {
  const lines = content.replace(/\r/g, "").split("\n");
  const nodes: React.ReactNode[] = [];
  for (let index = 0; index < lines.length;) {
    const blockStart = index;
    const line = lines[index];
    if (line.startsWith("```")) {
      const language = line.slice(3).trim(); const code: string[] = []; index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]);
      index += 1;
      nodes.push(<pre key={`code-${blockStart}`} className="my-3 max-w-full overflow-x-auto rounded-lg bg-foreground/95 p-3 text-xs text-background"><code data-language={language}>{code.join("\n")}</code></pre>); continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { const Tag = (`h${heading[1].length}` as "h1" | "h2" | "h3"); nodes.push(<Tag key={`heading-${blockStart}`} className="mt-3 mb-1 font-semibold">{inline(heading[2], `heading-${blockStart}`)}</Tag>); index += 1; continue; }
    const ordered = line.match(/^\d+\.\s+(.+)$/); const unordered = line.match(/^[-*]\s+(.+)$/);
    if (ordered || unordered) { const items: string[] = []; const isOrdered = Boolean(ordered); while (index < lines.length && (isOrdered ? /^\d+\.\s+/.test(lines[index]) : /^[-*]\s+/.test(lines[index]))) items.push(lines[index++].replace(isOrdered ? /^\d+\.\s+/ : /^[-*]\s+/, "")); const List = isOrdered ? "ol" : "ul"; const listKey = `${isOrdered ? "ordered" : "unordered"}-${blockStart}`; nodes.push(<List key={listKey} className={isOrdered ? "my-2 list-decimal space-y-1 pl-5" : "my-2 list-disc space-y-1 pl-5"}>{items.map((item, itemIndex) => <li key={`${listKey}-item-${itemIndex}`}>{inline(item, `${listKey}-item-${itemIndex}`)}</li>)}</List>); continue; }
    if (line.trim()) nodes.push(<p key={`paragraph-${blockStart}`} className="min-w-0 break-words">{inline(line, `paragraph-${blockStart}`)}</p>); else nodes.push(<div key={`break-${blockStart}`} className="h-2" />);
    index += 1;
  }
  return <div className="space-y-1 text-sm leading-6">{nodes}</div>;
}
