"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader2, Bell, BellOff, Clock } from "lucide-react";

type Preference = "instant" | "digest" | "off";

interface Option {
  value: Preference;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const OPTIONS: Option[] = [
  {
    value: "instant",
    label: "Instant",
    description: "Email me the moment a message arrives",
    icon: <Bell className="h-4 w-4 text-indigo-500" />,
  },
  {
    value: "digest",
    label: "Daily digest",
    description: "One summary email at 8:00 AM UTC each day",
    icon: <Clock className="h-4 w-4 text-amber-500" />,
  },
  {
    value: "off",
    label: "Off",
    description: "No notification emails",
    icon: <BellOff className="h-4 w-4 text-gray-400" />,
  },
];

export function NotificationSettings() {
  const [preference, setPreference] = useState<Preference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ── Fetch current preference ────────────────────────────────────────────
  const fetchPreference = useCallback(async () => {
    try {
      const res = await api.get<{
        success: boolean;
        data: { notificationPreference: Preference };
      }>("/api/users/notification-preference");
      setPreference(res.data.data.notificationPreference);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to load notification settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreference();
  }, [fetchPreference]);

  // ── Update preference ───────────────────────────────────────────────────
  const handleChange = async (value: Preference) => {
    if (value === preference || isSaving) return;
    setIsSaving(true);
    const prev = preference;
    setPreference(value); // optimistic update

    try {
      await api.patch("/api/users/notification-preference", {
        notificationPreference: value,
      });
      toast.success("Notification preference saved");
    } catch (err) {
      setPreference(prev); // revert on failure
      const axiosError = err as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to save preference");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading notification settings…
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Email notifications
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {OPTIONS.map((opt) => {
          const isSelected = preference === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleChange(opt.value)}
              disabled={isSaving}
              className={[
                "flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all duration-150 cursor-pointer",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                isSelected
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
              ].join(" ")}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-2">
                {opt.icon}
                <span className={`text-sm font-semibold ${isSelected ? "text-indigo-700" : "text-gray-800"}`}>
                  {opt.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-snug">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
