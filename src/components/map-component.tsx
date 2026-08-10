"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Crosshair, Map as MapIcon, Layers, Moon, LocateFixed } from "lucide-react";

// Fix Leaflet's default icon path issues
const pinIconHtml = `
  <div style="background-color: #20C997; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
    <div style="transform: rotate(45deg); color: #161C24; font-weight: bold; font-size: 10px;">PIN</div>
  </div>
`;
const customIcon = L.divIcon({
  html: pinIconHtml,
  className: "custom-leaflet-pin",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// A component to handle map events and center changes
function MapEvents({ 
  onLocationChange 
}: { 
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Listen for custom event from the permission screen
  useEffect(() => {
    const handleSetLocation = (e: any) => {
      if (e.detail && e.detail.lat && e.detail.lng) {
        const { lat, lng } = e.detail;
        onLocationChange(lat, lng);
        map.flyTo([lat, lng], 15);
      }
    };
    window.addEventListener("map-set-location", handleSetLocation);
    return () => window.removeEventListener("map-set-location", handleSetLocation);
  }, [map, onLocationChange]);

  return null;
}

export default function MapComponent({
  onClose,
  onConfirm,
  initialLat = 28.6139,
  initialLng = 77.2090,
  initialCity = "New Delhi",
}: {
  onClose: () => void;
  onConfirm: (lat: number, lng: number, city: string) => void;
  initialLat?: number;
  initialLng?: number;
  initialCity?: string;
}) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityName, setCityName] = useState(initialCity);
  const [isSearching, setIsSearching] = useState(false);
  const [mapTheme, setMapTheme] = useState<"light" | "dark">("light");

  // Reverse Geocoding
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
        headers: { "Accept-Language": "en" }
      });
      const data = await res.json();
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.state || "Unknown Area";
        setCityName(city);
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e);
    }
  }, []);

  const handleLocationChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  // Forward Geocoding (Search)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
        headers: { "Accept-Language": "en" }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition([lat, lng]);
        
        // Dispatch custom event to map to fly to new coords
        window.dispatchEvent(new CustomEvent("map-set-location", {
          detail: { lat, lng }
        }));
        
        // Also update city name based on search
        const displayCity = data[0].name.split(",")[0];
        setCityName(displayCity);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setPosition([lat, lng]);
          reverseGeocode(lat, lng);
          window.dispatchEvent(new CustomEvent("map-set-location", {
            detail: { lat, lng }
          }));
        },
        (error) => {
          console.error("Location error:", error);
          alert("Could not access your location. Please check browser permissions.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="flex flex-col bg-[#161C24] p-4 h-[80vh] max-h-[700px]">
      {/* Header */}
      <div className="flex items-start justify-between p-2">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1A3B35]">
            <MapPin className="size-6 text-[#20C997]" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wider text-[#20C997] uppercase">Service Location</h3>
            <h2 className="mt-1 text-xl font-bold text-white">Choose service location</h2>
            <p className="mt-1 text-sm text-gray-400">Choose the exact place where the specialist should meet you.</p>
          </div>
        </div>
        <Button variant="ghost" className="h-8 rounded-full bg-white/10 px-4 text-xs font-medium text-white hover:bg-white/20" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mt-4 flex gap-2 px-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search area, landmark, or address" 
            className="w-full bg-[#212B36] border-0 text-white placeholder:text-gray-500 pl-10 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[#20C997]"
          />
        </div>
        <Button type="submit" disabled={isSearching} className="h-12 rounded-xl bg-[#20C997]/20 text-[#20C997] hover:bg-[#20C997]/30 px-6 font-semibold">
          {isSearching ? "..." : "Search"}
        </Button>
      </form>

      {/* Map Area */}
      <div className="relative mt-4 flex-1 overflow-hidden rounded-2xl border border-white/10">
        <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%", backgroundColor: mapTheme === "dark" ? "#161C24" : "#a5bfdd" }} zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={mapTheme === "dark" 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            }
          />
          <Marker position={position} icon={customIcon} />
          <MapEvents onLocationChange={handleLocationChange} />
        </MapContainer>

        {/* Floating Toolbar on Map */}
        <div className="absolute right-4 top-4 z-[400] flex flex-col gap-2">
          <button 
            type="button"
            onClick={() => setMapTheme(t => t === "light" ? "dark" : "light")}
            className="flex size-10 items-center justify-center rounded-xl bg-[#212B36] border border-white/10 shadow-lg text-gray-400 hover:text-white transition-colors"
            title="Toggle map theme"
          >
            {mapTheme === "light" ? <Moon className="size-5" /> : <MapIcon className="size-5" />}
          </button>
          
          <button 
            type="button"
            onClick={handleLocateMe}
            className="flex size-10 items-center justify-center rounded-xl bg-[#20C997] shadow-lg text-[#161C24] hover:brightness-110 transition-all"
            title="Use current location"
          >
            <LocateFixed className="size-5" />
          </button>
        </div>

        {/* Current Pin Info */}
        <div className="absolute bottom-4 left-4 z-[400] rounded-xl bg-[#212B36]/90 backdrop-blur-sm px-4 py-2 shadow-lg border border-white/10">
          <p className="text-sm font-semibold text-white">Tap or drag to move the pin</p>
          <p className="text-xs text-[#20C997] mt-0.5">{cityName}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between px-2 pb-2">
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">Selected coordinates</span>
          <span className="text-sm font-mono text-white">{position[0].toFixed(5)}, {position[1].toFixed(5)}</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl border border-white/10 text-white hover:bg-white/10">
            Back
          </Button>
          <Button onClick={() => onConfirm(position[0], position[1], cityName)} className="rounded-xl bg-[#20C997] text-[#161C24] hover:bg-[#20C997]/90 font-bold px-6">
            Confirm location
          </Button>
        </div>
      </div>
    </div>
  );
}
