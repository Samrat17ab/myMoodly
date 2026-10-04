import Link from "next/link";
import type { ReactNode } from "react";

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;
const SAFE_HREF = /^(\/(?!\/)|https?:\/\/|mailto:)/;

/** Renders **bold**, *italic* and [text](href) as elements, so post text is never parsed as HTML. */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter(Boolean);
  return <>{parts.map((part, i) => renderPart(part, i))}</>;
}

function renderPart(part: string, key: number): ReactNode {
  if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
    return <strong key={key}>{part.slice(2, -2)}</strong>;
  }
  const link = part.match(LINK);
  if (link) {
    const [, label, href] = link;
    if (!SAFE_HREF.test(href)) return label;
    if (href.startsWith("/")) {
      return (
        <Link key={key} href={href}>
          {label}
        </Link>
      );
    }
    const external = href.startsWith("http");
    return (
      <a key={key} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {label}
      </a>
    );
  }
  if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
    return <em key={key}>{part.slice(1, -1)}</em>;
  }
  return part;
}
