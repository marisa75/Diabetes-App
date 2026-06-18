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
  Send,
  X,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { cn } from "./ui/utils";

// ─── Constants ─────────────────────────────────────────────────────────────────

const cornflower = "#6495ED";

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

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  isOnline: boolean;
  category: string;
  description: string;
  cta: string;
  featured?: boolean;
  filterTags: FilterChip[];
}

const EVENTS: EventItem[] = [
  {
    id: "featured",
    title: "Ernährung bei Diabetes: Kohlenhydrate richtig einschätzen",
    date: "18. Juni",
    time: "18:00 – 19:30",
    location: "Online",
    isOnline: true,
    category: "Ernährung",
    description:
      "Lerne, wie du Kohlenhydrate, BE/KE und Portionsgrößen im Alltag besser einschätzen kannst.",
    cta: "Anmelden",
    featured: true,
    filterTags: ["Online", "Ernährung"],
  },
  {
    id: "2",
    title: "Diabetes-Treffen Berlin",
    date: "22. Juni",
    time: "16:00 – 18:00",
    location: "Berlin Mitte",
    isOnline: false,
    category: "Austausch",
    description: "Offenes Treffen für Menschen mit Diabetes und Angehörige.",
    cta: "Details",
    filterTags: ["Vor Ort", "Austausch"],
  },
  {
    id: "3",
    title: "Sport & Blutzucker verstehen",
    date: "25. Juni",
    time: "17:30 – 18:30",
    location: "Online",
    isOnline: true,
    category: "Bewegung",
    description:
      "Workshop über Bewegung, Glukosewerte und sichere Planung.",
    cta: "Details",
    filterTags: ["Online", "Bewegung"],
  },
  {
    id: "4",
    title: "Diabetes Typ 1 Eltern-Café",
    date: "29. Juni",
    time: "10:00 – 12:00",
    location: "Hamburg",
    isOnline: false,
    category: "Typ 1",
    description: "Austausch für Eltern von Kindern mit Typ-1-Diabetes.",
    cta: "Details",
    filterTags: ["Vor Ort", "Typ 1"],
  },
  {
    id: "5",
    title: "Kochen mit niedrigem glykämischen Index",
    date: "3. Juli",
    time: "19:00 – 20:30",
    location: "Online",
    isOnline: true,
    category: "Rezepte",
    description:
      "Praktische Tipps für alltagstaugliche Gerichte mit stabilem Blutzucker.",
    cta: "Details",
    filterTags: ["Online", "Ernährung"],
  },
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
      {location}
    </span>
  );
}

// ─── Featured Card ─────────────────────────────────────────────────────────────

function FeaturedCard({ event }: { event: EventItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden shadow-md"
      style={{ background: `linear-gradient(135deg, #4A7FD4 0%, #6495ED 60%, #89B4F7 100%)` }}
    >
      {/* Top label */}
      <div className="px-4 pt-4 pb-0 flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
        <span className="text-xs text-blue-100 font-medium">Empfohlen für dich</span>
      </div>

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
            <Wifi className="w-3.5 h-3.5" />
            {event.location}
          </span>
        </div>

        <button
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

function EventCard({ event, index }: { event: EventItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3 active:scale-[0.99] transition-transform"
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
        <LocationPill isOnline={event.isOnline} location={event.location} />
        <button
          className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80"
          style={{ backgroundColor: `${cornflower}15`, color: cornflower }}
        >
          {event.cta}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
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

function SuggestCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4 items-start">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${cornflower}15` }}
      >
        <Send className="w-5 h-5" style={{ color: cornflower }} />
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-gray-800 font-medium text-sm">Event vorschlagen</p>
        <p className="text-gray-500 text-xs leading-relaxed">
          Kennst du ein Diabetes-relevantes Treffen oder einen Workshop? Reiche
          ein Event zur Prüfung ein.
        </p>
        <button
          className="text-xs font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80"
          style={{ backgroundColor: `${cornflower}15`, color: cornflower }}
        >
          Event einreichen
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function Events() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("Alle");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return EVENTS.filter((e) => {
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q);

      const matchesFilter =
        activeFilter === "Alle" || e.filterTags.includes(activeFilter);

      return matchesSearch && matchesFilter;
    });
  }, [search, activeFilter]);

  const featured = filtered.find((e) => e.featured);
  const listEvents = filtered.filter((e) => !e.featured);

  const clearFilters = () => {
    setSearch("");
    setActiveFilter("Alle");
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
                <section>
                  <FeaturedCard event={featured} />
                </section>
              )}

              {/* All Events */}
              {listEvents.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-gray-800" style={{ fontSize: "1rem" }}>
                      Alle Events
                    </h2>
                    <span className="text-xs text-gray-400">
                      {listEvents.length} Veranstaltungen
                    </span>
                  </div>
                  {listEvents.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} />
                  ))}
                </section>
              )}

              {/* Suggest */}
              <SuggestCard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
