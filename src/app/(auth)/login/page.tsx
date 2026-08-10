import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh w-full bg-surface">
      {/* LEFT SIDE: Login Form */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="IndusMate Logo"
                  width={96}
                  height={96}
                  className="rounded-2xl shadow-lg"
                />
                <span className="type-display text-5xl tracking-tight text-text-primary font-bold">
                  IndusMate
                </span>
              </div>
              <h1 className="type-display mt-8 text-3xl sm:text-4xl text-text-primary uppercase tracking-wide">
                WELCOME BACK
              </h1>
              <p className="type-body text-text-secondary text-sm">
                Enter your credentials to access the operational dashboard.
              </p>
            </div>

            <LoginForm />

            <div className="mt-8 flex flex-col gap-4 text-sm text-text-secondary">
              <p className="text-center">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-medium text-amber hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="py-6 text-center text-xs text-text-tertiary">
          Need assistance? <Link href="/contact" className="hover:underline">Contact Support</Link><br />
          © {new Date().getFullYear()} IndusMate. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Hero Image */}
      <div className="relative hidden w-1/2 flex-col justify-end bg-sidebar lg:flex overflow-hidden">
        <Image
          src="/login-bg.png"
          alt="Industrial B2B Network"
          fill
          priority
          className="object-cover opacity-80 mix-blend-screen"
        />
        {/* Subtle gradient overlay to make text pop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="relative z-10 p-12 lg:p-16 text-white max-w-xl">
          <h2 className="type-display text-3xl mb-4 text-white">
            Integrated Productivity
          </h2>
          <p className="type-body text-white/80 leading-relaxed">
            Connect your global supply chain, workforce, and financial operations in a single, unified source of truth.
          </p>
        </div>
      </div>
    </div>
  );
}
