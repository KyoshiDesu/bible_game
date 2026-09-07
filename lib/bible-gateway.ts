/**
 * The curriculum stores bare Scripture references ("1 Corinthians 10:23-24, 31")
 * and computes the lookup URL at render, so the reference stays readable, stays
 * searchable, and is not tied to one Bible site.
 */
const BIBLE_GATEWAY = "https://www.biblegateway.com/passage/?search=";

export function bibleGatewayUrl(reference: string): string {
  return BIBLE_GATEWAY + encodeURIComponent(reference);
}
