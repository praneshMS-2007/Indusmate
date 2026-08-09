"use client";

import { Fragment, useMemo } from "react";
import Link from "next/link";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { LISTING_TYPE_META, type ListingType } from "@/lib/listing-spec";
import { rupeesShort, timeRemaining } from "@/lib/format";

export interface MapListing {
  id: string;
  type: ListingType;
  title: string;
  status: string;
  direction: "REVERSE" | "FORWARD";
  locationCity: string;
  locationLat: number;
  locationLng: number;
  destCity: string | null;
  destLat: number | null;
  destLng: number | null;
  referencePrice: number;
  unit: string;
  closesAt: string;
  ownerName: string;
}

// Centred on the MP industrial corridor these listings actually sit in
// (Gwalior–Malanpur down to Mandideep), not on India as a whole — every
// marker should be on screen at the initial zoom without the presenter
// having to scroll to find them.
const CENTER: [number, number] = [25.1, 78.0];
const DEFAULT_ZOOM = 7;

/** One colour-coded dot per market, built from the same hex the badges use — no icon image assets, no 404s. */
function markerIcon(type: ListingType, dimmed: boolean): L.DivIcon {
  const color = LISTING_TYPE_META[type].markerColor;
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;
      width:16px;height:16px;
      border-radius:9999px;
      background:${color};
      opacity:${dimmed ? 0.45 : 1};
      border:2px solid #0d1012;
      box-shadow:0 0 0 1px ${color}66;
    "></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

function originIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;width:12px;height:12px;border-radius:9999px;
      background:#2dd4bf;border:2px solid #0d1012;
    "></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function destIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;width:0;height:0;
      border-left:6px solid transparent;border-right:6px solid transparent;
      border-bottom:12px solid #fb7185;
      filter:drop-shadow(0 0 1px #0d1012);
    "></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 10],
  });
}

/**
 * All open capacity across the MP corridor, one map, five colours.
 *
 * Rendered only via the ssr:false wrapper in listings-map.tsx — Leaflet
 * reaches for `window` at import time and crashes a server render outright.
 */
export function ListingsMapInner({ listings }: { listings: MapListing[] }) {
  const origin = useMemo(() => originIcon(), []);
  const dest = useMemo(() => destIcon(), []);

  return (
    <MapContainer
      center={CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ background: "#151a1d" }}
    >
      <TileLayer
        // Dark-matter basemap keeps the graphite/amber/teal palette intact
        // instead of a bright default OSM tile fighting the rest of the UI.
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      {listings.map((l) => {
        const meta = LISTING_TYPE_META[l.type];
        const dimmed = l.status !== "OPEN" && l.status !== "BIDDING";
        const closed = new Date(l.closesAt).getTime() <= Date.now();

        return (
          <Fragment key={l.id}>
            <Marker
              position={[l.locationLat, l.locationLng]}
              icon={markerIcon(l.type, dimmed)}
            >
              <Popup>
                <div className="flex min-w-[13rem] flex-col gap-1.5 text-sm">
                  <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: meta.markerColor }}>
                    {meta.label}
                  </p>
                  <p className="leading-snug font-medium text-[#f1f5f6]">{l.title}</p>
                  <p className="text-xs text-[#a9b4b9]">
                    {l.locationCity}
                    {l.destCity && ` → ${l.destCity}`} · {l.ownerName}
                  </p>
                  <p className="flex items-center justify-between text-xs text-[#a9b4b9]">
                    <span>
                      {l.direction === "REVERSE" ? "Budget" : "Asking"}{" "}
                      <strong className="text-[#f1f5f6]">{rupeesShort(l.referencePrice)}</strong>
                    </span>
                    <span>{closed ? "closed" : timeRemaining(l.closesAt)}</span>
                  </p>
                  <Link
                    href={`/listings/${l.id}`}
                    className="mt-1 text-xs font-medium"
                    style={{ color: "#f5a524" }}
                  >
                    Open listing →
                  </Link>
                </div>
              </Popup>
            </Marker>

            {l.destLat !== null && l.destLng !== null && (
              <>
                <Marker position={[l.locationLat, l.locationLng]} icon={origin} />
                <Marker position={[l.destLat, l.destLng]} icon={dest} />
                <Polyline
                  positions={[
                    [l.locationLat, l.locationLng],
                    [l.destLat, l.destLng],
                  ]}
                  pathOptions={{
                    color: meta.markerColor,
                    weight: 2,
                    opacity: dimmed ? 0.35 : 0.7,
                    dashArray: "6 6",
                  }}
                />
              </>
            )}
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
