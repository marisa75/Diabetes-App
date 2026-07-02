import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, RotateCw } from "lucide-react";
import type { EventItem } from "./Events";

/** A click on an event; `nonce` lets the same event be re-selected. */
export interface MapSelection {
  id: string;
  nonce: number;
}

/** Area the map should zoom to (e.g. from a radius search). */
export interface MapFocus {
  center: [number, number];
  /** Radius in km; null = just centre on the point at city zoom. */
  radiusKm: number | null;
}

const cornflower = "#6495ED";

// Germany-centered default view (used when no markers are present)
const GERMANY_CENTER: [number, number] = [51.1657, 10.4515];
const GERMANY_ZOOM = 5.4;

// Zoom level applied when an event is clicked (city / district level)
const CITY_ZOOM = 13;

// ─── Exclamation-mark pin ────────────────────────────────────────────────────

function makePinIcon() {
  return L.divIcon({
    className: "event-map-pin",
    html: `
      <div style="
        width: 30px; height: 30px;
        background: ${cornflower};
        border: 2px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: #ffffff;
          font-weight: 800;
          font-size: 17px;
          line-height: 1;
          font-family: system-ui, sans-serif;
        ">!</span>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

// ─── Default Germany overview ────────────────────────────────────────────────
// The map opens zoomed out on Germany and returns there whenever the set of
// markers changes (e.g. filtering). Skipped while a radius search focuses the
// map on a specific area. Zooming into a city happens on click via
// <FlyToSelected>.

function ResetToGermany({
  points,
  active,
}: {
  points: [number, number][];
  active: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!active) return;
    map.setView(GERMANY_CENTER, GERMANY_ZOOM);
  }, [map, points, active]);
  return null;
}

// ─── Size / refresh maintenance ──────────────────────────────────────────────
// Leaflet needs its container size recomputed whenever the layout around it
// changes – e.g. the collapsible map section expanding, a newly added event
// pushing the page, or an explicit refresh. Without invalidateSize() the tiles
// can render grey or half-drawn. A manual refresh (refreshNonce) additionally
// snaps back to the Germany overview so every marker is visible again.

function MapMaintenance({
  points,
  focus,
  refreshNonce,
}: {
  points: [number, number][];
  focus: MapFocus | null;
  refreshNonce: number;
}) {
  const map = useMap();
  useEffect(() => {
    // Small delay so any expand/collapse animation has settled first.
    const t = setTimeout(() => {
      map.invalidateSize();
      if (!focus && refreshNonce > 0) {
        map.setView(GERMANY_CENTER, GERMANY_ZOOM);
      }
    }, 80);
    return () => clearTimeout(t);
    // points changes whenever events are added/removed → re-measures the map.
  }, [map, points, refreshNonce, focus]);
  return null;
}

// ─── Zoom to a radius-search area ────────────────────────────────────────────

function FocusArea({ focus }: { focus: MapFocus | null }) {
  const map = useMap();
  const key = focus
    ? `${focus.center[0]},${focus.center[1]},${focus.radiusKm ?? "all"}`
    : null;
  useEffect(() => {
    if (!focus) return;
    if (focus.radiusKm) {
      // toBounds() takes the full edge length (diameter) in metres.
      const bounds = L.latLng(focus.center).toBounds(focus.radiusKm * 2000);
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      map.setView(focus.center, CITY_ZOOM);
    }
    // key covers centre + radius so any change re-fits the view.
  }, [key, map]);
  return null;
}

// ─── Zoom to the clicked event ───────────────────────────────────────────────

function FlyToSelected({
  selection,
  located,
  markerRefs,
}: {
  selection: MapSelection | null;
  located: EventItem[];
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selection) return;
    const ev = located.find((e) => e.id === selection.id);
    if (!ev?.coords) return;
    // Zoom into the event's city.
    map.flyTo(ev.coords, CITY_ZOOM, { duration: 0.8 });
    const marker = markerRefs.current[ev.id];
    if (marker) marker.openPopup();
    // nonce is part of the deps so re-clicking the same event zooms again.
  }, [selection?.id, selection?.nonce, located, map, markerRefs]);
  return null;
}

// ─── Main map component ──────────────────────────────────────────────────────

export function EventsMap({
  events,
  selection = null,
  focus = null,
  showHeader = true,
}: {
  events: EventItem[];
  selection?: MapSelection | null;
  focus?: MapFocus | null;
  showHeader?: boolean;
}) {
  const pinIcon = useMemo(() => makePinIcon(), []);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  // Bumped by the "Aktualisieren" button to force a size recompute + reset.
  const [refreshNonce, setRefreshNonce] = useState(0);

  // Only on-site events with geo data get a marker (online events are excluded).
  const located = useMemo(
    () => events.filter((e) => !e.isOnline && e.coords),
    [events],
  );
  const points = useMemo(
    () => located.map((e) => e.coords as [number, number]),
    [located],
  );

  return (
    <section className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2
            className="text-gray-800 inline-flex items-center gap-1.5"
            style={{ fontSize: "1rem" }}
          >
            <MapPin className="w-4 h-4" style={{ color: cornflower }} />
            Auf der Karte
          </h2>
          <span className="text-xs text-gray-400">
            {located.length} {located.length === 1 ? "Event" : "Events"}
          </span>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <button
          type="button"
          onClick={() => setRefreshNonce((n) => n + 1)}
          aria-label="Karte aktualisieren"
          title="Karte aktualisieren"
          className="absolute top-2 right-2 z-[1000] inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-md border border-gray-100 backdrop-blur transition-colors hover:bg-white"
        >
          <RotateCw className="w-3.5 h-3.5" style={{ color: cornflower }} />
          Aktualisieren
        </button>
        <MapContainer
          center={GERMANY_CENTER}
          zoom={GERMANY_ZOOM}
          scrollWheelZoom={false}
          touchZoom={true}
          doubleClickZoom={true}
          style={{ height: "16rem", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ResetToGermany points={points} active={!focus} />
          <MapMaintenance points={points} focus={focus} refreshNonce={refreshNonce} />
          <FocusArea focus={focus} />
          <FlyToSelected
            selection={selection}
            located={located}
            markerRefs={markerRefs}
          />
          {focus?.radiusKm && (
            <Circle
              center={focus.center}
              radius={focus.radiusKm * 1000}
              pathOptions={{
                color: cornflower,
                fillColor: cornflower,
                fillOpacity: 0.08,
                weight: 1.5,
              }}
            />
          )}
          {located.map((e) => (
            <Marker
              key={e.id}
              position={e.coords as [number, number]}
              icon={pinIcon}
              ref={(m) => {
                if (m) markerRefs.current[e.id] = m;
                else delete markerRefs.current[e.id];
              }}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <p style={{ fontWeight: 600, margin: "0 0 4px", color: "#111827" }}>
                    {e.title}
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: "#6B7280" }}>
                    {e.date} · {e.time}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: cornflower, fontWeight: 500 }}>
                    {e.location}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {located.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px] pointer-events-none">
            <p className="text-sm text-gray-500 text-center px-6">
              Keine Events mit Standort für die aktuelle Auswahl.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Single-event location map (used in the detail view) ─────────────────────

export function EventLocationMap({
  event,
  height = "12rem",
}: {
  event: EventItem;
  height?: string;
}) {
  const pinIcon = useMemo(() => makePinIcon(), []);
  if (!event.coords) return null;

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-100">
      <MapContainer
        center={event.coords}
        zoom={CITY_ZOOM}
        scrollWheelZoom={false}
        touchZoom={true}
        doubleClickZoom={true}
        style={{ height, width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={event.coords} icon={pinIcon} />
      </MapContainer>
    </div>
  );
}
