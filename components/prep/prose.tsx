import { type ElementType } from "react";

import { findTrustedHtmlViolations } from "@/lib/trusted-html";

interface ProseProps {
  /** Authored curriculum prose. See lib/trusted-html.ts. */
  html: string;
  as?: ElementType;
  className?: string;
}

/**
 * Renders a curriculum prose field.
 *
 * The markup in these fields is authored in `content/` and validated against
 * the trusted-HTML allowlist by `content:check`, which is what makes setting it
 * as HTML safe. The development-only re-check below is belt and braces: it
 * turns a fragment that somehow bypassed validation into a loud failure on the
 * first render rather than a silent one in front of a room.
 */
export function Prose({ html, as, className }: ProseProps) {
  if (process.env.NODE_ENV !== "production") {
    const violations = findTrustedHtmlViolations(html);
    if (violations.length > 0) {
      throw new Error(
        `Untrusted markup in curriculum prose: ${violations.join("; ")}`,
      );
    }
  }

  const Tag = as ?? "p";
  return (
    <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
