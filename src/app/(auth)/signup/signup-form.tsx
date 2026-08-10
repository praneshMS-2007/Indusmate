"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { registerUser } from "./actions";

export function SignupForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await registerUser(formData);

    if (res.error) {
      setError(res.error);
      setPending(false);
      return;
    }

    // Auto sign in after registration
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInRes?.error) {
      setError("Failed to sign in automatically");
      setPending(false);
    } else {
      router.push("/welcome");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md bg-danger-muted p-3 text-sm text-danger">
          {error}
        </div>
      )}
      
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="type-caption font-medium">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          placeholder="John Doe"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="type-caption font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          placeholder="you@company.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="type-caption font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
        />
      </div>

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
      </Button>
    </form>
  );
}
