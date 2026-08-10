"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import type { OrgType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationPicker } from "@/components/location-picker";
import { submitOnboarding } from "./actions";

export function OnboardingForm({ role }: { role: OrgType }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [city, setCity] = useState("New Delhi");
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.2090);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await submitOnboarding(formData);

    if (res.error) {
      setError(res.error);
      setPending(false);
    } else {
      const { getSession } = await import("next-auth/react");
      await getSession();
      router.push("/onboarding/kyc");
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="city" value={city} />
        <input type="hidden" name="lat" value={lat.toString()} />
        <input type="hidden" name="lng" value={lng.toString()} />

        {error && (
          <div className="rounded-md bg-danger-muted p-3 text-sm text-danger">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="orgName" className="type-caption font-medium">Organisation Name (Public)</label>
            <input
              id="orgName"
              name="orgName"
              required
              className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="e.g. Chambal Steel"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="legalName" className="type-caption font-medium">Legal Name (Private)</label>
            <input
              id="legalName"
              name="legalName"
              required
              className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="e.g. Chambal Steel Pvt Ltd"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Headquarters Location</Label>
            <div className="flex w-full items-center justify-between rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm shadow-sm">
              <span className="truncate">{city || "Select location..."}</span>
              <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-amber hover:bg-amber/10 hover:text-amber" onClick={() => setPickerOpen(true)}>
                <MapPin className="mr-1 size-3" />
                Pick
              </Button>
            </div>
            <p className="text-xs text-text-tertiary">Used for distance calculations.</p>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="gstin" className="type-caption font-medium">GSTIN</label>
            <input
              id="gstin"
              name="gstin"
              required
              className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
              placeholder="22AAAAA0000A1Z5"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 mt-2">
            <p className="type-caption border-b border-line pb-1 text-text-secondary">Primary Contact</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contactName" className="type-caption font-medium">Contact Name</label>
            <input
              id="contactName"
              name="contactName"
              required
              className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contactPhone" className="type-caption font-medium">Phone Number</label>
            <input
              id="contactPhone"
              name="contactPhone"
              required
              type="tel"
              className="rounded-md border border-input bg-surface-sunken px-3 py-2 text-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
            />
          </div>
        </div>

        <Button type="submit" disabled={pending} className="mt-4 w-full">
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Continue to KYC"}
        </Button>
      </form>

      {pickerOpen && (
        <LocationPicker
          isOpen={true}
          onClose={() => setPickerOpen(false)}
          initialLat={lat}
          initialLng={lng}
          initialCity={city}
          onLocationSelect={(newLat, newLng, newCity) => {
            setLat(newLat);
            setLng(newLng);
            setCity(newCity);
          }}
        />
      )}
    </>
  );
}
