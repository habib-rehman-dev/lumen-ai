"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CitationBadge } from "@/components/chat/citation-badge";
import type { Citation } from "@/lib/api";

const NO_CITATIONS: Citation[] = [];

// Turns [1] or [1, 2] into links like [1](#cite-1), so react-markdown hands them to us
// and we can draw badges. (?!\() skips real markdown links such as [text](url).
function linkifyCitations(text: string) {
  return text.replace(/\[(\d{1,2}(?:\s*,\s*\d{1,2})*)\](?!\()/g, (_m, nums: string) =>
    nums
      .split(",")
      .map((n) => `[${n.trim()}](#cite-${n.trim()})`)
      .join(""),
  );
}

// react-markdown does NOT render raw HTML by default, so model output can't inject
// scripts. Don't add "rehype-raw" here.
export function Markdown({
  children,
  citations = NO_CITATIONS,
}: {
  children: string;
  citations?: Citation[];
}) {
  const byIndex = useMemo(() => new Map(citations.map((c) => [c.index, c])), [citations]);

  return (
    <div className="prose prose-sm max-w-none wrap-break-word dark:prose-invert prose-p:leading-relaxed prose-pre:overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const cite = href?.match(/^#cite-(\d+)$/);
            if (cite) {
              const citation = byIndex.get(Number(cite[1]));
              // Sources arrive when the answer finishes; until then show the plain marker
              return citation ? <CitationBadge citation={citation} /> : <>[{cite[1]}]</>;
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
            );
          },
        }}
      >
        {linkifyCitations(children)}
      </ReactMarkdown>
    </div>
  );
}