import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import dexcomRoutes from "./routes/dexcomRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import logmealRoutes from "./routes/logmealRoutes.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "50mb",
  })
);

app.get("/", (req, res) => {
  res.json({
    status: "Backend läuft 🚀",
  });
});

// Routen
app.use(dexcomRoutes);
app.use(recipeRoutes);
app.use(logmealRoutes);

// Server starten
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});