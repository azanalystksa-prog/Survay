"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
  Legend,
} from "recharts";

const GREEN = "#0A8043";
const GOLD = "#C8941E";
const LINE = "#E3ECE6";

export function SimpleBarChart({
  data,
  xKey,
  yKey,
  color = GREEN,
  height = 240,
}: {
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#5E6F65" }} tickLine={false} axisLine={{ stroke: LINE }} />
        <YAxis tick={{ fontSize: 11, fill: "#5E6F65" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 12 }} />
        <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GroupedComparisonChart({
  data,
  height = 240,
}: {
  data: { name: string; collected: number; planned: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5E6F65" }} tickLine={false} axisLine={{ stroke: LINE }} />
        <YAxis tick={{ fontSize: 11, fill: "#5E6F65" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="planned" name="Planned" fill={LINE} radius={[6, 6, 0, 0]} />
        <Bar dataKey="collected" name="Collected" fill={GREEN} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleLineChart({
  data,
  xKey,
  yKey,
  height = 220,
}: {
  data: any[];
  xKey: string;
  yKey: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#5E6F65" }} tickLine={false} axisLine={{ stroke: LINE }} />
        <YAxis tick={{ fontSize: 11, fill: "#5E6F65" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 12 }} />
        <Line type="monotone" dataKey={yKey} stroke={GREEN} strokeWidth={2.5} dot={{ r: 3, fill: GOLD }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DistributionBar({ data, height = 200 }: { data: { label: string; count: number }[]; height?: number }) {
  const colors = [GREEN, "#0FA255", GOLD, "#2E6F8E", "#5E6F65"];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={LINE} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5E6F65" }} tickLine={false} axisLine={{ stroke: LINE }} />
        <YAxis tick={{ fontSize: 11, fill: "#5E6F65" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 12 }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
