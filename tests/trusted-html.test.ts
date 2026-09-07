import { describe, expect, it } from "vitest";

import { bibleGatewayUrl } from "@/lib/bible-gateway";
import { findTrustedHtmlViolations, isTrustedHtml } from "@/lib/trusted-html";

describe("trusted HTML", () => {
  it("accepts the markup the curriculum actually uses", () => {
    expect(isTrustedHtml("Plain prose with no markup at all.")).toBe(true);
    expect(isTrustedHtml("Read <b>1 Corinthians 10:23-24</b> aloud.")).toBe(
      true,
    );
    expect(
      isTrustedHtml("What are you hoping this series does <i>not</i> do?"),
    ).toBe(true);
    expect(
      isTrustedHtml("<div class='body'>Ten sessions.<br>Forty minutes.</div>"),
    ).toBe(true);
    expect(
      isTrustedHtml(
        "<blockquote>All things are lawful.</blockquote><div class='attrib'>WEB</div>",
      ),
    ).toBe(true);
  });

  it("rejects anything that could execute", () => {
    expect(findTrustedHtmlViolations("<script>alert(1)</script>")).toContain(
      "disallowed tag <script>",
    );
    expect(findTrustedHtmlViolations("<img src=x onerror=alert(1)>")).toContain(
      "disallowed tag <img>",
    );
    expect(
      findTrustedHtmlViolations("<a href='javascript:alert(1)'>click</a>"),
    ).toContain("disallowed tag <a>");
    expect(findTrustedHtmlViolations("<div onclick='x()'>hi</div>")).toContain(
      "disallowed attribute onclick on <div>",
    );
  });

  it("rejects styling smuggled in through class or style", () => {
    expect(findTrustedHtmlViolations("<div class='wrap'>hi</div>")).toContain(
      'disallowed class "wrap" on <div>',
    );
    expect(
      findTrustedHtmlViolations("<div style='position:fixed'>hi</div>"),
    ).toContain("disallowed attribute style on <div>");
    expect(findTrustedHtmlViolations("<b class='body'>hi</b>")).toContain(
      "disallowed attribute class on <b>",
    );
  });

  it("catches unbalanced markup, which is an authoring bug rather than a risk", () => {
    expect(findTrustedHtmlViolations("<b>unclosed")).toContain(
      "unclosed tag <b>",
    );
    expect(findTrustedHtmlViolations("<b><i>crossed</b></i>")).toContain(
      "closing tag </b> does not match <i>",
    );
    expect(findTrustedHtmlViolations("no opening</b>")).toContain(
      "closing tag </b> has no opening tag",
    );
    expect(isTrustedHtml("line one<br>line two")).toBe(true);
  });
});

describe("Bible Gateway links", () => {
  it("builds the same URL the original page did", () => {
    expect(bibleGatewayUrl("1 Corinthians 10:23-24, 31")).toBe(
      "https://www.biblegateway.com/passage/?search=1%20Corinthians%2010%3A23-24%2C%2031",
    );
  });

  it("stores the reference bare, so the same string is what a reader sees", () => {
    const reference = "Genesis 1:27-28";
    expect(bibleGatewayUrl(reference)).toContain(encodeURIComponent(reference));
  });
});
