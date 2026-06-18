import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Clock,
  ChevronRight,
  Star,
  Wheat,
  Droplets,
  Flame,
  Dumbbell,
  UtensilsCrossed,
  X,
  Plus,
  Heart,
  BookOpen,
  Info,
} from "lucide-react";
import { Input } from "./ui/input";
import { cn } from "./ui/utils";

// ─── Constants ─────────────────────────────────────────────────────────────────

const cornflower = "#6495ED";

const FILTER_CHIPS = [
  "Alle",
  "Frühstück",
  "Mittagessen",
  "Abendessen",
  "Snacks",
  "Low Carb",
  "Viel Ballaststoffe",
  "Schnell",
  "Vegetarisch",
] as const;

type FilterChip = (typeof FILTER_CHIPS)[number];

const VIEW_TABS = ["Alle Rezepte", "Meine Rezepte", "Favoriten"] as const;
type ViewTab = (typeof VIEW_TABS)[number];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NutritionInfo {
  carbs: number;
  fiber?: number;
  sugar?: number;
  calories?: number;
  protein?: number;
  fat?: number;
}

interface Recipe {
  id: string;
  title: string;
  category: string;
  time: string;
  difficulty?: string;
  description: string;
  nutrition: NutritionInfo;
  diabetesTip?: string;
  filterTags: FilterChip[];
  featured?: boolean;
  favorited?: boolean;
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const RECIPES: Recipe[] = [
  {
    id: "featured",
    title: "Mediterrane Gemüse-Bowl mit Hähnchen",
    category: "Mittagessen",
    time: "25 Min.",
    difficulty: "Einfach",
    description:
      "Eine ausgewogene Mahlzeit mit viel Gemüse, Eiweiß und moderaten Kohlenhydraten.",
    nutrition: { carbs: 38, sugar: 7, fiber: 9, calories: 520, protein: 35, fat: 18 },
    diabetesTip:
      "Ballaststoffreich und eiweißreich – kann helfen, den Blutzuckeranstieg zu verlangsamen.",
    filterTags: ["Mittagessen", "Viel Ballaststoffe"],
    featured: true,
    favorited: false,
  },
  {
    id: "2",
    title: "Haferflocken-Beeren-Frühstück",
    category: "Frühstück",
    time: "10 Min.",
    description: "Schnelles Frühstück mit Beeren, Joghurt und Haferflocken.",
    nutrition: { carbs: 32, fiber: 8 },
    filterTags: ["Frühstück", "Viel Ballaststoffe", "Schnell", "Vegetarisch"],
    favorited: true,
  },
  {
    id: "3",
    title: "Linsensalat mit Feta",
    category: "Mittagessen",
    time: "20 Min.",
    description: "Protein- und ballaststoffreicher Salat für lange Sättigung.",
    nutrition: { carbs: 28, fiber: 11 },
    filterTags: ["Mittagessen", "Viel Ballaststoffe", "Vegetarisch"],
    favorited: false,
  },
  {
    id: "4",
    title: "Zucchini-Nudeln mit Tomatensauce",
    category: "Abendessen",
    time: "25 Min.",
    description: "Leichte Low-Carb-Alternative zu klassischer Pasta.",
    nutrition: { carbs: 18, fiber: 6 },
    filterTags: ["Abendessen", "Low Carb", "Vegetarisch"],
    favorited: false,
  },
  {
    id: "5",
    title: "Apfel-Zimt-Quark",
    category: "Snack",
    time: "5 Min.",
    description: "Schneller Snack mit Eiweiß und natürlicher Süße.",
    nutrition: { carbs: 20, sugar: 14 },
    filterTags: ["Snacks", "Schnell", "Vegetarisch"],
    favorited: true,
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Frühstück:    { bg: "#FEF9C3", text: "#A16207" },
  Mittagessen:  { bg: "#EEF3FD", text: cornflower },
  Abendessen:   { bg: "#EDE9FE", text: "#7C3AED" },
  Snack:        { bg: "#FEE2E2", text: "#DC2626" },
  "Low Carb":   { bg: "#D1FAE5", text: "#059669" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const c = CATEGORY_COLORS[category] ?? { bg: "#F3F4F6", text: "#6B7280" };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {category}
    </span>
  );
}

function NutritionPill({
  icon: Icon,
  value,
  unit,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number;
  unit: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-xs font-semibold text-gray-800">
        {value}
        <span className="font-normal text-gray-400">{unit}</span>
      </span>
      <span className="text-[10px] text-gray-400 leading-none">{label}</span>
    </div>
  );
}

// ─── Featured Card ─────────────────────────────────────────────────────────────

function FeaturedCard({ recipe }: { recipe: Recipe }) {
  const [fav, setFav] = useState(recipe.favorited);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden shadow-md"
      style={{ background: `linear-gradient(135deg, #4A7FD4 0%, #6495ED 60%, #89B4F7 100%)` }}
    >
      {/* Top bar */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
          <span className="text-xs text-blue-100 font-medium">Empfohlen für dich</span>
        </div>
        <button
          onClick={() => setFav((f) => !f)}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <Heart
            className="w-4 h-4"
            style={{ color: fav ? "#FCA5A5" : "white", fill: fav ? "#FCA5A5" : "none" }}
          />
        </button>
      </div>

      <div className="px-4 pb-4 pt-2 space-y-3">
        <div className="flex items-center gap-2">
          <CategoryBadge category={recipe.category} />
          <span className="inline-flex items-center gap-1 text-xs text-blue-100">
            <Clock className="w-3 h-3" />
            {recipe.time}
          </span>
          {recipe.difficulty && (
            <span className="text-xs text-blue-100 bg-white/20 px-2 py-0.5 rounded-full">
              {recipe.difficulty}
            </span>
          )}
        </div>

        <h2 className="text-white leading-snug">{recipe.title}</h2>
        <p className="text-blue-100 text-sm">{recipe.description}</p>

        {/* Nutrition row */}
        <div className="bg-white/15 rounded-xl px-4 py-3 flex justify-between">
          <NutritionPill icon={Wheat}    value={recipe.nutrition.carbs}   unit="g"    label="Kohlenhydrate" color="#FCD34D" />
          {recipe.nutrition.fiber    && <NutritionPill icon={Droplets} value={recipe.nutrition.fiber}   unit="g"    label="Ballaststoffe"  color="#6EE7B7" />}
          {recipe.nutrition.protein  && <NutritionPill icon={Dumbbell} value={recipe.nutrition.protein} unit="g"    label="Eiweiß"         color="#A5B4FC" />}
          {recipe.nutrition.calories && <NutritionPill icon={Flame}    value={recipe.nutrition.calories} unit=" kcal" label="Kalorien"       color="#FCA5A5" />}
        </div>

        {/* Diabetes tip */}
        {recipe.diabetesTip && (
          <div className="flex items-start gap-2 bg-white/15 rounded-xl px-3 py-2">
            <Info className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-100">{recipe.diabetesTip}</p>
          </div>
        )}

        <button
          className="w-full py-2.5 rounded-xl bg-white text-sm font-medium transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ color: cornflower }}
        >
          Rezept ansehen
        </button>
      </div>
    </motion.div>
  );
}

// ─── Recipe Card ───────────────────────────────────────────────────────────────

function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  const [fav, setFav] = useState(recipe.favorited);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3 transition-transform active:scale-[0.99]"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={recipe.category} />
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {recipe.time}
          </span>
        </div>
        <button
          onClick={() => setFav((f) => !f)}
          className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center shrink-0"
        >
          <Heart
            className="w-3.5 h-3.5"
            style={{ color: fav ? "#F87171" : "#D1D5DB", fill: fav ? "#F87171" : "none" }}
          />
        </button>
      </div>

      {/* Title & description */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${cornflower}15` }}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" style={{ color: cornflower }} />
          </div>
          <h3 className="text-gray-900 leading-snug">{recipe.title}</h3>
        </div>
        <p className="text-gray-500 text-sm pl-9">{recipe.description}</p>
      </div>

      {/* Nutrition pills */}
      <div className="flex gap-3 pl-9">
        <div
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
          style={{ backgroundColor: `${cornflower}15`, color: cornflower }}
        >
          <Wheat className="w-3 h-3" />
          {recipe.nutrition.carbs}g KH
        </div>
        {recipe.nutrition.fiber && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600">
            <Droplets className="w-3 h-3" />
            {recipe.nutrition.fiber}g Ballaststoffe
          </div>
        )}
        {recipe.nutrition.sugar && !recipe.nutrition.fiber && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-pink-50 text-pink-500">
            <Droplets className="w-3 h-3" />
            {recipe.nutrition.sugar}g Zucker
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end pt-1">
        <button
          className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80"
          style={{ backgroundColor: `${cornflower}15`, color: cornflower }}
        >
          Details
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Diabetes Focus Card ───────────────────────────────────────────────────────

function DiabetesFocusCard() {
  return (
    <div
      className="rounded-2xl p-4 flex gap-3 items-start"
      style={{ background: `linear-gradient(135deg, #EEF3FD, #D6E4FF)` }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: cornflower }}
      >
        <BookOpen className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: cornflower }}>
          Diabetes-Fokus
        </p>
        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
          Alle Rezepte zeigen Kohlenhydrate, Zucker, Ballaststoffe und Eiweiß
          pro Portion, damit du deine Mahlzeiten besser planen kannst.
        </p>
      </div>
    </div>
  );
}

