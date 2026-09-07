"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { type SearchEntry } from "@/lib/search-index";

const MAX_HITS = 12;
const MIN_TERM = 2;

/**
 * Search across sessions, cases, sources, glossary, and the handbook.
 *
 * The index is a static JSON file fetched on the first keystroke rather than
 * bundled, so a leader who never searches never downloads the curriculum twice.
 */
export function Search() {
  const router = useRouter();
  const listboxId = useId();
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  // One fetch, on first use. A failure leaves the box inert rather than
  // throwing: search is a convenience, and the rail still navigates.
  useEffect(() => {
    if (term.length < MIN_TERM || index !== null) return;
    let cancelled = false;
    void fetch("/search-index.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: SearchEntry[]) => {
        if (!cancelled) setIndex(data);
      })
      .catch(() => {
        if (!cancelled) setIndex([]);
      });
    return () => {
      cancelled = true;
    };
  }, [term, index]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const needle = term.trim().toLowerCase();
  const hits =
    needle.length < MIN_TERM || index === null
      ? []
      : index.filter((entry) => entry.blob.includes(needle)).slice(0, MAX_HITS);

  const showPanel = open && needle.length >= MIN_TERM;

  function go(entry: SearchEntry | undefined) {
    if (!entry) return;
    setOpen(false);
    setTerm("");
    router.push(entry.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((current) =>
        hits.length === 0 ? 0 : (current + 1) % hits.length,
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) =>
        hits.length === 0 ? 0 : (current - 1 + hits.length) % hits.length,
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      go(hits[active]);
    }
  }

  return (
    <div ref={container} className="relative px-[18px] pb-3.5 print:hidden">
      <input
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          showPanel && hits.length > 0 ? `${listboxId}-${active}` : undefined
        }
        aria-label="Search the curriculum"
        placeholder="Search sessions, verses, cases…"
        className="w-full rounded-[7px] border border-white/15 bg-white/[0.07] px-2.5 py-2 text-sm text-on-violet placeholder:text-white/45"
        value={term}
        onChange={(event) => {
          setTerm(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {showPanel ? (
        <div className="absolute inset-x-[18px] top-full z-50 max-h-[60vh] overflow-y-auto rounded-lg border border-rule bg-surface p-1.5 shadow-press">
          {hits.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Search results"
              className="m-0 list-none p-0"
            >
              {hits.map((entry, position) => (
                <li
                  key={`${entry.href}-${entry.title}`}
                  id={`${listboxId}-${position}`}
                  role="option"
                  aria-selected={position === active}
                  className={`cursor-pointer rounded-md px-3 py-2 ${
                    position === active ? "bg-brass-lite" : ""
                  }`}
                  onMouseEnter={() => setActive(position)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    go(entry);
                  }}
                >
                  <b className="block text-[15px] text-ink">{entry.title}</b>
                  <span className="block text-[13px] text-ink-faint-legible">
                    {entry.context}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p
              id={listboxId}
              role="status"
              className="m-0 px-3 py-2 text-sm text-ink-faint-legible"
            >
              {index === null
                ? "Searching…"
                : `Nothing matched “${term.trim()}”. Try a book of the Bible, a session title, or a term like “loot box”.`}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
