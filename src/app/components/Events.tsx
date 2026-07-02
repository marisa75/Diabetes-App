import React from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  MapPin,
  Wifi,
  Search,
  Star,
  ChevronRight,
  ChevronDown,
  Send,
  X,
  LocateFixed,
  Loader2,
  Check,
  UserPlus,
  ArrowUpDown,
  Users,
  Tag,
  Video,
  ExternalLink,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { cn } from "./ui/utils";
import {
  EventsMap,
  EventLocationMap,
  type MapSelection,
  type MapFocus,
} from "./EventsMap";
import { Calendar as CalendarPicker } from "./ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// ─── Constants ─────────────────────────────────────────────────────────────────

const cornflower = "#6495ED";

/** 5-stufige Smiley-Bewertungsskala (Wert 1–5). */
const SMILEYS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: "😞", label: "Schlecht" },
  { value: 2, emoji: "🙁", label: "Naja" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Gut" },
  { value: 5, emoji: "😄", label: "Super" },
];

const FILTER_CHIPS = [
  "Alle",
  "Online",
  "Vor Ort",
  "Typ 1",
  "Typ 2",
  "Ernährung",
  "Bewegung",
  "Austausch",
] as const;

type FilterChip = (typeof FILTER_CHIPS)[number];

// ─── Event Data ────────────────────────────────────────────────────────────────

/** A person who confirmed attendance for an event. */
export interface Attendee {
  id: string;
  name: string;
  /** Image or data-URL; when absent, coloured initials are shown. */
  avatar?: string;
}

/** Id used for the current logged-in user in attendee lists. */
const ME_ID = "me";

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  /** Physical address for on-site events. Empty for online events. */
  location: string;
  isOnline: boolean;
  category: string;
  description: string;
  cta: string;
  featured?: boolean;
  filterTags: FilterChip[];
  /** [lat, lng] for on-site events shown on the map. Never set for online events. */
  coords?: [number, number];
  /** Meeting link (e.g. Teams/Zoom) for online events. */
  link?: string;
  /** true = created by the current user (no "join" button, cannot leave) */
  owned?: boolean;
  /** People who confirmed attendance. */
  attendees?: Attendee[];
  /** Host of the event. Owned events fall back to the current user. */
  organizer?: Attendee;
  /** Seed smiley ratings (1–5) from other users, used for the average. */
  ratings?: number[];
}

// Shared pool of user accounts, reused as organizers and attendees.
const ACCOUNTS: Attendee[] = [
  { id: "a1", name: "Laura Schneider" },
  { id: "a2", name: "Felix Wagner" },
  { id: "a3", name: "Marie Hoffmann" },
  { id: "a4", name: "Elias Braun" },
  { id: "a5", name: "Sophie Krüger" },
  { id: "a6", name: "Noah Schäfer" },
  { id: "a7", name: "Emilia Koch" },
  { id: "a8", name: "Luca Richter" },
  { id: "a9", name: "Hannah Neumann" },
  { id: "a10", name: "Leon Zimmermann" },
  { id: "a11", name: "Mia Hartmann" },
  { id: "a12", name: "Paul Schwarz" },
  { id: "a13", name: "Emma Krause" },
  { id: "a14", name: "Ben Lehmann" },
  { id: "a15", name: "Clara Maier" },
  { id: "a16", name: "Jonas Köhler" },
  { id: "a17", name: "Lea Fuchs" },
  { id: "a18", name: "Finn Weiß" },
  { id: "a19", name: "Nele Jung" },
  { id: "a20", name: "Tim Vogel" },
];

// Real German addresses (with PLZ) + coordinates for the generated events.
const EXTRA_CITIES: { loc: string; coords: [number, number] }[] = [
  { loc: "Marienplatz 8, 80331 München", coords: [48.1372, 11.5755] },
  { loc: "Domkloster 4, 50667 Köln", coords: [50.9413, 6.9583] },
  { loc: "Königstraße 1, 70173 Stuttgart", coords: [48.7784, 9.1806] },
  { loc: "Zeil 100, 60313 Frankfurt am Main", coords: [50.1155, 8.6842] },
  { loc: "Schadowstraße 11, 40212 Düsseldorf", coords: [51.2254, 6.7763] },
  { loc: "Prager Straße 10, 01069 Dresden", coords: [51.0404, 13.736] },
  { loc: "Grimmaische Str. 1, 04109 Leipzig", coords: [51.3419, 12.3747] },
  { loc: "Am Sande 1, 21335 Lüneburg", coords: [53.2494, 10.4144] },
  { loc: "Kröpeliner Str. 1, 18055 Rostock", coords: [54.0887, 12.1339] },
  { loc: "Ludwigsstraße 2, 55116 Mainz", coords: [49.9982, 8.2736] },
  { loc: "Kaiserstraße 1, 76133 Karlsruhe", coords: [49.0093, 8.4044] },
  { loc: "Breiter Weg 3, 39104 Magdeburg", coords: [52.1277, 11.6289] },
];

interface ExtraSpec {
  title: string;
  category: string;
  date: string;
  time: string;
  online: boolean;
  description: string;
}

