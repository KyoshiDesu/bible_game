import { SectionHeading } from "@/components/prep/page-header";
import { Prose } from "@/components/prep/prose";
import { sessionFromParams, type SessionParams } from "@/lib/prep-session";

export default async function TakeHomePane({ params }: SessionParams) {
  const session = await sessionFromParams(params);

  const items = [
    { heading: "Challenge", body: session.takeHome.challenge },
    { heading: "Practice", body: session.takeHome.practice },
    { heading: "Before next time", body: session.takeHome.prep },
  ];

  return (
    <>
      <SectionHeading>This fortnight</SectionHeading>
      {items.map((item) => (
        <div
          key={item.heading}
          className="mb-3.5 break-inside-avoid rounded-xl border border-rule bg-surface px-5 py-[18px] shadow-press"
        >
          <h3 className="mt-0 mb-2 font-sans text-[15px] font-extrabold text-ink-soft">
            {item.heading}
          </h3>
          <Prose className="m-0" html={item.body} />
        </div>
      ))}
    </>
  );
}
