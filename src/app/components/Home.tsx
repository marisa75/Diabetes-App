import { useEffect, useMemo, useState } from "react";
import { getDexcomData } from "../../api/dexcom";
import React from "react";
import { GlucoseChart } from "./GlucoseChart";

type ManualMeasurement = {
  id: string;
  timestamp: string;
  value: number;
  reason: string;
  activity: string;
  notes: string;
};

export function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const [manualMeasurements, setManualMeasurements] = useState<
  ManualMeasurement[]
>([]);

const [showMeasurementForm, setShowMeasurementForm] = useState(false);

const [measurementValue, setMeasurementValue] = useState("");

const [measurementReason, setMeasurementReason] =
  useState("Normal");

const [measurementActivity, setMeasurementActivity] =
  useState("");

const [measurementNotes, setMeasurementNotes] =
  useState("");

const [measurementDate, setMeasurementDate] = useState(
  new Date().toISOString().slice(0, 16)
);

useEffect(() => {
  try {
    const savedMeasurements =
      localStorage.getItem("manualMeasurements");

    if (savedMeasurements) {
      setManualMeasurements(
        JSON.parse(savedMeasurements)
      );
    }
  } catch (err) {
    console.error(
      "Eigene Messungen konnten nicht geladen werden",
      err
    );
  }
}, []);

  // Vorname aus dem gespeicherten Profil laden
  const [vorname, setVorname] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("profileData");
      if (raw) {
        setVorname(JSON.parse(raw).vorname || "");
      }
    } catch (err) {
      console.error("Profil konnte nicht geladen werden", err);
    }
  }, []);
  
  

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Mock-Sensordaten
  const [sensorData, setSensorData] = useState({
    currentGlucose: 125,
    targetRange: { min: 70, max: 180 },
    insulinLevel: 8.2,
    batteryLevel: 87,
    lastUpdate: "vor 2 Minuten",
    trend: "stabil",
  });
  const [sensorConnected, setSensorConnected] = useState(false);
  
  const [glucoseHistory, setGlucoseHistory] = useState<
  {
    time: string;
    value: number;
    source?: "dexcom" | "manual";
    reason?: string;
    activity?: string;
    notes?: string;
  }[]
>([]);