const EXTRA_SPECS: ExtraSpec[] = [
  { title: "Diabetes-Stammtisch", category: "Austausch", date: "5. Juli", time: "18:00 – 20:00", online: false, description: "Lockerer Austausch bei Kaffee und Kuchen." },
  { title: "Ernährungs-Workshop: Kohlenhydrate", category: "Ernährung", date: "8. Juli", time: "17:00 – 19:00", online: false, description: "BE/KE sicher einschätzen im Alltag." },
  { title: "Online-Yoga für stabilen Blutzucker", category: "Bewegung", date: "9. Juli", time: "08:00 – 09:00", online: true, description: "Sanftes Morgen-Yoga per Videocall." },
  { title: "Typ-2-Infoabend", category: "Typ 2", date: "11. Juli", time: "18:30 – 20:00", online: false, description: "Grundlagen und Behandlungswege bei Typ 2." },
  { title: "Kochkurs: Low-Carb-Küche", category: "Rezepte", date: "12. Juli", time: "16:00 – 18:30", online: false, description: "Gemeinsam kohlenhydratarm kochen." },
  { title: "Webinar: Insulin richtig dosieren", category: "Ernährung", date: "14. Juli", time: "19:00 – 20:00", online: true, description: "Online-Vortrag mit Fragerunde." },
  { title: "Lauftreff für Einsteiger", category: "Bewegung", date: "15. Juli", time: "09:00 – 10:30", online: false, description: "Gemeinsames, lockeres Laufen für alle Level." },
  { title: "Eltern-Austausch Typ 1", category: "Typ 1", date: "16. Juli", time: "20:00 – 21:00", online: true, description: "Online-Runde für Eltern betroffener Kinder." },
  { title: "Diabetes & Reisen", category: "Austausch", date: "18. Juli", time: "17:00 – 18:30", online: false, description: "Tipps für Urlaub, Flüge und Zeitverschiebung." },
  { title: "Meal-Prep für die Woche", category: "Rezepte", date: "20. Juli", time: "18:00 – 19:00", online: true, description: "Vorkochen leicht gemacht – live gezeigt." },
  { title: "Nordic-Walking-Treff", category: "Bewegung", date: "22. Juli", time: "10:00 – 11:30", online: false, description: "Bewegung an der frischen Luft." },
  { title: "Typ-2-Präventionskurs", category: "Typ 2", date: "24. Juli", time: "18:00 – 19:30", online: false, description: "Vorbeugen durch Ernährung und Bewegung." },
  { title: "Blutzucker & Stress", category: "Austausch", date: "26. Juli", time: "19:30 – 20:30", online: true, description: "Wie Stress den Glukosewert beeinflusst." },
  { title: "Familientag Diabetes", category: "Typ 1", date: "28. Juli", time: "14:00 – 17:00", online: false, description: "Programm für Groß und Klein." },
  { title: "Gesunde Snacks selbst machen", category: "Rezepte", date: "30. Juli", time: "16:30 – 18:00", online: false, description: "Zuckerarme Snacks für zwischendurch." },
  { title: "Sommer-Grillen zuckerbewusst", category: "Ernährung", date: "2. August", time: "17:00 – 20:00", online: false, description: "Grillabend mit stabilen Werten." },
];

// Rotating attendee counts (some events intentionally have 0).
const EXTRA_ATTENDEE_COUNTS = [4, 2, 7, 0, 5, 9, 1, 3, 0, 6, 8, 2, 0, 11, 4, 6];

function pickAttendees(startIndex: number, n: number): Attendee[] {
  const out: Attendee[] = [];
  for (let k = 0; k < n; k++) {
    out.push(ACCOUNTS[(startIndex + k) % ACCOUNTS.length]);
  }
  return out;
}

// Builds 16 events from the specs above, drawing organizers and attendees
// from the shared ACCOUNTS pool so every account appears somewhere.
function buildExtraEvents(): EventItem[] {
  return EXTRA_SPECS.map((s, i) => {
    const city = EXTRA_CITIES[i % EXTRA_CITIES.length];
    const tags: FilterChip[] = [s.online ? "Online" : "Vor Ort"];
    if ((FILTER_CHIPS as readonly string[]).includes(s.category)) {
      tags.push(s.category as FilterChip);
    }
    const n = EXTRA_ATTENDEE_COUNTS[i % EXTRA_ATTENDEE_COUNTS.length];
    return {
      id: `x${i + 1}`,
      title: s.title,
      date: s.date,
      time: s.time,
      // Online events have no physical address; on-site events use a real one.
      location: s.online ? "" : city.loc,
      isOnline: s.online,
      category: s.category,
      description: s.description,
      cta: "Details",
      filterTags: tags,
      // Only on-site events get coordinates (→ shown on the map).
      coords: s.online ? undefined : city.coords,
      link: s.online
        ? `https://teams.microsoft.com/l/meetup-join/donja-event-${i + 1}`
        : undefined,
      organizer: ACCOUNTS[(i + 3) % ACCOUNTS.length],
      attendees: pickAttendees(i * 2, n),
      ratings: [3 + (i % 3), 4 + (i % 2), 5 - (i % 2)],
    };
  });
}

const EVENTS: EventItem[] = [
  {
    id: "featured",
    title: "Ernährung bei Diabetes: Kohlenhydrate richtig einschätzen",
    date: "18. Juni",
    time: "18:00 – 19:30",
    location: "",
    isOnline: true,
    category: "Ernährung",
    description:
      "Lerne, wie du Kohlenhydrate, BE/KE und Portionsgrößen im Alltag besser einschätzen kannst.",
    cta: "Anmelden",
    featured: true,
    filterTags: ["Online", "Ernährung"],
    link: "https://teams.microsoft.com/l/meetup-join/donja-event-featured",
    organizer: { id: "org-1", name: "Dr. Sabine Wolf" },
    attendees: [
      { id: "p1", name: "Lena Möller" },
      { id: "p2", name: "Jonas Krause" },
      { id: "p3", name: "Sarah Weber" },
      { id: "p4", name: "Tim Becker" },
      { id: "p5", name: "Mia Schulz" },
    ],
    ratings: [5, 4, 5, 4, 3, 5],
  },
  {
    id: "2",
    title: "Diabetes-Treffen Berlin",
    date: "22. Juni",
    time: "16:00 – 18:00",
    location: "Alexanderplatz 1, 10178 Berlin",
    isOnline: false,
    category: "Austausch",
    description: "Offenes Treffen für Menschen mit Diabetes und Angehörige.",
    cta: "Details",
    filterTags: ["Vor Ort", "Austausch"],
    coords: [52.5219, 13.4132],
    owned: true,
    attendees: [
      { id: "p6", name: "Anna Fischer" },
      { id: "p7", name: "Paul Wagner" },
      { id: "p8", name: "Nina Hoffmann" },
    ],
  },
  {
    id: "3",
    title: "Sport & Blutzucker verstehen",
    date: "25. Juni",
    time: "17:30 – 18:30",
    location: "",
    isOnline: true,
    category: "Bewegung",
    description:
      "Workshop über Bewegung, Glukosewerte und sichere Planung.",
    cta: "Details",
    filterTags: ["Online", "Bewegung"],
    link: "https://teams.microsoft.com/l/meetup-join/donja-event-3",
    organizer: { id: "org-2", name: "Mario Lang" },
    attendees: [
      { id: "p9", name: "Ben Richter" },
      { id: "p10", name: "Clara Vogel" },
    ],
    ratings: [4, 3, 4, 5],
  },
  {
    id: "4",
    title: "Diabetes Typ 1 Eltern-Café",
    date: "29. Juni",
    time: "10:00 – 12:00",
    location: "Rathausmarkt 1, 20095 Hamburg",
    isOnline: false,
    category: "Typ 1",
    description: "Austausch für Eltern von Kindern mit Typ-1-Diabetes.",
    cta: "Details",
    filterTags: ["Vor Ort", "Typ 1"],
    coords: [53.5503, 9.9917],
    owned: true,
    attendees: [
      { id: "p11", name: "Katrin Bauer" },
      { id: "p12", name: "Markus Lang" },
    ],
  },
  {
    id: "5",
    title: "Kochen mit niedrigem glykämischen Index",
    date: "3. Juli",
    time: "19:00 – 20:30",
    location: "",
    isOnline: true,
    category: "Rezepte",
    description:
      "Praktische Tipps für alltagstaugliche Gerichte mit stabilem Blutzucker.",
    cta: "Details",
    filterTags: ["Online", "Ernährung"],
    link: "https://teams.microsoft.com/l/meetup-join/donja-event-5",
    owned: true,
    attendees: [
      { id: "p13", name: "Helena Groß" },
      { id: "p14", name: "David Sommer" },
      { id: "p15", name: "Yusuf Demir" },
    ],
  },
  ...buildExtraEvents(),
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Ernährung: { bg: "#EEF3FD", text: cornflower },
  Austausch: { bg: "#FEF3C7", text: "#D97706" },
  Bewegung: { bg: "#D1FAE5", text: "#059669" },
  "Typ 1": { bg: "#FCE7F3", text: "#DB2777" },
  "Typ 2": { bg: "#E0E7FF", text: "#4338CA" },
  Rezepte: { bg: "#FEF9C3", text: "#A16207" },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const colors = CATEGORY_COLORS[category] ?? { bg: "#F3F4F6", text: "#6B7280" };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {category}
    </span>
  );
}

