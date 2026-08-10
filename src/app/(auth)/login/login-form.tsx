"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Use NextAuth signIn from client
    const { signIn } = await import("next-auth/react");
    
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setPending(false);
    } else {
      router.push("/");
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
        <label htmlFor="email" className="type-caption font-medium">
          Username or Email address
        </label>
        <input
          id="email"
          name="email"
          type="text"
          required
          autoComplete="username email"
          className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm placeholder:text-text-tertiary focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          placeholder="you@company.com or username"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="type-caption font-medium">
            Password
          </label>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-input bg-surface-sunken px-3 py-2 pr-10 text-sm placeholder:text-text-tertiary focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-text-tertiary hover:text-text-primary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}
