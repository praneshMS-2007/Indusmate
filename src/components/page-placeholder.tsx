import { Construction } from "lucide-react";

/** Temporary. Replaced as Blocks 3-5 land. */
export function PagePlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <main className="flex flex-col gap-2 py-12 text-center">
      <Construction className="mx-auto size-8 text-text-tertiary" />
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mx-auto max-w-sm text-sm text-text-secondary">{note}</p>
    </main>
  );
}