function LocationPill({ isOnline, location }: { isOnline: boolean; location: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
      {isOnline ? (
        <Wifi className="w-3 h-3 text-emerald-500" />
      ) : (
        <MapPin className="w-3 h-3 text-gray-400" />
      )}
      {isOnline ? "Online" : location}
    </span>
  );
}

// ─── Attendance ────────────────────────────────────────────────────────────────

/** Reads the current user from the profile stored by the Profile page. */
function loadCurrentUser(): Attendee {
  try {
    const raw = localStorage.getItem("profileData");
    if (raw) {
      const p = JSON.parse(raw);
      const name = [p.vorname, p.nachname].filter(Boolean).join(" ").trim();
      return { id: ME_ID, name: name || "Du", avatar: p.avatar || undefined };
    }
  } catch (err) {
    console.error("Profil konnte nicht geladen werden", err);
  }
  return { id: ME_ID, name: "Du" };
}

const AVATAR_PALETTE = [
  "#6495ED", "#059669", "#D97706", "#DB2777",
  "#4338CA", "#0891B2", "#A16207", "#7C3AED",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

/** Single circular avatar: photo when available, otherwise coloured initials. */
function AttendeeAvatar({
  attendee,
  size = 28,
}: {
  attendee: Attendee;
  size?: number;
}) {
  const isMe = attendee.id === ME_ID;
  const ring = isMe ? "ring-2 ring-white shadow" : "ring-2 ring-white";
  return (
    <div
      className={cn("rounded-full overflow-hidden shrink-0", ring)}
      style={{ width: size, height: size }}
      title={attendee.name}
    >
      {attendee.avatar ? (
        <img
          src={attendee.avatar}
          alt={attendee.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="flex items-center justify-center w-full h-full font-semibold text-white select-none"
          style={{
            backgroundColor: colorFor(attendee.name),
            fontSize: size * 0.4,
          }}
        >
          {initials(attendee.name)}
        </span>
      )}
    </div>
  );
}

/** Overlapping row of avatars with a "+N" overflow bubble. */
function AvatarStack({
  attendees,
  max = 5,
}: {
  attendees: Attendee[];
  max?: number;
}) {
  const shown = attendees.slice(0, max);
  const overflow = attendees.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((a, i) => (
        <div key={a.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <AttendeeAvatar attendee={a} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="rounded-full ring-2 ring-white bg-gray-200 text-gray-600 flex items-center justify-center font-semibold shrink-0"
          style={{ width: 28, height: 28, marginLeft: -8, fontSize: 11 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

/** Resolves an event's organizer; owned events are hosted by the current user. */
function organizerOf(event: EventItem): Attendee | null {
  if (event.owned) return loadCurrentUser();
  return event.organizer ?? null;
}

/** "Organisator" + "Nimmt teil:" row plus the join/leave button. */
function AttendanceSection({
  event,
  onToggle,
  dark = false,
}: {
  event: EventItem;
  onToggle: (id: string) => void;
  dark?: boolean;
}) {
  const attendees = event.attendees ?? [];
  const joined = attendees.some((a) => a.id === ME_ID);
  const count = attendees.length;
  const organizer = organizerOf(event);

  const labelClass = cn(
    "text-xs font-medium",
    dark ? "text-blue-100" : "text-gray-500",
  );

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 pt-3 border-t",
        dark ? "border-white/25" : "border-gray-100",
      )}
    >
      <div className="flex items-start gap-5 min-w-0">
        {/* Organisator */}
        {organizer && (
          <div className="shrink-0">
            <span className={labelClass}>Organisator</span>
            <div className="mt-1" title={organizer.name}>
              <AttendeeAvatar attendee={organizer} />
            </div>
          </div>
        )}

        {/* Teilnehmende */}
        <div className="min-w-0">
          <span className={labelClass}>Nimmt teil:</span>
          <div className="flex items-center gap-2 mt-1">
          {count > 0 ? (
            <>
              <AvatarStack attendees={attendees} />
              <span
                className={cn(
                  "text-xs",
                  dark ? "text-blue-100" : "text-gray-400",
                )}
              >
                {count}
              </span>
            </>
          ) : (
            <span
              className={cn(
                "text-xs",
                dark ? "text-blue-100/80" : "text-gray-400",
              )}
            >
              Sei die/der Erste!
            </span>
          )}
          </div>
        </div>
      </div>

      {event.owned ? (
        <span
          className={cn(
            "shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium",
            dark ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
          )}
        >
          Dein Event
        </span>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(event.id);
          }}
          aria-pressed={joined}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.97]",
            joined
              ? dark
                ? "bg-white text-emerald-600"
                : "bg-emerald-50 text-emerald-600"
              : dark
                ? "bg-white text-[#6495ED]"
                : "text-white",
          )}
          style={
            !joined && !dark ? { backgroundColor: cornflower } : undefined
          }
        >
          {joined ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Du nimmst teil
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              Teilnehmen
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Ratings ───────────────────────────────────────────────────────────────────

const RATINGS_KEY = "eventRatings";

/** Reads the map of the current user's smiley ratings ({ eventId: 1–5 }). */
function loadUserRatings(): Record<string, number> {
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, number>;
  } catch (err) {
    console.error("Bewertungen konnten nicht geladen werden", err);
  }
  return {};
}

/** Persists the map of the current user's smiley ratings. */
function saveUserRatings(map: Record<string, number>) {
  try {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(map));
  } catch (err) {
    console.error("Bewertungen konnten nicht gespeichert werden", err);
  }
}

/** Combines seed ratings with the user's own into { average, count }. */
function ratingStats(
  event: EventItem,
  userRating?: number,
): { average: number; count: number } {
  const values = [...(event.ratings ?? [])];
  if (userRating) values.push(userRating);
  if (values.length === 0) return { average: 0, count: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  return { average: sum / values.length, count: values.length };
}

/** Compact non-interactive summary: closest smiley + average + count. */
function RatingSummary({
  event,
  userRating,
}: {
  event: EventItem;
  userRating?: number;
}) {
  const { average, count } = ratingStats(event, userRating);
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <span className="text-sm leading-none opacity-60">🙂</span>
        Noch keine Bewertung
      </span>
    );
  }
  const closest = SMILEYS.reduce((prev, s) =>
    Math.abs(s.value - average) < Math.abs(prev.value - average) ? s : prev,
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
      <span className="text-sm leading-none">{closest.emoji}</span>
      <span className="font-medium text-gray-700">{average.toFixed(1)}</span>
      <span className="text-gray-400">
        ({count} {count === 1 ? "Bewertung" : "Bewertungen"})
      </span>
    </span>
  );
}

/** Interactive smiley picker. Highlights the user's own selection. */
function SmileyRating({
  value,
  onRate,
  dark = false,
}: {
  value?: number;
  onRate: (value: number) => void;
  dark?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value ?? 0;
  return (
    <div className="flex items-center gap-2">
      {SMILEYS.map((s) => {
        const selected = active === s.value;
        return (
          <button
            key={s.value}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRate(s.value);
            }}
            onMouseEnter={() => setHover(s.value)}
            onMouseLeave={() => setHover(null)}
            aria-label={s.label}
            aria-pressed={value === s.value}
            title={s.label}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-all",
              selected
                ? "scale-110"
                : "opacity-50 hover:opacity-100 hover:scale-105",
            )}
            style={
              selected
                ? {
                    backgroundColor: dark
                      ? "rgba(255,255,255,0.2)"
                      : `${cornflower}15`,
                  }
                : undefined
            }
          >
            <span className="text-2xl leading-none">{s.emoji}</span>
            <span
              className={cn(
                "text-[10px] font-medium",
                selected
                  ? dark
                    ? "text-white"
                    : "text-gray-700"
                  : dark
                    ? "text-blue-100/80"
                    : "text-gray-400",
              )}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Featured Card ─────────────────────────────────────────────────────────────

function FeaturedCard({
  event,
  onOpenDetails,
}: {
  event: EventItem;
  onOpenDetails?: (event: EventItem) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden shadow-md"
      style={{ background: `linear-gradient(135deg, #4A7FD4 0%, #6495ED 60%, #89B4F7 100%)` }}
    >
      <div className="p-4 space-y-3">
        <CategoryBadge category={event.category} />

        <h2 className="text-white leading-snug">{event.title}</h2>

        <p className="text-blue-100 text-sm">{event.description}</p>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-blue-100">
            <Calendar className="w-3.5 h-3.5" />
            {event.date}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-blue-100">
            <Clock className="w-3.5 h-3.5" />
            {event.time}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-blue-100">
            {event.isOnline ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <MapPin className="w-3.5 h-3.5" />
            )}
            {event.isOnline ? "Online" : event.location}
          </span>
        </div>

        {event.isOnline && event.link && (
          <a
            href={event.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 hover:text-white hover:underline"
          >
            <Video className="w-3.5 h-3.5" />
            Online beitreten
          </a>
        )}

        <button
          onClick={() => onOpenDetails?.(event)}
          className="w-full py-2.5 rounded-xl bg-white text-sm font-medium transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ color: cornflower }}
        >
          {event.cta}
        </button>
      </div>
    </motion.div>
  );
}

// ─── List Event Card ───────────────────────────────────────────────────────────

function EventCard({
  event,
  index,
  onToggle,
  onSelect,
  onOpenDetails,
  userRating,
}: {
  event: EventItem;
  index: number;
  onToggle?: (id: string) => void;
  onSelect?: (event: EventItem) => void;
  onOpenDetails?: (event: EventItem) => void;
  userRating?: number;
}) {
  const clickable = !!onSelect && !event.isOnline && !!event.coords;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={clickable ? () => onSelect!(event) : undefined}
      role={clickable ? "button" : undefined}
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3 active:scale-[0.99] transition-transform",
        clickable && "cursor-pointer hover:border-[#6495ED]/40",
      )}
    >
      {/* Date strip */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1"
            style={{ backgroundColor: `${cornflower}15`, color: cornflower }}
          >
            <Calendar className="w-3 h-3" />
            {event.date}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3 h-3 text-gray-400" />
            {event.time}
          </span>
        </div>
        <CategoryBadge category={event.category} />
      </div>

      {/* Title & description */}
      <div className="space-y-1">
        <h3 className="text-gray-900 leading-snug">{event.title}</h3>
        <p className="text-gray-500 text-sm">{event.description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5 min-w-0">
          <LocationPill isOnline={event.isOnline} location={event.location} />
          {event.isOnline && event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: cornflower }}
            >
              <Video className="w-3 h-3" />
              Online beitreten
            </a>
          )}
          <RatingSummary event={event} userRating={userRating} />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails?.(event);
          }}
          className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80"
          style={{ backgroundColor: `${cornflower}15`, color: cornflower }}
        >
          {event.cta}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Teilnahme */}
      <AttendanceSection event={event} onToggle={onToggle ?? (() => {})} />
    </motion.div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 gap-4 text-center"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${cornflower}15` }}
      >
        <Calendar className="w-8 h-8" style={{ color: cornflower }} />
      </div>
      <div>
        <p className="text-gray-700 font-medium">Keine Events gefunden</p>
        <p className="text-gray-400 text-sm mt-1">
          Versuche einen anderen Filter oder Suchbegriff.
        </p>
      </div>
      <button
        className="text-sm font-medium"
        style={{ color: cornflower }}
        onClick={onClear}
      >
        Filter zurücksetzen
      </button>
    </motion.div>
  );
}

