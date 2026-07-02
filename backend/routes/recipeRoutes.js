import express from "express";

const router = express.Router();

router.get("/api/recipes", (req, res) => {
  res.json([
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
  ]);
});

export default router;