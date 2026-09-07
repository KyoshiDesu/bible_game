import { buildSearchIndex } from "@/lib/search-index";

/**
 * The search index, prerendered to a static file at build time.
 *
 * Serving it this way rather than bundling it keeps the whole curriculum out of
 * every prep page's JavaScript; the client fetches it on the first keystroke.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchIndex());
}