// ─── Suggest Card ──────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = Object.keys(CATEGORY_COLORS);

/** Fields shown as small labelled sections in the form. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function SuggestCard({ onAdd }: { onAdd: (event: EventItem) => void }) {
  const [open, setOpen] = useState(false);

  // Online vs. on-site
  const [isOnlineForm, setIsOnlineForm] = useState(false);
  const [link, setLink] = useState("");

  // Location (on-site only)
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  // Event details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateObj, setDateObj] = useState<Date | undefined>(undefined);
  const [dateOpen, setDateOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeOpen, setTimeOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);

  // Today at midnight – used to disable past days in the picker.
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Human-readable date used on the event card, e.g. "12. Juli".
  const dateLabel = dateObj ? format(dateObj, "d. MMMM", { locale: de }) : "";

  // Human-readable time used on the event card, e.g. "18:00 – 19:30".
  const timeLabel = startTime
    ? endTime && endTime !== startTime
      ? `${startTime} – ${endTime}`
      : startTime
    : "";

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6495ED]/40";

  const canSubmit =
    title.trim() !== "" &&
    (isOnlineForm ? link.trim() !== "" : address.trim() !== "");

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocateError("Standort wird von diesem Gerät nicht unterstützt.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords([latitude, longitude]);
        try {
          // Reverse-geocode via OpenStreetMap (same tiles used by the map)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            { headers: { "Accept-Language": "de" } },
          );
          const data = await res.json();
          setAddress(
            data?.display_name ??
              `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          );
        } catch {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocateError(
          "Standort konnte nicht ermittelt werden. Bitte Adresse eingeben.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const resetForm = () => {
    setIsOnlineForm(false);
    setLink("");
    setAddress("");
    setCoords(null);
    setLocateError(null);
    setTitle("");
    setDescription("");
    setDateObj(undefined);
    setDateOpen(false);
    setStartTime("");
    setEndTime("");
    setTimeOpen(false);
    setCategory(CATEGORY_OPTIONS[0]);
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    const tags: FilterChip[] = [isOnlineForm ? "Online" : "Vor Ort"];
    if ((FILTER_CHIPS as readonly string[]).includes(category)) {
      tags.push(category as FilterChip);
    }

    // On-site events: use the captured GPS position, otherwise geocode the
    // typed address so the new event shows up on the map.
    let eventCoords = isOnlineForm ? undefined : coords ?? undefined;
    if (!isOnlineForm && !eventCoords && address.trim()) {
      try {
        const geo = await geocodePlace(address.trim());
        if (geo) eventCoords = geo;
      } catch {
        // Ignore geocoding failures – the event is still added, just without a pin.
      }
    }

    onAdd({
      id: `user-${Date.now()}`,
      title: title.trim(),
      date: dateLabel || "Termin folgt",
      time: timeLabel || "—",
      location: isOnlineForm ? "" : address.trim(),
      isOnline: isOnlineForm,
      category,
      description: description.trim(),
      cta: "Details",
      filterTags: tags,
      coords: eventCoords,
      link: isOnlineForm ? link.trim() : undefined,
      owned: true,
      attendees: [],
    });
    resetForm();
    setSubmitting(false);
    setSubmitted(true);
    setOpen(false);
    window.setTimeout(() => setSubmitted(false), 3500);
  };

  // Live preview event built from the current form values
  const previewEvent: EventItem = {
    id: "preview",
    title: title.trim() || "Titel deines Events",
    date: dateLabel || "Termin folgt",
    time: timeLabel || "—",
    location: isOnlineForm ? "" : address.trim() || "Standort",
    isOnline: isOnlineForm,
    category,
    description:
      description.trim() || "Kurze Beschreibung, worum es bei dem Event geht.",
    cta: "Details",
    filterTags: [isOnlineForm ? "Online" : "Vor Ort"],
    link: isOnlineForm ? link.trim() || undefined : undefined,
    owned: true,
    attendees: [],
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div className="flex gap-4 items-start">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${cornflower}15` }}
        >
          <Send className="w-5 h-5" style={{ color: cornflower }} />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-gray-800 font-medium text-sm">Event anlegen</p>
          <p className="text-gray-500 text-xs leading-relaxed">
            Kennst du ein Diabetes-relevantes Treffen oder einen Workshop?
            Lege ein Event an und teile es mit der Community.
          </p>

          {submitted && (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <Check className="w-3.5 h-3.5" />
              Danke! Dein Event wurde hinzugefügt.
            </p>
          )}

          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80"
              style={{ backgroundColor: `${cornflower}15`, color: cornflower }}
            >
              Event anlegen
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="suggest-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-1">
              {/* ── Format: Vor Ort / Online ─────────────────── */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-600">Format</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOnlineForm(false)}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                      !isOnlineForm
                        ? "text-white border-transparent"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
                    )}
                    style={!isOnlineForm ? { backgroundColor: cornflower } : undefined}
                  >
                    <MapPin className="w-4 h-4" />
                    Vor Ort
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOnlineForm(true)}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                      isOnlineForm
                        ? "text-white border-transparent"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
                    )}
                    style={isOnlineForm ? { backgroundColor: cornflower } : undefined}
                  >
                    <Wifi className="w-4 h-4" />
                    Online
                  </button>
                </div>
              </div>

              {isOnlineForm ? (
                /* ── Online-Link ──────────────────────────────── */
                <Field label="Meeting-Link (Teams, Zoom …)">
                  <div className="relative">
                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://teams.microsoft.com/…"
                      inputMode="url"
                      className={cn(inputClass, "pl-9")}
                    />
                  </div>
                </Field>
              ) : (
                /* ── Standort ─────────────────────────────────── */
                <div className="space-y-2">
                  <Field label="Adresse / Standort">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          setCoords(null);
                        }}
                        placeholder="Straße, Ort …"
                        className={cn(inputClass, "pl-9")}
                      />
                    </div>
                  </Field>

                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80 disabled:opacity-60"
                    style={{ backgroundColor: `${cornflower}15`, color: cornflower }}
                  >
                    {locating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LocateFixed className="w-3.5 h-3.5" />
                    )}
                    {locating
                      ? "Standort wird ermittelt…"
                      : "Aktuellen Standort übertragen"}
                  </button>

                  {coords && (
                    <p className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <Check className="w-3.5 h-3.5" />
                      Standort erfasst ({coords[0].toFixed(4)},{" "}
                      {coords[1].toFixed(4)})
                    </p>
                  )}
                  {locateError && (
                    <p className="text-xs text-red-500">{locateError}</p>
                  )}
                </div>
              )}

              {/* ── Details ─────────────────────────────────── */}
              <Field label="Überschrift">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z. B. Diabetes-Stammtisch München"
                  className={inputClass}
                />
              </Field>

              <Field label="Beschreibung">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Worum geht es? Für wen ist das Event gedacht?"
                  rows={3}
                  className={cn(inputClass, "resize-none")}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Datum">
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          inputClass,
                          "flex items-center gap-2 text-left",
                        )}
                      >
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span
                          className={cn("flex-1", !dateObj && "text-gray-400")}
                        >
                          {dateLabel || "Tag wählen"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={dateObj}
                        onSelect={(d) => {
                          setDateObj(d);
                          if (d) setDateOpen(false);
                        }}
                        defaultMonth={dateObj ?? today}
                        disabled={{ before: today }}
                        locale={de}
                        weekStartsOn={1}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
                <Field label="Uhrzeit">
                  <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          inputClass,
                          "flex items-center gap-2 text-left",
                        )}
                      >
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                        <span
                          className={cn("flex-1", !startTime && "text-gray-400")}
                        >
                          {timeLabel || "Zeit wählen"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <div className="space-y-3">
                        <div className="flex items-end gap-2">
                          <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">
                              Von
                            </span>
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className={inputClass}
                            />
                          </label>
                          <span className="pb-2 text-gray-400">–</span>
                          <label className="space-y-1">
                            <span className="text-xs font-medium text-gray-600">
                              Bis
                            </span>
                            <input
                              type="time"
                              value={endTime}
                              min={startTime || undefined}
                              onChange={(e) => setEndTime(e.target.value)}
                              className={inputClass}
                            />
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setStartTime("");
                              setEndTime("");
                            }}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700"
                          >
                            Zurücksetzen
                          </button>
                          <button
                            type="button"
                            onClick={() => setTimeOpen(false)}
                            className="text-xs font-medium"
                            style={{ color: cornflower }}
                          >
                            Fertig
                          </button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </Field>
              </div>

              <Field label="Kategorie">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              {/* ── Live-Vorschau ───────────────────────────── */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Vorschau</p>
                <EventCard event={previewEvent} index={0} />
              </div>

              {/* ── Actions ─────────────────────────────────── */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: cornflower }}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Wird angelegt…" : "Event anlegen"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 transition-colors hover:bg-gray-200"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sorting ───────────────────────────────────────────────────────────────────

