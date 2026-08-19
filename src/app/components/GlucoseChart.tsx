import React, { useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceArea,
  Tooltip,
} from "recharts";

type GlucosePoint = {
  time: string;
  value: number;
  source?: "dexcom" | "manual";
  reason?: string;
  activity?: string;
  notes?: string;
};

const DEXCOM_COLOR = "#6495ED";
const MANUAL_COLOR = "#F59E0B";
const Y_AXIS_WIDTH = 40;
const CHART_MARGIN = { top: 10, right: 10, left: 0, bottom: 5 };

export function GlucoseChart({
  data,
}: {
  data: GlucosePoint[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Beim Laden/Aktualisieren der Daten direkt an den aktuellen Rand (rechts) scrollen,
  // damit standardmäßig der neueste Wert sichtbar ist statt der älteste.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollLeft = el.scrollWidth;
    }
  }, [data]);

  // Mehr Platz pro Messpunkt, damit der Verlauf nicht gequetscht wirkt –
  // dafür wird der Graph breiter als die Karte und horizontal scrollbar.
  const chartWidth = Math.max(600, data.length * 5);

  return (
    <div>
      {/* Legende */}
      <div className="flex items-center gap-4 mb-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: DEXCOM_COLOR }}
          />
          Automatisch (Dexcom)
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full border-2"
            style={{ backgroundColor: "#ffffff", borderColor: MANUAL_COLOR }}
          />
          Eigene Messung
        </div>
        <span className="ml-auto text-gray-400">← scrollen →</span>
      </div>

      <div className="flex">
        {/* Fixierte Y-Achse, bleibt beim horizontalen Scrollen stehen */}
        <div style={{ width: Y_AXIS_WIDTH, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={CHART_MARGIN}>
              <XAxis
                dataKey="time"
                height={30}
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[60, 250]}
                tick={{ fontSize: 11 }}
                width={Y_AXIS_WIDTH}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div ref={scrollRef} className="overflow-x-auto flex-1">
    <ResponsiveContainer width={chartWidth} height={320}>
      <LineChart
        data={data}
        margin={CHART_MARGIN}
      >
        {/* Time in Range: 70–180 mg/dL */}
        <ReferenceArea
          y1={70}
          y2={180}
          fill="#22c55e"
          fillOpacity={0.08}
          label={{
            value: "Zielbereich 70–180",
            position: "insideTopLeft",
            fill: "#16a34a",
            fontSize: 12,
          }}
        />

        <XAxis
          dataKey="time"
          height={30}
          tick={{ fontSize: 11 }}
          minTickGap={20}
        />

        <YAxis
          domain={[60, 250]}
          hide
          width={0}
        />

        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) {
              return null;
            }

            const point = payload[0].payload as GlucosePoint;

            return (
              <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3">
                <p className="font-semibold text-gray-800">
                  {point.value} mg/dL
                </p>

                <p className="text-sm text-gray-500">
                  {point.time}
                </p>

                {point.source === "manual" && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p
                      className="text-sm font-medium"
                      style={{ color: MANUAL_COLOR }}
                    >
                      ● Eigene Messung
                    </p>

                    {point.reason && (
                      <p className="text-sm text-gray-600">
                        Grund: {point.reason}
                      </p>
                    )}

                    {point.activity && (
                      <p className="text-sm text-gray-600">
                        Aktivität: {point.activity}
                      </p>
                    )}

                    {point.notes && (
                      <p className="text-sm text-gray-600">
                        Notiz: {point.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          }}
        />

        <Line
          type="monotone"
          dataKey="value"
          stroke={DEXCOM_COLOR}
          strokeWidth={3}
          isAnimationActive={false}
          dot={(props: any) => {
            const { cx, cy, payload, index } = props;

            if (payload?.source === "manual") {
              return (
                <circle
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill={MANUAL_COLOR}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              );
            }

            return <React.Fragment key={`dot-${index}`} />;
          }}
        />
      </LineChart>
    </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}