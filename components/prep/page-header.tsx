import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  lede?: ReactNode;
}

export function PageHeader({ title, lede }: PageHeaderProps) {
  return (
    <>
      <h1 className="m-0 mb-2.5 font-serif text-[clamp(30px,4.4vw,44px)] leading-[1.04] font-semibold tracking-[-0.012em] [font-variation-settings:'SOFT'_22,'WONK'_1]">
        {title}
      </h1>
      {lede ? (
        <p className="max-w-[64ch] text-[18.5px] leading-[1.55] text-ink-soft">
          {lede}
        </p>
      ) : null}
    </>
  );
}

interface SectionHeadingProps {
  children: ReactNode;
  id?: string;
}

/** The `h3` of the original: serif, 23px, generous space above. */
export function SectionHeading({ children, id }: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className="mt-9 mb-2.5 scroll-mt-20 font-serif text-[23px] leading-[1.18] font-semibold"
    >
      {children}
    </h2>
  );
}
