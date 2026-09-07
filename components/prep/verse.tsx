import { bibleGatewayUrl } from "@/lib/bible-gateway";

import { Prose } from "./prose";

interface VerseProps {
  reference: string;
  text: string;
  gist?: string;
}

/** The anchor passage block: vellum card, reference, quotation, and gloss. */
export function Verse({ reference, text, gist }: VerseProps) {
  return (
    <div className="my-4 rounded-[11px] border border-vellum-rule bg-vellum px-5 py-4">
      <div className="mb-1.5 flex flex-wrap items-center gap-2.5 text-xs font-extrabold text-brass-legible">
        {reference}
        <a
          className="border-b border-dotted border-ink-faint text-[11.5px] font-medium text-ink-faint-legible no-underline"
          href={bibleGatewayUrl(reference)}
          target="_blank"
          rel="noopener"
        >
          open in other translations
        </a>
      </div>
      <Prose
        as="blockquote"
        className="m-0 font-serif text-lg leading-[1.5] text-ink [font-variation-settings:'SOFT'_18]"
        html={text}
      />
      {gist ? (
        <Prose className="mt-2 mb-0 text-sm text-ink-soft" html={gist} />
      ) : null}
    </div>
  );
}

interface ReferenceListProps {
  items: readonly { ref: string; gist: string }[];
}

/** Supporting passages: reference in brass, gloss beside it. */
export function ReferenceList({ items }: ReferenceListProps) {
  return (
    <ul className="my-3 list-none p-0">
      {items.map((item) => (
        <li
          key={item.ref}
          className="grid gap-3.5 border-t border-rule py-2.5 text-[14.5px] md:grid-cols-[180px_1fr]"
        >
          <b className="text-[13.5px] font-extrabold text-brass-legible">
            <a
              className="text-inherit"
              href={bibleGatewayUrl(item.ref)}
              target="_blank"
              rel="noopener"
            >
              {item.ref}
            </a>
          </b>
          <Prose as="span" html={item.gist} />
        </li>
      ))}
    </ul>
  );
}
