import { Prose } from "./prose";

/** Numbered questions with the brass counter chip from the original. */
export function QuestionList({ items }: { items: readonly string[] }) {
  return (
    <ol className="my-3.5 list-none p-0">
      {items.map((item, index) => (
        <li
          key={item}
          className="relative break-inside-avoid border-t border-rule py-3 pl-10 text-[15.5px]"
        >
          <span
            aria-hidden
            className="absolute top-3 left-0 rounded-md bg-brass-lite px-1.5 py-[3px] font-mono text-xs leading-none font-semibold text-brass-ink"
          >
            {index + 1}
          </span>
          <Prose as="span" html={item} />
        </li>
      ))}
    </ol>
  );
}
