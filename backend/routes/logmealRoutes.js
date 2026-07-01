import express from "express";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const router = express.Router();

router.post("/api/analyze-food", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

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

    const topResult =
      segResponse.data.segmentation_results?.[0]?.recognition_results?.[0];

    const allDishes = segResponse.data.segmentation_results
      ?.map((seg) => seg.recognition_results?.[0]?.name)
      .filter(Boolean)
      .join(", ");

    const nutriResponse = await axios.post(
      "https://api.logmeal.com/v2/nutrition/recipe/nutritionalInfo",
      { imageId },
      {
        headers: {
          Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const ingrResponse = await axios.post(
      "https://api.logmeal.com/v2/nutrition/recipe/ingredients",
      { imageId },
      {
        headers: {
          Authorization: `Bearer ${process.env.LOGMEAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const totalNutrients =
      nutriResponse.data.nutritional_info?.totalNutrients;

    const calories =
      nutriResponse.data.nutritional_info?.calories ?? 0;

    const carbs =
      totalNutrients?.CHOCDF?.quantity ?? 0;

    const sugar =
      totalNutrients?.SUGAR?.quantity ?? 0;

    const fiber =
      totalNutrients?.FIBTG?.quantity ?? 0;

    const protein =
      totalNutrients?.PROCNT?.quantity ?? 0;

    const fat =
      totalNutrients?.FAT?.quantity ?? 0;

    const be =
      Math.round((carbs / 12) * 10) / 10;

    const items =
      ingrResponse.data.recipe_per_item ||
      ingrResponse.data.recipe ||
      [];

    res.json({
      meal: allDishes ?? topResult?.name ?? "Unbekannte Mahlzeit",

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
        weight:
          ing.measure?.metric?.quantity ||
          ing.weight ||
          100,
        unit:
          ing.measure?.metric?.short ||
          ing.unit ||
          "g",
      })),
    });
  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).json({
      error: "LogMeal Analyse fehlgeschlagen",
    });
  }
});

export default router;