type SortKey = "neuste" | "meiste" | "keine";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "neuste", label: "Neuste" },
  { key: "meiste", label: "Am meisten Teilnehmende" },
  { key: "keine", label: "Keine Teilnehmenden" },
];

const GERMAN_MONTHS = [
  "januar", "februar", "märz", "april", "mai", "juni",
  "juli", "august", "september", "oktober", "november", "dezember",
];

/** Turns a date like "3. Juli" into a sortable timestamp (0 if unparseable). */
function parseGermanDate(date: string): number {
  const m = date.toLowerCase().match(/(\d{1,2})\.\s*([a-zäöü]+)/);
  if (!m) return 0;
  const day = parseInt(m[1], 10);
  const month = GERMAN_MONTHS.indexOf(m[2]);
  if (month === -1) return 0;
  return new Date(2026, month, day).getTime();
}

function attendeeCount(e: EventItem): number {
  return e.attendees?.length ?? 0;
}

function sortEvents(list: EventItem[], sort: SortKey): EventItem[] {
  const arr = [...list];
  switch (sort) {
    case "neuste":
      arr.sort((a, b) => parseGermanDate(b.date) - parseGermanDate(a.date));
      break;
    case "meiste":
      arr.sort((a, b) => attendeeCount(b) - attendeeCount(a));
      break;
    case "keine":
      arr.sort((a, b) => attendeeCount(a) - attendeeCount(b));
      break;
  }
  return arr;
}

