import { type Metadata } from "next";

import { JoinForm } from "@/components/account/join-form";

export const metadata: Metadata = {
  title: "Join a group",
  description: "Join with the code from the screen. No email, no password.",
};

export default function JoinPage() {
  return (
    <>
      <h1 className="mt-8 font-serif text-3xl leading-tight font-semibold [font-variation-settings:'SOFT'_22,'WONK'_1]">
        Join your group
      </h1>
      <p className="mt-2 text-ink-soft">
        No email and no password. You can add an email later if you want to keep
        what you write.
      </p>

      <JoinForm />
    </>
  );
}
