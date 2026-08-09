"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function pinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;width:14px;height:14px;border-radius:9999px;
      background:${color};border:2px solid #0d1012;
      box-shadow:0 0 0 1px ${color}66;
    "></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const ORIGIN_ICON = pinIcon("#2dd4bf");
const DEST_ICON = pinIcon("#fb7185");

/** Frames both ends of the leg on mount — no manual zoom needed for a two-point route. */
function FitToRoute({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(points, { padding: [24, 24], maxZoom: 11 });
  }, [map, points]);
  return null;
}

export function RouteMapInner({
  origin,
  originLabel,
  destination,
  destinationLabel,
}: {
  origin: [number, number];
  originLabel: string;
  destination: [number, number];
  destinationLabel: string;
}) {
  const points: [number, number][] = [origin, destination];

  return (
    <MapContainer
      center={origin}
      zoom={9}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      className="h-full w-full"
      style={{ background: "#151a1d" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
        maxZoom={19}
      />
      <FitToRoute points={points} />
      <Polyline positions={points} pathOptions={{ color: "#fb7185", weight: 2.5, dashArray: "6 6" }} />
      <Marker position={origin} icon={ORIGIN_ICON} title={originLabel} />
      <Marker position={destination} icon={DEST_ICON} title={destinationLabel} />
    </MapContainer>
  );
}