// ─── Radius search ─────────────────────────────────────────────────────────────

/** Selectable radii (km) for the proximity filter. null = no distance limit. */
const RADIUS_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Alle", value: null },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "50 km", value: 50 },
];

/** Great-circle distance between two [lat, lng] points in kilometres. */
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Geocodes a PLZ/city query (Germany) to [lat, lng] via OpenStreetMap. */
async function geocodePlace(query: string): Promise<[number, number] | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&countrycodes=de&limit=1&q=${encodeURIComponent(
      query,
    )}`,
    { headers: { "Accept-Language": "de" } },
  );
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  return null;
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.key === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          {current?.label}
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        {SORT_OPTIONS.map((o) => {
          const active = o.key === value;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                onChange(o.key);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors hover:bg-gray-50",
                active ? "font-medium" : "text-gray-700",
              )}
              style={active ? { color: cornflower } : undefined}
            >
              {o.label}
              {active && <Check className="w-4 h-4" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({
  event,
  onClose,
  onToggle,
  userRating,
  onRate,
}: {
  event: EventItem;
  onClose: () => void;
  onToggle: (id: string) => void;
  userRating?: number;
  onRate: (id: string, value: number) => void;
}) {
  const attendees = event.attendees ?? [];
  const joined = attendees.some((a) => a.id === ME_ID);

  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/95 backdrop-blur px-5 py-3 border-b border-gray-100">
          <CategoryBadge category={event.category} />
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div className="space-y-1">
            <h2 className="text-gray-900 leading-snug">{event.title}</h2>
            {event.owned && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
                Dein Event
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4 shrink-0" style={{ color: cornflower }} />
              {event.date}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 shrink-0" style={{ color: cornflower }} />
              {event.time}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              {event.isOnline ? (
                <Wifi className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <MapPin className="w-4 h-4 shrink-0" style={{ color: cornflower }} />
              )}
              {event.isOnline ? "Online" : event.location}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Tag className="w-4 h-4 shrink-0" style={{ color: cornflower }} />
              {event.category}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Beschreibung
            </p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Tags */}
          {event.filterTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.filterTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Location / Map / Online-Link */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {event.isOnline ? "Online-Meeting" : "Standort"}
            </p>
            {event.isOnline ? (
              event.link ? (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: cornflower }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Online beitreten
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-600">
                  <Wifi className="w-4 h-4 text-emerald-500" />
                  Dieses Event findet online statt. Kein Link hinterlegt.
                </div>
              )
            ) : event.coords ? (
              <EventLocationMap event={event} />
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                Für dieses Event ist kein Kartenstandort hinterlegt.
              </div>
            )}
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Teilnehmende ({attendees.length})
            </p>
            {attendees.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {attendees.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 pl-0.5 pr-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-xs text-gray-700"
                  >
                    <AttendeeAvatar attendee={a} size={22} />
                    {a.id === ME_ID ? "Du" : a.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Noch keine Teilnehmenden – sei die/der Erste!
              </p>
            )}
          </div>

          {/* Bewertung */}
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <div className="flex items-center justify-between gap-2 pt-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Bewertung
              </p>
              <RatingSummary event={event} userRating={userRating} />
            </div>
            <SmileyRating
              value={userRating}
              onRate={(v) => onRate(event.id, v)}
            />
            <p className="text-xs text-gray-400">
              {userRating
                ? `Deine Bewertung: „${
                    SMILEYS.find((s) => s.value === userRating)?.label
                  }". Tippe erneut, um sie zu ändern.`
                : "Wie fandest du dieses Event? Tippe auf einen Smiley."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {event.owned ? (
              <span className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-500">
                Dein Event
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onToggle(event.id)}
                aria-pressed={joined}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]",
                  joined ? "bg-emerald-50 text-emerald-600" : "text-white",
                )}
                style={!joined ? { backgroundColor: cornflower } : undefined}
              >
                {joined ? (
                  <>
                    <Check className="w-4 h-4" />
                    Du nimmst teil
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {event.cta === "Anmelden" ? "Anmelden" : "Teilnehmen"}
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 transition-colors hover:bg-gray-200"
            >
              Schließen
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function Events() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("Alle");
  const [featuredOpen, setFeaturedOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  const [events, setEvents] = useState<EventItem[]>(EVENTS);
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const [sort, setSort] = useState<SortKey>("neuste");
  const [detailId, setDetailId] = useState<string | null>(null);

  // The current user's own smiley ratings ({ eventId: 1–5 }), persisted locally.
  const [userRatings, setUserRatings] = useState<Record<string, number>>(
    loadUserRatings,
  );

  // Set/toggle the user's rating for an event and persist it.
  const rateEvent = (id: string, value: number) =>
    setUserRatings((prev) => {
      // Tapping the already-selected smiley removes the rating again.
      const next = { ...prev };
      if (next[id] === value) delete next[id];
      else next[id] = value;
      saveUserRatings(next);
      return next;
    });

  // Radius search: text query → geocoded centre + chosen radius.
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const applyLocation = async () => {
    const q = locationInput.trim();
    if (!q) {
      setCenter(null);
      setGeoError(null);
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    try {
      const coords = await geocodePlace(q);
      if (coords) {
        setCenter(coords);
      } else {
        setCenter(null);
        setGeoError("Ort nicht gefunden. Bitte PLZ oder Stadt prüfen.");
      }
    } catch {
      setGeoError("Standortsuche fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      setGeoLoading(false);
    }
  };

  const clearLocation = () => {
    setLocationInput("");
    setCenter(null);
    setRadiusKm(null);
    setGeoError(null);
  };

  // Focus passed to the map: centre + radius circle (null once cleared).
  const mapFocus: MapFocus | null = center ? { center, radiusKm } : null;

  // Clicking an event zooms the map to it; nonce allows re-selecting the same one.
  const selectEvent = (event: EventItem) =>
    setSelection((prev) => ({ id: event.id, nonce: (prev?.nonce ?? 0) + 1 }));

  const openDetails = (event: EventItem) => setDetailId(event.id);

  // Current user is read once from the saved profile (name + avatar).
  const currentUser = useMemo(loadCurrentUser, []);

  const addEvent = (event: EventItem) => {
    setEvents((prev) => [...prev, event]);
    // Reveal the new event by opening the (default-collapsed) "Alle Events" list.
    setListOpen(true);
  };

  // Add / remove the current user from an event's attendee list.
  const toggleAttendance = (id: string) =>
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id || e.owned) return e;
        const list = e.attendees ?? [];
        const joined = list.some((a) => a.id === ME_ID);
        return {
          ...e,
          attendees: joined
            ? list.filter((a) => a.id !== ME_ID)
            : [...list, currentUser],
        };
      }),
    );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return events.filter((e) => {
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q);

      const matchesFilter =
        activeFilter === "Alle" || e.filterTags.includes(activeFilter);

      // Radius filter only applies once a location was resolved and a distance
      // (not "Alle") was chosen. Events without coords are then excluded.
      const matchesRadius =
        center === null || radiusKm === null
          ? true
          : e.coords != null && haversineKm(e.coords, center) <= radiusKm;

      return matchesSearch && matchesFilter && matchesRadius;
    });
  }, [search, activeFilter, events, center, radiusKm]);

  const featured = filtered.find((e) => e.featured);
  const listEvents = useMemo(
    () => sortEvents(filtered.filter((e) => !e.featured), sort),
    [filtered, sort],
  );
  // The map mirrors the "Alle Events" list (the featured event is shown in its
  // own section, so it is excluded here to keep the counts consistent).
  const mapEvents = useMemo(
    () => filtered.filter((e) => !e.featured),
    [filtered],
  );
  const mapCount = useMemo(
    () => mapEvents.filter((e) => !e.isOnline && e.coords).length,
    [mapEvents],
  );

  // Look up the live event so the modal reflects join/leave changes.
  const detailEvent = detailId
    ? events.find((e) => e.id === detailId) ?? null
    : null;

  const clearFilters = () => {
    setSearch("");
    setActiveFilter("Alle");
    clearLocation();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-4">
        <h1 className="text-gray-900">Events</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Finde Treffen, Workshops und Kurse rund um Diabetes.
        </p>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Event suchen…"
            className="pl-9 pr-9 rounded-xl border-gray-200 bg-gray-50"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_CHIPS.map((chip) => {
            const active = chip === activeFilter;
            return (
              <button
                key={chip}
                onClick={() => setActiveFilter(chip)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  active
                    ? "text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                style={active ? { backgroundColor: cornflower } : undefined}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-5 pb-8 space-y-6">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <EmptyState key="empty" onClear={clearFilters} />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Featured */}
              {featured && (
                <section className="space-y-3">
                  <button
                    onClick={() => setFeaturedOpen((open) => !open)}
                    aria-expanded={featuredOpen}
                    className="w-full flex items-center justify-between"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span
                        className="text-gray-800 font-medium"
                        style={{ fontSize: "1rem" }}
                      >
                        Empfohlen für dich
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-gray-400 transition-transform",
                        featuredOpen && "rotate-180"
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {featuredOpen && (
                      <motion.div
                        key="featured-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <FeaturedCard event={featured} onOpenDetails={openDetails} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              )}

              {/* Map */}
              <section className="space-y-3">
                <button
                  onClick={() => setMapOpen((open) => !open)}
                  aria-expanded={mapOpen}
                  className="w-full flex items-center justify-between"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" style={{ color: cornflower }} />
                    <span
                      className="text-gray-800 font-medium"
                      style={{ fontSize: "1rem" }}
                    >
                      Karte
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {mapCount} {mapCount === 1 ? "Event" : "Events"}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-gray-400 transition-transform",
                        mapOpen && "rotate-180"
                      )}
                    />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {mapOpen && (
                    <motion.div
                      key="map-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <EventsMap
                        events={mapEvents}
                        selection={selection}
                        focus={mapFocus}
                        showHeader={false}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* All Events */}
              {listEvents.length > 0 && (
                <section className="space-y-3">
                  <button
                    onClick={() => setListOpen((open) => !open)}
                    aria-expanded={listOpen}
                    className="w-full flex items-center justify-between"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" style={{ color: cornflower }} />
                      <span
                        className="text-gray-800 font-medium"
                        style={{ fontSize: "1rem" }}
                      >
                        Alle Events
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {listEvents.length} Veranstaltungen
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-gray-400 transition-transform",
                          listOpen && "rotate-180",
                        )}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {listOpen && (
                      <motion.div
                        key="list-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRadiusOpen((open) => !open)}
                        aria-expanded={radiusOpen}
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors",
                          center
                            ? "border-transparent text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                        )}
                        style={center ? { backgroundColor: cornflower } : undefined}
                      >
                        <MapPin
                          className={cn(
                            "w-3.5 h-3.5",
                            center ? "text-white" : "text-gray-400",
                          )}
                        />
                        {center && radiusKm !== null
                          ? `${radiusKm} km`
                          : "Umkreis"}
                        <ChevronDown
                          className={cn(
                            "w-3.5 h-3.5 transition-transform",
                            center ? "text-white" : "text-gray-400",
                            radiusOpen && "rotate-180",
                          )}
                        />
                      </button>
                      <SortDropdown value={sort} onChange={setSort} />
                          </div>

                  {/* Ausklappbare Umkreissuche */}
                  <AnimatePresence initial={false}>
                    {radiusOpen && (
                      <motion.div
                        key="radius-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              applyLocation();
                            }}
                            className="relative"
                          >
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              value={locationInput}
                              onChange={(e) => setLocationInput(e.target.value)}
                              placeholder="PLZ oder Stadt…"
                              className="w-full pl-9 pr-28 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6495ED]/40"
                            />
                            {(locationInput || center) && (
                              <button
                                type="button"
                                onClick={clearLocation}
                                aria-label="Umkreissuche zurücksetzen"
                                className="absolute right-[4.75rem] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="submit"
                              disabled={geoLoading}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                              style={{ backgroundColor: cornflower }}
                            >
                              {geoLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Search className="w-3.5 h-3.5" />
                              )}
                              Suchen
                            </button>
                          </form>

                          {geoError && (
                            <p className="text-xs text-red-500">{geoError}</p>
                          )}

                          {/* Radius-Auswahl */}
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            <span className="text-xs text-gray-400 shrink-0">
                              Umkreis:
                            </span>
                            {RADIUS_OPTIONS.map((opt) => {
                              const active = radiusKm === opt.value;
                              return (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => setRadiusKm(opt.value)}
                                  className={cn(
                                    "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all",
                                    active
                                      ? "text-white shadow-sm"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                  )}
                                  style={
                                    active
                                      ? { backgroundColor: cornflower }
                                      : undefined
                                  }
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>

                          {center && radiusKm !== null && (
                            <p className="text-xs text-gray-400">
                              Events im Umkreis von {radiusKm} km um „
                              {locationInput.trim()}".
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                          {listEvents.map((event, i) => (
                            <EventCard
                              key={event.id}
                              event={event}
                              index={i}
                              onToggle={toggleAttendance}
                              onSelect={selectEvent}
                              onOpenDetails={openDetails}
                              userRating={userRatings[event.id]}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              )}

              {/* Suggest */}
              <SuggestCard onAdd={addEvent} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detailEvent && (
          <DetailModal
            event={detailEvent}
            onClose={() => setDetailId(null)}
            onToggle={toggleAttendance}
            userRating={userRatings[detailEvent.id]}
            onRate={rateEvent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
