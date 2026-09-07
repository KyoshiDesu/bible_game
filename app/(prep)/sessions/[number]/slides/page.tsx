import { Prose } from "@/components/prep/prose";
import { sessionFromParams, type SessionParams } from "@/lib/prep-session";

/**
 * The slide deck as preparation material: what is projected on the left, what
 * the leader says on the right. Presenting them full screen is the presenter
 * surface, which arrives in phase 6.
 */
export default async function SlidesPane({ params }: SessionParams) {
  const session = await sessionFromParams(params);

  return (
    <>
      <p className="mt-4 max-w-[64ch] text-base text-ink-soft">
        {session.slides.length} slides with speaker notes. Read the notes column
        before you teach — it carries the beats that are not on the slide.
      </p>

      <ol className="m-0 my-4 list-none space-y-4 p-0">
        {session.slides.map((slide, index) => (
          <li
            key={slide.kicker + slide.heading}
            className="grid break-inside-avoid gap-4 md:grid-cols-[minmax(0,300px)_1fr]"
          >
            <div className="flex aspect-16/10 flex-col gap-1.5 overflow-hidden rounded-[10px] bg-violet-deep p-3.5 text-on-violet-warm">
              <span className="font-mono text-[9.5px] text-brass-on-violet">
                {String(index + 1).padStart(2, "0")} · {slide.kicker}
              </span>
              {slide.heading ? (
                <span className="font-serif text-sm leading-tight font-semibold">
                  {slide.heading}
                </span>
              ) : null}
              <Prose
                as="div"
                className="overflow-hidden text-[10px] leading-[1.35] text-on-violet-muted [&_blockquote]:m-0 [&_blockquote]:font-serif"
                html={slide.body}
              />
            </div>
            <div>
              <h3 className="mt-0 mb-1.5 font-sans text-[13px] font-extrabold text-ink-soft">
                Speaker notes
              </h3>
              <Prose className="m-0 text-[14.5px]" html={slide.notes} />
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