useEffect(() => {
  getDexcomData()
    .then((data) => {
      setSensorData((prev) => ({
        ...prev,
        currentGlucose: data.glucose,
        trend: data.trend,
        lastUpdate: new Date(data.timestamp).toLocaleTimeString(
          "de-DE",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
      }));

      setGlucoseHistory(
        data.history
          .slice()
          .reverse()
          .map((entry: any) => ({
            time: new Date(entry.time).toLocaleTimeString(
              "de-DE",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            ),
            value: entry.value,
          }))
      );
      setSensorConnected(true);
    })
    .catch((err) => {
      console.error(err);
      setSensorConnected(false);
    });
}, []);


// ======================================================
// DEXCOM + MANUELLE MESSUNGEN ZUSAMMENFÜHREN
// ======================================================

const combinedGlucoseHistory = useMemo(() => {
  const dexcomPoints = glucoseHistory.map((point) => ({
    ...point,
    source: "dexcom" as const,
  }));

  const manualPoints = manualMeasurements.map((measurement) => ({
    time: new Date(measurement.timestamp).toLocaleTimeString(
      "de-DE",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ),

    value: measurement.value,

    source: "manual" as const,

    reason: measurement.reason,

    activity: measurement.activity,

    notes: measurement.notes,
  }));

  return [...dexcomPoints, ...manualPoints];
}, [glucoseHistory, manualMeasurements]);


// ======================================================
// STATISTIK
// ======================================================

const averageGlucose =
  combinedGlucoseHistory.length > 0
    ? Math.round(
        combinedGlucoseHistory.reduce(
          (sum, point) => sum + point.value,
          0
        ) / combinedGlucoseHistory.length
      )
    : 0;


const minGlucose =
  combinedGlucoseHistory.length > 0
    ? Math.min(
        ...combinedGlucoseHistory.map((p) => p.value)
      )
    : 0;


const maxGlucose =
  combinedGlucoseHistory.length > 0
    ? Math.max(
        ...combinedGlucoseHistory.map((p) => p.value)
      )
    : 0;


// ======================================================
// TIME IN RANGE
// Zielbereich: 70–180 mg/dL
// ======================================================

const timeInRange =
  combinedGlucoseHistory.length > 0
    ? Math.round(
        (combinedGlucoseHistory.filter(
          (p) => p.value >= 70 && p.value <= 180
        ).length /
          combinedGlucoseHistory.length) *
          100
      )
    : 0;


// ======================================================
// BEWERTUNG TIME IN RANGE
// ======================================================

const tirText =
  timeInRange >= 70
    ? "Sehr gut"
    : timeInRange >= 50
    ? "Gut"
    : "Verbesserungswürdig";

    const handleSaveMeasurement = () => {
      const value = Number(measurementValue);
    
      if (!value || value < 20 || value > 600) {
        alert(
          "Bitte gib einen gültigen Glukosewert zwischen 20 und 600 mg/dL ein."
        );
        return;
      }
    
      const newMeasurement: ManualMeasurement = {
        id: Date.now().toString(),
        timestamp: new Date(measurementDate).toISOString(),
        value,
        reason: measurementReason,
        activity: measurementActivity,
        notes: measurementNotes,
      };
    
      const updatedMeasurements = [
        ...manualMeasurements,
        newMeasurement,
      ];
    
      setManualMeasurements(updatedMeasurements);
    
      localStorage.setItem(
        "manualMeasurements",
        JSON.stringify(updatedMeasurements)
      );
    
      // Formular zurücksetzen
      setMeasurementValue("");
      setMeasurementReason("Normal");
      setMeasurementActivity("");
      setMeasurementNotes("");
      setMeasurementDate(
        new Date().toISOString().slice(0, 16)
      );
    
      setShowMeasurementForm(false);
    };

    const trendMap: Record<string, string> = {
      flat: "→ Stabil",
      singleUp: "↗ Steigend",
      doubleUp: "↑ Stark steigend",
      singleDown: "↘ Fallend",
      doubleDown: "↓ Stark fallend",
    };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex justify-between items-start max-w-screen-lg mx-auto">
          <div className="flex-1">
            <p className="text-gray-600 text-sm">{formatDate(currentTime)}</p>
            <p className="text-2xl font-semibold text-[#6495ED]">{formatTime(currentTime)}</p>
            <p className="text-gray-700 mt-1">Hallo, {vorname || "User"}!</p>
          </div>
          {/* Verbindung zu Dexcom */}
      <button onClick={() => {
    window.location.href =
      "http://localhost:3001/auth/dexcom";
  }}
  className="bg-[#6495ED] text-white px-4 py-2 rounded-lg hover:bg-[#5885DC] transition-colors"
>
  Mit Dexcom verbinden
</button>
        </div>
      </div>

      <div className="flex gap-3">



{/* Sensorstatus */}
<div
  className="flex-1 bg-[#6495ED] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
>
  <div
    className={`w-3 h-3 rounded-full ${
      sensorConnected ? "bg-green-400" : "bg-red-400"
    }`}
  />

  <span className="font-medium">
    {sensorConnected ? "Sensor verbunden" : "Sensor nicht verbunden"}
  </span>
</div>

</div>

      {/* Sensor Data */}
      <div className="p-4 max-w-screen-lg mx-auto">
        <h2 className="text-lg mb-4 text-gray-800">Sensordaten</h2>

        {/* Glucose Level Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-600">Aktueller Glukosewert</span>
            <span className="text-xs text-gray-400">{sensorData.lastUpdate}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-semibold text-[#6495ED]">
              {sensorData.currentGlucose}
            </span>
            <span className="text-xl text-gray-500">mg/dL</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Trend:</span>
            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full">
              {trendMap[sensorData.trend] || sensorData.trend}
            </span>
          </div>
        </div>



<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">








<div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
  <h3 className="mb-4 text-gray-800">
    Tagesstatistik
  </h3>

  <div className="grid grid-cols-2 gap-4">

    <div>
      <p className="text-gray-500 text-sm">
        Durchschnitt
      </p>
      <p className="text-2xl font-semibold">
        {averageGlucose}
      </p>
      <p className="text-sm text-gray-500">
        mg/dL
      </p>
    </div>

    <div>
      <p className="text-gray-500 text-sm">
        Time in Range
      </p>
      <p className="text-2xl font-semibold text-green-600">
        {timeInRange}%
      </p>
      <p className="text-green-600 font-medium">
    {tirText}
  </p>
    </div>

    <div>
      <p className="text-gray-500 text-sm">
        Minimum
      </p>
      <p className="text-2xl font-semibold">
        {minGlucose}
      </p>
      <p className="text-sm text-gray-500">
        mg/dL
      </p>
    </div>

    <div>
      <p className="text-gray-500 text-sm">
        Maximum
      </p>
      <p className="text-2xl font-semibold">
        {maxGlucose}
      </p>
      <p className="text-sm text-gray-500">
        mg/dL
      </p>
    </div>

  </div>
</div>




        {/* Langzeit Glukoseerlauf */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
  <h3 className="mb-4">Glukoseverlauf</h3>

  <GlucoseChart data={combinedGlucoseHistory} />
</div>


        {/* Quick Actions */}
        <div className="mt-6 bg-[#6495ED]/5 border border-[#6495ED]/20 rounded-2xl p-4">
          <p className="text-sm text-gray-600 mb-3">Schnellaktionen</p>
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 bg-white border border-[#6495ED] text-[#6495ED] rounded-lg hover:bg-[#6495ED] hover:text-white transition-colors">
              Insulin verabreichen
            </button>
            <button
  type="button"
  onClick={() => setShowMeasurementForm(true)}
  className="px-4 py-2 bg-white border border-[#6495ED] text-[#6495ED] rounded-lg hover:bg-[#6495ED] hover:text-white transition-colors"
>
  Messung eintragen
</button>
          </div>
        </div>
        {showMeasurementForm && (
  <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
    
    <h3 className="text-lg font-semibold text-gray-800 mb-4">
      Messung eintragen
    </h3>

    <div className="space-y-4">

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Glukosewert (mg/dL)
        </label>

        <input
          type="number"
          value={measurementValue}
          onChange={(e) => setMeasurementValue(e.target.value)}
          placeholder="z. B. 125"
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Zeitpunkt
        </label>

        <input
          type="datetime-local"
          value={measurementDate}
          onChange={(e) => setMeasurementDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Grund / Situation
        </label>

        <select
          value={measurementReason}
          onChange={(e) => setMeasurementReason(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="Normal">Keine besondere Situation</option>
          <option value="Nach dem Essen">Nach dem Essen</option>
          <option value="Vor dem Essen">Vor dem Essen</option>
          <option value="Sport">Sport</option>
          <option value="Krankheit">Krankheit</option>
          <option value="Stress">Stress</option>
          <option value="Medikamente">Medikamente</option>
          <option value="Sonstiges">Sonstiges</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Körperliche Aktivität
        </label>

        <input
          type="text"
          value={measurementActivity}
          onChange={(e) => setMeasurementActivity(e.target.value)}
          placeholder="z. B. 30 Minuten Joggen"
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Notizen
        </label>

        <textarea
          value={measurementNotes}
          onChange={(e) => setMeasurementNotes(e.target.value)}
          placeholder="Weitere Informationen..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div className="flex gap-2">

        <button
          type="button"
          onClick={handleSaveMeasurement}
          className="flex-1 bg-[#6495ED] text-white px-4 py-2 rounded-lg hover:bg-[#5885DC]"
        >
          Messung speichern
        </button>

        <button
          type="button"
          onClick={() => setShowMeasurementForm(false)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600"
        >
          Abbrechen
        </button>

      </div>

    </div>
  </div>
)}
      </div>
    </div>

    </div>

  );
  
}