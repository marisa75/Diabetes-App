import { useEffect, useState } from "react";
import { getDexcomData } from "../../api/dexcom";
import React from "react";
import { User } from "lucide-react";
import { GlucoseChart } from "./GlucoseChart";

export function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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
  
  const [glucoseHistory, setGlucoseHistory] = useState<
  { time: string; value: number }[]
>([]);

const averageGlucose =
  glucoseHistory.length > 0
    ? Math.round(
        glucoseHistory.reduce(
          (sum, point) => sum + point.value,
          0
        ) / glucoseHistory.length
      )
    : 0;

const minGlucose =
  glucoseHistory.length > 0
    ? Math.min(
        ...glucoseHistory.map((p) => p.value)
      )
    : 0;

const maxGlucose =
  glucoseHistory.length > 0
    ? Math.max(
        ...glucoseHistory.map((p) => p.value)
      )
    : 0;

const timeInRange =
  glucoseHistory.length > 0
    ? Math.round(
        (glucoseHistory.filter(
          (p) => p.value >= 70 && p.value <= 180
        ).length /
          glucoseHistory.length) *
          100
      )
    : 0;



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
      })
      .catch(console.error);
  }, []);

  const trendMap: Record<string, string> = {
    flat: "→ Stabil",
    singleUp: "↗ Steigend",
    doubleUp: "↑ Stark steigend",
    singleDown: "↘ Fallend",
    doubleDown: "↓ Stark fallend",
  };

  const tirText =
  timeInRange >= 70
    ? "Sehr gut"
    : timeInRange >= 50
    ? "Gut"
    : "Verbesserungswürdig";

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex justify-between items-start max-w-screen-lg mx-auto">
          <div className="flex-1">
            <p className="text-gray-600 text-sm">{formatDate(currentTime)}</p>
            <p className="text-2xl font-semibold text-[#6495ED]">{formatTime(currentTime)}</p>
            <p className="text-gray-700 mt-1">Hallo, User!</p>
          </div>
          <button className="bg-[#6495ED] text-white px-4 py-2 rounded-lg hover:bg-[#5885DC] transition-colors">
            <User className="w-5 h-6" />
          </button>
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

        {/* Langzeit Glukoseerlauf */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
  <h3 className="mb-4">Glukoseverlauf</h3>

  <GlucoseChart data={glucoseHistory} />
</div>

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


          {/* Battery Level */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-gray-600 text-sm mb-2">Batterie</p>
            <p className="text-3xl font-semibold text-gray-800">
              {sensorData.batteryLevel}%
            </p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6495ED] rounded-full transition-all"
                style={{ width: `${sensorData.batteryLevel}%` }}
              />
            </div>
          </div>
       

        {/* Quick Actions */}
        <div className="mt-6 bg-[#6495ED]/5 border border-[#6495ED]/20 rounded-2xl p-4">
          <p className="text-sm text-gray-600 mb-3">Schnellaktionen</p>
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 bg-white border border-[#6495ED] text-[#6495ED] rounded-lg hover:bg-[#6495ED] hover:text-white transition-colors">
              Insulin verabreichen
            </button>
            <button className="px-4 py-2 bg-white border border-[#6495ED] text-[#6495ED] rounded-lg hover:bg-[#6495ED] hover:text-white transition-colors">
              Messung eintragen
            </button>
          </div>
        </div>
      </div>
    </div>



  );
  
}