// ─── Add Recipe Card ───────────────────────────────────────────────────────────

function AddRecipeCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4 items-start">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${cornflower}15` }}
      >
        <Plus className="w-5 h-5" style={{ color: cornflower }} />
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-gray-800 font-medium text-sm">Eigenes Rezept hinzufügen</p>
        <p className="text-gray-500 text-xs leading-relaxed">
          Speichere deine Lieblingsgerichte und berechne die Nährwerte pro
          Portion.
        </p>
        <button
          className="text-xs font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80"
          style={{ backgroundColor: `${cornflower}15`, color: cornflower }}
        >
          Rezept hinzufügen
        </button>
      </div>
    </div>
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
        <UtensilsCrossed className="w-8 h-8" style={{ color: cornflower }} />
      </div>
      <div>
        <p className="text-gray-700 font-medium">Keine Rezepte gefunden</p>
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

// ─── Main Component ────────────────────────────────────────────────────────────

export function Recipes() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("Alle");
  const [activeView, setActiveView] = useState<ViewTab>("Alle Rezepte");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return RECIPES.filter((r) => {
      if (activeView === "Favoriten" && !r.favorited) return false;
      if (activeView === "Meine Rezepte") return false; // empty for prototype

      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);

      const matchesFilter =
        activeFilter === "Alle" || r.filterTags.includes(activeFilter);

      return matchesSearch && matchesFilter;
    });
  }, [search, activeFilter, activeView]);

  const featured = filtered.find((r) => r.featured);
  const listRecipes = filtered.filter((r) => !r.featured);

  const clearFilters = () => {
    setSearch("");
    setActiveFilter("Alle");
    setActiveView("Alle Rezepte");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-4">
        <h1 className="text-gray-900">Rezepte</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Diabetesfreundliche Mahlzeiten für stabile Blutzuckerwerte.
        </p>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rezept suchen…"
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

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_CHIPS.map((chip) => {
            const active = chip === activeFilter;
            return (
              <button
                key={chip}
                onClick={() => setActiveFilter(chip)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  active ? "text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                style={active ? { backgroundColor: cornflower } : undefined}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* View toggle */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-xs">
          {VIEW_TABS.map((tab) => {
            const active = tab === activeView;
            return (
              <button
                key={tab}
                onClick={() => setActiveView(tab)}
                className={cn(
                  "flex-1 text-xs py-1.5 rounded-lg font-medium transition-all",
                  active ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
                style={active ? { color: cornflower } : undefined}
              >
                {tab === "Alle Rezepte" ? "Alle" : tab === "Meine Rezepte" ? "Meine" : tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-5 pb-8 space-y-6">
        <AnimatePresence mode="wait">
          {activeView === "Meine Rezepte" ? (
            <motion.div
              key="mine"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-4 text-center"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${cornflower}15` }}
              >
                <Plus className="w-8 h-8" style={{ color: cornflower }} />
              </div>
              <div>
                <p className="text-gray-700 font-medium">Noch keine eigenen Rezepte</p>
                <p className="text-gray-400 text-sm mt-1">
                  Füge dein erstes Rezept hinzu.
                </p>
              </div>
              <button
                className="text-sm font-medium px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: cornflower }}
              >
                Rezept hinzufügen
              </button>
            </motion.div>
          ) : filtered.length === 0 ? (
            <EmptyState key="empty" onClear={clearFilters} />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Featured */}
              {featured && <FeaturedCard recipe={featured} />}

              {/* Diabetes Focus */}
              <DiabetesFocusCard />

              {/* All Recipes */}
              {listRecipes.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-gray-800" style={{ fontSize: "1rem" }}>
                      {activeView === "Favoriten" ? "Favoriten" : "Alle Rezepte"}
                    </h2>
                    <span className="text-xs text-gray-400">
                      {listRecipes.length} Rezepte
                    </span>
                  </div>
                  {listRecipes.map((recipe, i) => (
                    <RecipeCard key={recipe.id} recipe={recipe} index={i} />
                  ))}
                </section>
              )}

              {activeView === "Favoriten" && listRecipes.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-3 text-center"
                >
                  <Heart className="w-10 h-10 text-gray-200" />
                  <p className="text-gray-400 text-sm">
                    Tippe auf das Herz-Icon, um Rezepte zu speichern.
                  </p>
                </motion.div>
              )}

              {/* Add recipe */}
              <AddRecipeCard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
