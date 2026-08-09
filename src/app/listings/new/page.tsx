import { getCurrentOrg } from "@/lib/auth";
import { LISTING_TYPES, type ListingType } from "@/lib/listing-spec";
import { ListingForm } from "@/components/listing-form";

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const [org, sp] = await Promise.all([getCurrentOrg(), searchParams]);
  const initialType = LISTING_TYPES.includes(sp.type as ListingType)
    ? (sp.type as ListingType)
    : undefined;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Post a listing</h1>
        <p className="text-sm text-muted-foreground">
          Posting as <span className="text-foreground">{org.name}</span> · {org.city}
        </p>
      </div>

      <ListingForm initialType={initialType} />
    </main>
  );
}
