import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getRecipes, createRecipe } from "../../api/recipes";
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

// Auswählbare Tags im "Eigenes Rezept hinzufügen"-Formular (ohne "Alle")
const SELECTABLE_TAGS = FILTER_CHIPS.filter((c) => c !== "Alle") as Exclude<
  FilterChip,
  "Alle"
>[];

const CATEGORY_OPTIONS = [
  "Frühstück",
  "Mittagessen",
  "Abendessen",
  "Snack",
] as const;

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
  isMine?: boolean;
  ingredients?: string[];
  steps?: string[];
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
    ingredients: [
      "150 g Hähnchenbrust",
      "1 Zucchini",
      "1 Paprika",
      "100 g Kirschtomaten",
      "50 g Feta",
      "1 EL Olivenöl",
      "Saft von 1/2 Zitrone",
      "Salz, Pfeffer, Oregano",
    ],
    steps: [
      "Hähnchenbrust würzen und in einer Pfanne mit etwas Olivenöl goldbraun braten.",
      "Zucchini und Paprika in mundgerechte Stücke schneiden und kurz mit anbraten.",
      "Kirschtomaten halbieren und Feta würfeln.",
      "Alles in einer Schüssel anrichten, mit Zitronensaft und Olivenöl beträufeln.",
      "Mit Salz, Pfeffer und Oregano abschmecken und servieren.",
    ],
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
    ingredients: [
      "50 g Haferflocken",
      "150 ml Milch oder Pflanzendrink",
      "100 g gemischte Beeren",
      "100 g Naturjoghurt",
      "1 TL Honig (optional)",
    ],
    steps: [
      "Haferflocken mit Milch in einem Topf oder der Mikrowelle kurz erwärmen.",
      "Joghurt unterrühren.",
      "Mit frischen oder aufgetauten Beeren toppen.",
      "Nach Belieben mit etwas Honig beträufeln.",
    ],
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
    ingredients: [
      "150 g gekochte Linsen",
      "50 g Feta",
      "1/2 Salatgurke",
      "1 kleine rote Zwiebel",
      "1 EL Olivenöl",
      "1 EL Essig",
      "Salz, Pfeffer",
    ],
    steps: [
      "Linsen abtropfen lassen und in eine Schüssel geben.",
      "Gurke und Zwiebel klein würfeln und dazugeben.",
      "Feta zerbröckeln und untermengen.",
      "Mit Olivenöl, Essig, Salz und Pfeffer abschmecken.",
    ],
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
    ingredients: [
      "2 Zucchini",
      "200 g passierte Tomaten",
      "1 Knoblauchzehe",
      "1 EL Olivenöl",
      "Frisches Basilikum",
      "Salz, Pfeffer",
    ],
    steps: [
      "Zucchini mit einem Spiralschneider zu \"Nudeln\" verarbeiten.",
      "Knoblauch in Olivenöl andünsten, passierte Tomaten dazugeben und köcheln lassen.",
      "Mit Salz, Pfeffer und Basilikum würzen.",
      "Zucchini-Nudeln kurz in der Sauce erwärmen und servieren.",
    ],
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
    ingredients: [
      "200 g Magerquark",
      "1 Apfel",
      "1/2 TL Zimt",
      "1 TL Honig (optional)",
    ],
    steps: [
      "Apfel waschen, entkernen und fein raspeln oder würfeln.",
      "Quark mit Zimt verrühren.",
      "Apfelstücke unterheben.",
      "Nach Belieben mit Honig süßen.",
    ],
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

