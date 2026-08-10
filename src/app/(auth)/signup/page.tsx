import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const session = await auth();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface p-4">
      <div className="elevated flex w-full max-w-sm flex-col rounded-xl border border-line bg-surface-raised p-6 shadow-e2 sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="type-display grid size-12 place-items-center rounded-lg bg-amber text-lg text-on-amber shadow-e1">
            IM
          </span>
          <h1 className="type-heading mt-4 text-2xl">Create an account</h1>
          <p className="type-body mt-2 text-sm text-text-secondary">
            Join IndusMate to discover, bid, and trade.
          </p>
        </div>

        <SignupForm />

        <p className="type-body mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-amber hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
