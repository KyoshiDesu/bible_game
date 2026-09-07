import { redirect } from "next/navigation";
import { type Metadata } from "next";

import { SignInForm } from "@/components/account/sign-in-form";
import { Callout } from "@/components/prep/callout";
import { PageHeader } from "@/components/prep/page-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Leaders sign in by email link to create and run their groups.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user && !data.user.is_anonymous) redirect("/groups");

  return (
    <>
      <PageHeader
        title="Sign in"
        lede="Leading a group needs an account. Reading the curriculum does not — every session, case, and worksheet on this site is open."
      />

      {expired ? (
        <Callout tone="clay">
          <p className="m-0">
            That link has expired or been used already. Ask for another one
            below.
          </p>
        </Callout>
      ) : null}

      <SignInForm />

      <Callout>
        <p className="m-0">
          No password. A leader signs in a handful of times a semester, and a
          password they would have to reset each time is worse than a link.
        </p>
      </Callout>
    </>
  );
}
