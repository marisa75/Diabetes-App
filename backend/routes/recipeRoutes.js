import express from "express";

const router = express.Router();

// ─── In-Memory "Datenbank" ──────────────────────────────────────────────────
// Läuft nur im Arbeitsspeicher des Servers. Bei einem Neustart des Backends
// (z. B. `npm run dev` neu gestartet) gehen neu hinzugefügte Rezepte verloren.
// Die Standard-Rezepte unten bleiben aber immer erhalten.

let recipes = [
  {
    id: "featured",
    title: "Mediterrane Gemüse-Bowl mit Hähnchen",
    category: "Mittagessen",
    time: "25 Min.",
    difficulty: "Einfach",
    description:
      "Eine ausgewogene Mahlzeit mit viel Gemüse, Eiweiß und moderaten Kohlenhydraten.",
    nutrition: {
      carbs: 38,
      sugar: 7,
      fiber: 9,
      calories: 520,
      protein: 35,
      fat: 18,
    },
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
    nutrition: {
      carbs: 32,
      fiber: 8,
    },
    filterTags: [
      "Frühstück",
      "Viel Ballaststoffe",
      "Schnell",
      "Vegetarisch",
    ],
    favorited: true,
  },
  {
    id: "3",
    title: "Linsensalat mit Feta",
    category: "Mittagessen",
    time: "20 Min.",
    description:
      "Protein- und ballaststoffreicher Salat für lange Sättigung.",
    nutrition: {
      carbs: 28,
      fiber: 11,
    },
    filterTags: [
      "Mittagessen",
      "Viel Ballaststoffe",
      "Vegetarisch",
    ],
    favorited: false,
  },
  {
    id: "4",
    title: "Zucchini-Nudeln mit Tomatensauce",
    category: "Abendessen",
    time: "25 Min.",
    description:
      "Leichte Low-Carb-Alternative zu klassischer Pasta.",
    nutrition: {
      carbs: 18,
      fiber: 6,
    },
    filterTags: [
      "Abendessen",
      "Low Carb",
      "Vegetarisch",
    ],
    favorited: false,
  },
  {
    id: "5",
    title: "Apfel-Zimt-Quark",
    category: "Snack",
    time: "5 Min.",
    description:
      "Schneller Snack mit Eiweiß und natürlicher Süße.",
    nutrition: {
      carbs: 20,
      sugar: 14,
    },
    filterTags: [
      "Snacks",
      "Schnell",
      "Vegetarisch",
    ],
    favorited: true,
  },
];

// ─── GET: alle Rezepte abrufen ──────────────────────────────────────────────

router.get("/api/recipes", (req, res) => {
  res.json(recipes);
});

// ─── POST: neues Rezept hinzufügen ──────────────────────────────────────────

router.post("/api/recipes", (req, res) => {
  const { title, category, time, description, nutrition, filterTags } =
    req.body;

  // Einfache Validierung
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Titel ist erforderlich." });
  }
  if (!nutrition || typeof nutrition.carbs !== "number") {
    return res
      .status(400)
      .json({ error: "Kohlenhydrate (nutrition.carbs) sind erforderlich." });
  }

  const newRecipe = {
    id: `own-${Date.now()}`,
    title: title.trim(),
    category: category || "Mittagessen",
    time: time || "—",
    description: description || "Eigenes Rezept.",
    nutrition,
    filterTags: Array.isArray(filterTags) ? filterTags : [],
    favorited: false,
    isMine: true,
  };

  recipes.push(newRecipe);

  res.status(201).json(newRecipe);
});

// ─── DELETE: eigenes Rezept löschen ─────────────────────────────────────────

router.delete("/api/recipes/:id", (req, res) => {
  const { id } = req.params;
  const index = recipes.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Rezept nicht gefunden." });
  }

  recipes.splice(index, 1);
  res.status(204).send();
});

export default router;