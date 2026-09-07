import { QuestionList } from "@/components/prep/question-list";
import { SectionHeading } from "@/components/prep/page-header";
import { sessionFromParams, type SessionParams } from "@/lib/prep-session";

export default async function DiscussionPane({ params }: SessionParams) {
  const session = await sessionFromParams(params);

  return (
    <>
      <SectionHeading>Discussion questions</SectionHeading>
      <p className="max-w-[70ch]">
        Pick three. More than three in twelve minutes means nobody answers
        properly.
      </p>
      <QuestionList items={session.discussion} />
    </>
  );
}
