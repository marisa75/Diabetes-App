import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { getDexcomLoginUrl } from "./dexcom.js";
import FormData from "form-data";
import fs from "fs";

dotenv.config();

const app = express();
let dexcomToken = null;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.json({
    status: "Dexcom Backend läuft 🚀",
  });
});

app.get("/auth/dexcom", (req, res) => {
  res.redirect(getDexcomLoginUrl());
});

app.post("/auth/dexcom/token", async (req, res) => {
  try {
    const { code } = req.body;

    const params = new URLSearchParams({
      client_id: process.env.DEXCOM_CLIENT_ID,
      client_secret: process.env.DEXCOM_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.DEXCOM_REDIRECT_URI,
    });

    const response = await axios.post(
      "https://sandbox-api.dexcom.com/v2/oauth2/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("TOKEN:");
    console.log(response.data);

    dexcomToken = response.data.access_token;
    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).json({
      error: "Token Request fehlgeschlagen",
    });
  }
});

app.get("/api/recipes", (req, res) => {
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
      filterTags: ["Frühstück", "Viel Ballaststoffe", "Schnell", "Vegetarisch"],
      favorited: true,
    },
    {
      id: "3",
      title: "Linsensalat mit Feta",
      category: "Mittagessen",
      time: "20 Min.",
      description: "Protein- und ballaststoffreicher Salat für lange Sättigung.",
      nutrition: {
        carbs: 28,
        fiber: 11,
      },
      filterTags: ["Mittagessen", "Viel Ballaststoffe", "Vegetarisch"],
      favorited: false,
    },
    {
      id: "4",
      title: "Zucchini-Nudeln mit Tomatensauce",
      category: "Abendessen",
      time: "25 Min.",
      description: "Leichte Low-Carb-Alternative zu klassischer Pasta.",
      nutrition: {
        carbs: 18,
        fiber: 6,
      },
      filterTags: ["Abendessen", "Low Carb", "Vegetarisch"],
      favorited: false,
    },
    {
      id: "5",
      title: "Apfel-Zimt-Quark",
      category: "Snack",
      time: "5 Min.",
      description: "Schneller Snack mit Eiweiß und natürlicher Süße.",
      nutrition: {
        carbs: 20,
        sugar: 14,
      },
      filterTags: ["Snacks", "Schnell", "Vegetarisch"],
      favorited: true,
    },
  ]);
});

app.get("/api/glucose/latest", async (req, res) => {
  try {
    if (!dexcomToken) {
      return res.status(401).json({
        error: "Nicht mit Dexcom verbunden",
      });
    }

    const endDate = new Date().toISOString().split(".")[0];

    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split(".")[0];

    console.log("startDate =", startDate);
    console.log("endDate =", endDate);

    const response = await axios.get(
      "https://sandbox-api.dexcom.com/v3/users/self/egvs",
      {
        headers: {
          Authorization: `Bearer ${dexcomToken}`,
        },
        params: {
          startDate,
          endDate,
        },
      }
    );

    const records = response.data.records;
    const latest = records[0];

    res.json({
      glucose: latest.value,
      trend: latest.trend,
      timestamp: latest.displayTime,
      history: records.map((r) => ({
        time: r.displayTime,
        value: r.value,
      })),
    });
  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).json({
      error: "Glukosedaten konnten nicht geladen werden",
    });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server läuft auf Port ${process.env.PORT || 3001}`);
  app.post("/api/analyze-food", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    console.log("Bildgröße:", imageBase64?.length); // ← neu

    // Schritt 1: Segmentation
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const tempPath = "/tmp/food_temp.jpg";
    fs.writeFileSync(tempPath, imageBuffer);

    const form = new FormData();
    form.append("image", fs.createReadStream(tempPath));

    const segResponse = await axios.post(
      "https://api.logmeal.com/v2/image/segmentation/complete",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    fs.unlinkSync(tempPath);
    const imageId = segResponse.data.imageId;
    const topResult = segResponse.data.segmentation_results?.[0]?.recognition_results?.[0];

    // Schritt 2: Nährwerte
    const nutriResponse = await axios.post(
      "https://api.logmeal.com/v2/nutrition/recipe/nutritionalInfo",
      { imageId },
      {
        headers: {
          Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    // Schritt 3: Zutaten
    const ingrResponse = await axios.post(
      "https://api.logmeal.com/v2/nutrition/recipe/ingredients",
      { imageId },
      {
        headers: {
          Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const totalNutrients = nutriResponse.data.nutritional_info?.totalNutrients;
    const calories = nutriResponse.data.nutritional_info?.calories ?? 0;
    const carbs = totalNutrients?.CHOCDF?.quantity ?? 0;
    const sugar = totalNutrients?.SUGAR?.quantity ?? 0;
    const fiber = totalNutrients?.FIBTG?.quantity ?? 0;
    const protein = totalNutrients?.PROCNT?.quantity ?? 0;
    const fat = totalNutrients?.FAT?.quantity ?? 0;
    const be = Math.round((carbs / 12) * 10) / 10;

    const items = ingrResponse.data.recipe_per_item || ingrResponse.data.recipe || [];

    res.json({
      meal: topResult?.name ?? "Unbekannte Mahlzeit",
      confidence: Math.round((topResult?.prob ?? 0) * 100),
      diabetes: {
        carbs: Math.round(carbs * 10) / 10,
        sugar: Math.round(sugar * 10) / 10,
        fiber: Math.round(fiber * 10) / 10,
        be,
        calories: Math.round(calories),
      },
      full: {
        protein: Math.round(protein * 10) / 10,
        fat: Math.round(fat * 10) / 10,
      },
      ingredients: items.map((ing, i) => ({
        id: String(i),
        name: ing.name,
        weight: ing.measure?.metric?.quantity || ing.weight || 100,
        unit: ing.measure?.metric?.short || ing.unit || "g",
      })),
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "LogMeal Analyse fehlgeschlagen" });
  }
});
});