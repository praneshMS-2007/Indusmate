"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Crosshair, X, Navigation, LocateFixed, Slash } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Dynamically import the map to avoid SSR issues with Leaflet's window dependency
const MapComponent = dynamic(() => import("./map-component"), { 
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl bg-surface-sunken">
      <span className="text-sm text-text-tertiary">Loading map...</span>
    </div>
  )
});

type LocationPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number, city: string) => void;
  initialLat?: number;
  initialLng?: number;
  initialCity?: string;
};

type Step = "PERMISSION" | "DETECTING" | "MAP";

export function LocationPicker({ isOpen, onClose, onLocationSelect, initialLat, initialLng, initialCity }: LocationPickerProps) {
  const [step, setStep] = useState<Step>("PERMISSION");
  
  // Only show permission screen if we haven't already got coordinates
  useEffect(() => {
    if (isOpen) {
      if (initialLat && initialLng) {
        setStep("MAP");
      } else {
        setStep("PERMISSION");
      }
    }
  }, [isOpen, initialLat, initialLng]);

  const handleDeny = () => setStep("MAP");

  const requestLocation = () => {
    setStep("DETECTING");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Temporarily set map to step to allow MapComponent to mount and handle the new coords
          setStep("MAP");
          // Dispatch a custom event that the MapComponent will listen to
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("map-set-location", {
              detail: { lat: position.coords.latitude, lng: position.coords.longitude }
            }));
          }, 100);
        },
        (error) => {
          console.error("Location error:", error);
          setStep("MAP"); // Fallback to map
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setStep("MAP");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-line bg-[#161C24] p-0 text-white sm:max-w-lg md:max-w-2xl overflow-hidden rounded-2xl" hideCloseButton>
        {step === "PERMISSION" && (
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1A3B35]">
                  <MapPin className="size-6 text-[#20C997]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-wider text-[#20C997] uppercase">Service Location</h3>
                  <h2 className="mt-1 text-xl font-bold text-white">Allow location access?</h2>
                  <p className="mt-1 text-sm text-gray-400">Choose the exact place where the specialist should meet you.</p>
                </div>
              </div>
              <Button variant="ghost" className="h-8 rounded-full bg-white/10 px-4 text-xs font-medium text-white hover:bg-white/20" onClick={onClose}>
                Close
              </Button>
            </div>

            <p className="mt-6 text-sm text-gray-300">
              You can always search the map and move the pin manually, even if location access is denied.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button onClick={requestLocation} className="group flex w-full items-center justify-between rounded-xl bg-[#212B36] p-4 text-left transition-colors hover:bg-[#2A3644]">
                <div>
                  <div className="font-bold text-white">Allow all the time</div>
                  <div className="text-sm text-gray-400">Use your browser location to position the map.</div>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#1A3B35] group-hover:bg-[#20C997]">
                  <MapPin className="size-5 text-[#20C997] group-hover:text-[#161C24]" />
                </div>
              </button>
              
              <button onClick={requestLocation} className="group flex w-full items-center justify-between rounded-xl bg-[#212B36] p-4 text-left transition-colors hover:bg-[#2A3644]">
                <div>
                  <div className="font-bold text-white">While Using This Site</div>
                  <div className="text-sm text-gray-400">Use your browser location to position the map.</div>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#161C24]">
                  <MapPin className="size-5 text-[#20C997]" />
                </div>
              </button>

              <button onClick={handleDeny} className="group flex w-full items-center justify-between rounded-xl bg-[#212B36] p-4 text-left transition-colors hover:bg-[#2A3644]">
                <div>
                  <div className="font-bold text-white">Deny</div>
                  <div className="text-sm text-gray-400">Continue with map search and pin selection.</div>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#161C24]">
                  <Slash className="size-5 text-[#20C997] -rotate-45" />
                </div>
              </button>
            </div>
          </div>
        )}

        {step === "DETECTING" && (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="flex w-full items-start justify-between mb-16">
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1A3B35]">
                  <MapPin className="size-6 text-[#20C997]" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-bold tracking-wider text-[#20C997] uppercase">Service Location</h3>
                  <h2 className="mt-1 text-xl font-bold text-white">Detecting your location</h2>
                  <p className="mt-1 text-sm text-gray-400">Choose the exact place where the specialist should meet you.</p>
                </div>
              </div>
              <Button variant="ghost" className="h-8 rounded-full bg-white/10 px-4 text-xs font-medium text-white hover:bg-white/20" onClick={onClose}>
                Close
              </Button>
            </div>
            
            <div className="relative flex size-16 items-center justify-center rounded-full bg-[#1A3B35]/50 animate-pulse">
              <Navigation className="size-8 text-[#20C997] animate-spin-slow" />
            </div>
            <p className="mt-4 text-[#20C997] font-medium">Detecting your location...</p>
            <div className="h-16" />
          </div>
        )}

        {step === "MAP" && (
          <MapComponent 
            onClose={onClose} 
            onConfirm={(lat, lng, city) => {
              onLocationSelect(lat, lng, city);
              onClose();
            }}
            initialLat={initialLat}
            initialLng={initialLng}
            initialCity={initialCity}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
