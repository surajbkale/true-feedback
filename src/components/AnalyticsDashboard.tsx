"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader2, MessageSquare, TrendingUp, Calendar } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayData {
  date: string; // "YYYY-MM-DD"
  count: number;
}

interface HourData {
  hour: number; // 0–23
  count: number;
}

interface Stats {
  total: number;
  last7Days: number;
  last30Days: number;
  byDay: DayData[];
  byHour: HourData[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00"); // avoid UTC offset shift
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string; // tailwind background class
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-indigo-600 font-semibold">{payload[0]?.value} messages</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Stats }>(
        "/api/messages/stats"
      );
      setStats(res.data.data);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm">Loading analytics…</p>
      </div>
    );
  }

  if (!stats) return null;

  // Prepare chart data
  const dayChartData = stats.byDay.map((d) => ({
    date: formatDate(d.date),
    count: d.count,
  }));

  const hourChartData = stats.byHour.map((h) => ({
    hour: formatHour(h.hour),
    count: h.count,
  }));

  const hasAnyMessages = stats.total > 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total messages"
          value={stats.total}
          icon={<MessageSquare className="h-5 w-5 text-indigo-600" />}
          accent="bg-indigo-50"
        />
        <StatCard
          label="Last 7 days"
          value={stats.last7Days}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          accent="bg-emerald-50"
        />
        <StatCard
          label="Last 30 days"
          value={stats.last30Days}
          icon={<Calendar className="h-5 w-5 text-amber-600" />}
          accent="bg-amber-50"
        />
      </div>

      {!hasAnyMessages ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No messages yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Share your link to start receiving anonymous messages
          </p>
        </div>
      ) : (
        <>
          {/* Messages over time — area chart */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Messages over time{" "}
              <span className="font-normal text-gray-400">(last 30 days)</span>
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dayChartData} margin={{ left: -10, right: 4 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#6366f1" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Peak hours — bar chart */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Peak hours{" "}
              <span className="font-normal text-gray-400">(all time, your timezone)</span>
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourChartData} margin={{ left: -10, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#818cf8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
