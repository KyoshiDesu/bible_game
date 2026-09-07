import { Callout } from "@/components/prep/callout";
import { SectionHeading } from "@/components/prep/page-header";
import { ReferenceList, Verse } from "@/components/prep/verse";
import { sessionFromParams, type SessionParams } from "@/lib/prep-session";

export default async function ScripturePane({ params }: SessionParams) {
  const session = await sessionFromParams(params);

  return (
    <>
      <SectionHeading>Anchor passage</SectionHeading>
      <Verse
        reference={session.anchor.ref}
        text={session.anchor.text}
        gist={session.anchor.gist}
      />

      <SectionHeading>Supporting passages</SectionHeading>
      <ReferenceList items={session.support} />

      <Callout>
        <p className="m-0">
          Scripture text on this page is the World English Bible, which is
          public domain — copy and project it freely. Read the anchor in your
          congregation&rsquo;s translation before you teach, and read it in its
          own chapter at least once.
        </p>
      </Callout>
    </>
  );
}
