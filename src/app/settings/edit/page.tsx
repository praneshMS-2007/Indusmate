import { getCurrentOrg } from "@/lib/auth";
import { updateOrgDetails } from "./actions";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export default async function EditPage() {
  const org = await getCurrentOrg();

  return (
    <main className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="type-heading text-2xl">Edit Organisation Details</h1>
        <p className="type-body text-text-secondary mt-1">Update your contact and business information.</p>
      </div>

      <form action={updateOrgDetails} className="rounded-xl border border-line bg-surface-raised p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="name" className="text-sm font-medium">Organisation Name (Public)</label>
            <input
              id="name" name="name" required defaultValue={org.name}
              className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="legalName" className="text-sm font-medium">Legal Name (Private)</label>
            <input
              id="legalName" name="legalName" required defaultValue={org.legalName}
              className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contactName" className="text-sm font-medium">Contact Name</label>
            <input
              id="contactName" name="contactName" required defaultValue={org.contactName}
              className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contactPhone" className="text-sm font-medium">Phone Number</label>
            <input
              id="contactPhone" name="contactPhone" required defaultValue={org.contactPhone} type="tel"
              className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="contactEmail" className="text-sm font-medium">Contact Email</label>
            <input
              id="contactEmail" name="contactEmail" required defaultValue={org.contactEmail} type="email"
              className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit">
            <Pencil className="mr-2 size-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </main>
  );
}
