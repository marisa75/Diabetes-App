import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { getDexcomLoginUrl } from "./dexcom.js";


dotenv.config();

const app = express();
let dexcomToken = null;

app.use(cors());
app.use(express.json());

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
    console.error(
      err.response?.data || err.message
    );

    res.status(500).json({
      error: "Token Request fehlgeschlagen",
    });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(
    `Server läuft auf Port ${process.env.PORT || 3001}`
  );
});

app.get("/api/glucose/latest", async (req, res) => {
    try {
      if (!dexcomToken) {
        return res.status(401).json({
          error: "Nicht mit Dexcom verbunden",
        });
      }
  

    
      const endDate = new Date()
  .toISOString()
  .split(".")[0];

const startDate = new Date(
  Date.now() - 24 * 60 * 60 * 1000
)
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
      console.error(
        err.response?.data || err.message
      );
  
      res.status(500).json({
        error: "Glukosedaten konnten nicht geladen werden",
      });
    }
  });