/**
 * The curriculum's prose carries a small amount of authored markup — emphasis in
 * a leader's script, a blockquote on a slide. Those fragments are authored in
 * this repository, never supplied by a user, so they are rendered as HTML. That
 * is only defensible if "authored in this repository" is enforced rather than
 * assumed, which is what this allowlist does: `content:check` runs it over every
 * prose field, so a fragment outside the allowlist fails the build instead of
 * reaching a browser.
 *
 * Keep the allowlist as small as the content actually needs. Widening it is a
 * deliberate decision, not a convenience.
 */

const ALLOWED_TAGS = new Set([
  "b",
  "i",
  "em",
  "br",
  "div",
  "blockquote",
  "ul",
  "li",
]);

/** Tags that may carry a `class`, and the exact values permitted. */
const ALLOWED_CLASSES: Record<string, Set<string>> = {
  div: new Set(["body", "attrib"]),
};

/** Tags that never close. */
const VOID_TAGS = new Set(["br"]);

const TAG = /<[^>]*>/g;
const TAG_NAME = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)/;
const PARSED_TAG =
  /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z-]+=(?:'[^']*'|"[^"]*"))*)\s*(\/?)>$/;
const ATTRIBUTE = /([a-zA-Z-]+)=(?:'([^']*)'|"([^"]*)")/g;

/**
 * Returns a list of reasons the fragment is not trusted authored HTML. An empty
 * list means it is safe to render.
 */
export function findTrustedHtmlViolations(fragment: string): string[] {
  const violations: string[] = [];
  const open: string[] = [];

  for (const match of fragment.matchAll(TAG)) {
    const tag = match[0];

    // Read the name before the full parse, so a tag with malformed attributes
    // still reports which tag it was rather than an opaque parse failure.
    const named = TAG_NAME.exec(tag);
    const name = (named?.[2] ?? "").toLowerCase();
    if (!named || !ALLOWED_TAGS.has(name)) {
      violations.push(
        name === "" ? `unparseable tag ${tag}` : `disallowed tag <${name}>`,
      );
      continue;
    }

    const parsed = PARSED_TAG.exec(tag);
    if (!parsed) {
      violations.push(`unparseable attributes on <${name}>`);
      continue;
    }

    const closing = parsed[1] === "/";
    const attributes = parsed[3] ?? "";

    if (closing && attributes.trim() !== "") {
      violations.push(`closing tag </${name}> carries attributes`);
    }

    for (const attribute of attributes.matchAll(ATTRIBUTE)) {
      const key = (attribute[1] ?? "").toLowerCase();
      const value = attribute[2] ?? attribute[3] ?? "";
      const permitted = ALLOWED_CLASSES[name];
      if (key !== "class" || permitted === undefined) {
        violations.push(`disallowed attribute ${key} on <${name}>`);
      } else if (!permitted.has(value)) {
        violations.push(`disallowed class "${value}" on <${name}>`);
      }
    }

    if (VOID_TAGS.has(name)) {
      if (closing) violations.push(`<${name}> has no closing tag`);
      continue;
    }

    if (closing) {
      const expected = open.pop();
      if (expected === undefined)
        violations.push(`closing tag </${name}> has no opening tag`);
      else if (expected !== name)
        violations.push(`closing tag </${name}> does not match <${expected}>`);
    } else if (parsed[4] !== "/") {
      open.push(name);
    }
  }

  for (const name of open.reverse()) violations.push(`unclosed tag <${name}>`);

  return violations;
}

export function isTrustedHtml(fragment: string): boolean {
  return findTrustedHtmlViolations(fragment).length === 0;
}
