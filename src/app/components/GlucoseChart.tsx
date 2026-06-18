import React from "react";
import {
    LineChart,
    Line,
    ResponsiveContainer,
    XAxis,
    YAxis,
  } from "recharts";
  
  export function GlucoseChart({
    data,
  }: {
    data: { time: string; value: number }[];
  }) {
    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="time" />
          <YAxis domain={[60, 250]} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6495ED"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }