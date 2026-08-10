import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { User, UserPen, HelpCircle, LogOut, Globe } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  return (
    <main className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <header className="flex flex-col gap-2 border-b border-line pb-4">
        <h1 className="type-display text-2xl">Settings</h1>
        <p className="type-body text-sm text-text-secondary">
          Manage your account preferences, appearance, and profile.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="type-heading text-lg">Preferences</h2>
        
        <div className="elevated rounded-md border border-line bg-surface-raised p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Theme Appearance</p>
            <p className="type-caption text-text-secondary">Toggle between light and dark mode.</p>
          </div>
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>

        <div className="elevated rounded-md border border-line bg-surface-raised p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Language</p>
            <p className="type-caption text-text-secondary">Select your preferred language.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary bg-surface-sunken px-3 py-1.5 rounded-md border border-line">
            <Globe className="size-4" />
            English (US)
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-heading text-lg">Account</h2>
        
        <div className="flex flex-col gap-2">
          <Link 
            href="/settings/profile"
            className="elevated flex items-center gap-3 rounded-md border border-line bg-surface-raised p-4 transition-colors hover:border-amber/50"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-sunken text-text-secondary">
              <User className="size-4" />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">Account Profile</p>
              <p className="type-caption text-text-secondary">View your public reputation and details.</p>
            </div>
          </Link>

          <Link 
            href="/settings/edit"
            className="elevated flex items-center gap-3 rounded-md border border-line bg-surface-raised p-4 transition-colors hover:border-amber/50"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-sunken text-text-secondary">
              <UserPen className="size-4" />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">Edit Profile</p>
              <p className="type-caption text-text-secondary">Update your contact info and preferences.</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-heading text-lg">Support & Session</h2>
        
        <div className="flex flex-col gap-2">
          <Link 
            href="/settings/help"
            className="elevated flex items-center gap-3 rounded-md border border-line bg-surface-raised p-4 transition-colors hover:border-amber/50"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-sunken text-text-secondary">
              <HelpCircle className="size-4" />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">Help & Support</p>
              <p className="type-caption text-text-secondary">Get assistance with your IndusMate account.</p>
            </div>
          </Link>

          <LogoutButton 
            label="Sign Out"
            showIcon={true}
            variant="ghost"
            className="elevated flex h-auto w-full items-center justify-start gap-3 rounded-md border border-line bg-surface-raised p-4 transition-colors hover:border-danger/50 hover:bg-surface-raised text-danger font-medium hover:text-danger"
          />
        </div>
      </section>
    </main>
  );
}