function FeaturedCard({
  recipe,
  onDetails,
}: {
  recipe: Recipe;
  onDetails: (recipe: Recipe) => void;
}) {
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
          onClick={() => onDetails(recipe)}
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

function RecipeCard({
  recipe,
  index,
  onDetails,
}: {
  recipe: Recipe;
  index: number;
  onDetails: (recipe: Recipe) => void;
}) {
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
          {recipe.isMine && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500">
              Eigenes Rezept
            </span>
          )}
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
          onClick={() => onDetails(recipe)}
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

function AddRecipeCard({ onAdd }: { onAdd: () => void }) {
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
          onClick={onAdd}
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

// ─── Recipe Detail Modal ────────────────────────────────────────────────────────

function RecipeDetailModal({
  recipe,
  onClose,
}: {
  recipe: Recipe;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* Header image / gradient */}
        <div
          className="px-5 pt-5 pb-4 sticky top-0 z-10"
          style={{ background: `linear-gradient(135deg, #4A7FD4 0%, #6495ED 60%, #89B4F7 100%)` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
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
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-gray-600 text-sm leading-relaxed">{recipe.description}</p>

          {/* Nutrition */}
          <div>
            <p className="text-sm font-medium text-gray-800 mb-2">Nährwerte pro Portion</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-wrap justify-between gap-3">
              <NutritionPill icon={Wheat}    value={recipe.nutrition.carbs}   unit="g"    label="Kohlenhydrate" color={cornflower} />
              {recipe.nutrition.fiber    !== undefined && <NutritionPill icon={Droplets} value={recipe.nutrition.fiber}   unit="g"    label="Ballaststoffe" color="#10B981" />}
              {recipe.nutrition.sugar    !== undefined && <NutritionPill icon={Droplets} value={recipe.nutrition.sugar}   unit="g"    label="Zucker"        color="#EC4899" />}
              {recipe.nutrition.protein  !== undefined && <NutritionPill icon={Dumbbell} value={recipe.nutrition.protein} unit="g"    label="Eiweiß"        color="#6366F1" />}
              {recipe.nutrition.fat      !== undefined && <NutritionPill icon={Droplets} value={recipe.nutrition.fat}     unit="g"    label="Fett"          color="#F59E0B" />}
              {recipe.nutrition.calories !== undefined && <NutritionPill icon={Flame}    value={recipe.nutrition.calories} unit=" kcal" label="Kalorien"     color="#EF4444" />}
            </div>
          </div>

          {/* Diabetes tip */}
          {recipe.diabetesTip && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: `${cornflower}10` }}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: cornflower }} />
              <p className="text-xs text-gray-600 leading-relaxed">{recipe.diabetesTip}</p>
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">Zutaten</p>
              <ul className="space-y-1.5">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: cornflower }}
                    />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Steps */}
          {recipe.steps && recipe.steps.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">Zubereitung</p>
              <ol className="space-y-3">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 mt-0.5"
                      style={{ backgroundColor: cornflower }}
                    >
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Tags */}
          {recipe.filterTags.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">Passt zu</p>
              <div className="flex flex-wrap gap-2">
                {recipe.filterTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Add Recipe Modal ────────────────────────────────────────────────────────────

interface NewRecipeForm {
  title: string;
  category: (typeof CATEGORY_OPTIONS)[number];
  time: string;
  description: string;
  carbs: string;
  fiber: string;
  sugar: string;
  calories: string;
  protein: string;
  tags: FilterChip[];
  ingredients: string[];
  steps: string[];
}

const EMPTY_FORM: NewRecipeForm = {
  title: "",
  category: "Mittagessen",
  time: "",
  description: "",
  carbs: "",
  fiber: "",
  sugar: "",
  calories: "",
  protein: "",
  tags: [],
  ingredients: [""],
  steps: [""],
};

function AddRecipeModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (recipe: {
    title: string;
    category: string;
    time: string;
    description: string;
    nutrition: {
      carbs: number;
      fiber?: number;
      sugar?: number;
      calories?: number;
      protein?: number;
    };
    filterTags: FilterChip[];
    ingredients: string[];
    steps: string[];
  }) => Promise<void>;
}) {
  const [form, setForm] = useState<NewRecipeForm>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: FilterChip) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const updateListItem = (
    field: "ingredients" | "steps",
    index: number,
    value: string
  ) => {
    setForm((f) => {
      const list = [...f[field]];
      list[index] = value;
      return { ...f, [field]: list };
    });
  };

  const addListItem = (field: "ingredients" | "steps") => {
    setForm((f) => ({ ...f, [field]: [...f[field], ""] }));
  };

  const removeListItem = (field: "ingredients" | "steps", index: number) => {
    setForm((f) => {
      const list = f[field].filter((_, i) => i !== index);
      return { ...f, [field]: list.length > 0 ? list : [""] };
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Bitte gib einen Titel ein.");
      return;
    }
    if (!form.carbs.trim() || isNaN(Number(form.carbs))) {
      setError("Bitte gib Kohlenhydrate (in g) als Zahl ein.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await onSave({
        title: form.title.trim(),
        category: form.category,
        time: form.time.trim() || "—",
        description: form.description.trim() || "Eigenes Rezept.",
        nutrition: {
          carbs: Number(form.carbs),
          fiber: form.fiber ? Number(form.fiber) : undefined,
          sugar: form.sugar ? Number(form.sugar) : undefined,
          calories: form.calories ? Number(form.calories) : undefined,
          protein: form.protein ? Number(form.protein) : undefined,
        },
        filterTags: form.tags,
        ingredients: form.ingredients.map((i) => i.trim()).filter(Boolean),
        steps: form.steps.map((s) => s.trim()).filter(Boolean),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Rezept konnte nicht gespeichert werden."
      );
      setSaving(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-gray-900">Eigenes Rezept hinzufügen</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Titel *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="z. B. Gemüse-Omelett"
              className="rounded-xl border-gray-200"
            />
          </div>

          {/* Category + time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Kategorie</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as NewRecipeForm["category"] }))
                }
                className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Zubereitungszeit</label>
              <Input
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                placeholder="z. B. 15 Min."
                className="rounded-xl border-gray-200"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Kurze Beschreibung des Gerichts…"
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* Nutrition */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Nährwerte pro Portion
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={form.carbs}
                onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))}
                placeholder="Kohlenhydrate (g) *"
                inputMode="numeric"
                className="rounded-xl border-gray-200"
              />
              <Input
                value={form.fiber}
                onChange={(e) => setForm((f) => ({ ...f, fiber: e.target.value }))}
                placeholder="Ballaststoffe (g)"
                inputMode="numeric"
                className="rounded-xl border-gray-200"
              />
              <Input
                value={form.sugar}
                onChange={(e) => setForm((f) => ({ ...f, sugar: e.target.value }))}
                placeholder="Zucker (g)"
                inputMode="numeric"
                className="rounded-xl border-gray-200"
              />
              <Input
                value={form.protein}
                onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
                placeholder="Eiweiß (g)"
                inputMode="numeric"
                className="rounded-xl border-gray-200"
              />
              <Input
                value={form.calories}
                onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
                placeholder="Kalorien (kcal)"
                inputMode="numeric"
                className="rounded-xl border-gray-200 col-span-2"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            <div className="flex flex-wrap gap-2">
              {SELECTABLE_TAGS.map((tag) => {
                const active = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      active ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                    style={active ? { backgroundColor: cornflower } : undefined}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Zutaten</label>
            <div className="space-y-2">
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={ing}
                    onChange={(e) => updateListItem("ingredients", i, e.target.value)}
                    placeholder={`z. B. 150 g Hähnchenbrust`}
                    className="rounded-xl border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeListItem("ingredients", i)}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addListItem("ingredients")}
                className="inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: cornflower }}
              >
                <Plus className="w-3.5 h-3.5" />
                Zutat hinzufügen
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Zubereitungsschritte</label>
            <div className="space-y-2">
              {form.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                    style={{ backgroundColor: cornflower }}
                  >
                    {i + 1}
                  </span>
                  <textarea
                    value={step}
                    onChange={(e) => updateListItem("steps", i, e.target.value)}
                    placeholder={`z. B. Zutaten in der Pfanne anbraten…`}
                    rows={1}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeListItem("steps", i)}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addListItem("steps")}
                className="inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: cornflower }}
              >
                <Plus className="w-3.5 h-3.5" />
                Schritt hinzufügen
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: cornflower }}
          >
            {saving ? "Wird gespeichert…" : "Rezept speichern"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function Recipes() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("Alle");
  const [activeView, setActiveView] = useState<ViewTab>("Alle Rezepte");

  const [recipes, setRecipes] = useState<Recipe[]>(RECIPES);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await getRecipes();
        // Backend liefert jetzt auch eigene, bereits gespeicherte Rezepte mit
        setRecipes(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadRecipes();
  }, []);

  const handleAddRecipe = async (recipe: {
    title: string;
    category: string;
    time: string;
    description: string;
    nutrition: {
      carbs: number;
      fiber?: number;
      sugar?: number;
      calories?: number;
      protein?: number;
    };
    filterTags: FilterChip[];
    ingredients: string[];
    steps: string[];
  }) => {
    const saved = await createRecipe(recipe);
    setRecipes((prev) => [...prev, { ...saved, isMine: true }]);
    setShowAddModal(false);
    setActiveView("Meine Rezepte");
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return recipes.filter((r) => {
      if (activeView === "Favoriten" && !r.favorited) return false;
      if (activeView === "Meine Rezepte" && !r.isMine) return false;

      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);

      const matchesFilter =
        activeFilter === "Alle" || r.filterTags.includes(activeFilter);

      return matchesSearch && matchesFilter;
    });
  }, [search, activeFilter, activeView, recipes]);

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
          {activeView === "Meine Rezepte" && listRecipes.length === 0 && !featured ? (
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
                onClick={() => setShowAddModal(true)}
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
              {featured && <FeaturedCard recipe={featured} onDetails={setSelectedRecipe} />}

              {/* Diabetes Focus */}
              <DiabetesFocusCard />

              {/* All Recipes */}
              {listRecipes.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-gray-800" style={{ fontSize: "1rem" }}>
                      {activeView === "Favoriten"
                        ? "Favoriten"
                        : activeView === "Meine Rezepte"
                        ? "Meine Rezepte"
                        : "Alle Rezepte"}
                    </h2>
                    <span className="text-xs text-gray-400">
                      {listRecipes.length} Rezepte
                    </span>
                  </div>
                  {listRecipes.map((recipe, i) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      index={i}
                      onDetails={setSelectedRecipe}
                    />
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
              <AddRecipeCard onAdd={() => setShowAddModal(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetailModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
        {showAddModal && (
          <AddRecipeModal
            onClose={() => setShowAddModal(false)}
            onSave={handleAddRecipe}
          />
        )}
      </AnimatePresence>
    </div>
  );
}