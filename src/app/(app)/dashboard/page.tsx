"use client";

import MessageCard from "@/components/MessageCard";
import { NotificationSettings } from "@/components/NotificationSettings";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { Loader2, RefreshCcw, Wifi, WifiOff, BarChart2, Inbox } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  _id: string;
  content: string;
  createdAt: string;
}

interface MessagesResponse {
  success: boolean;
  data: Message[];
}

interface AcceptResponse {
  success: boolean;
  data: { isAcceptingMessage: boolean };
}

const acceptMessageSchema = z.object({
  acceptMessage: z.boolean(),
});

type Tab = "messages" | "analytics";

// ── Component ──────────────────────────────────────────────────────────────
const Page = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("messages");

  const { authUser } = useAuth();
  const {
    liveMessages,
    clearLiveMessages,
    markAllRead,
    isConnected,
  } = useNotifications();

  const form = useForm({ resolver: zodResolver(acceptMessageSchema) });
  const { register, watch, setValue } = form;
  const acceptMessages = watch("acceptMessage");

  // ── Merge incoming SSE messages into the main list ─────────────────────
  useEffect(() => {
    if (liveMessages.length === 0) return;
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m._id));
      const fresh = liveMessages.filter((m) => !existingIds.has(m._id));
      return [...fresh, ...prev];
    });
    clearLiveMessages();
    markAllRead();
  }, [liveMessages, clearLiveMessages, markAllRead]);

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  // ── Fetch settings ────────────────────────────────────────────────────────
  const fetchAcceptMessage = useCallback(async () => {
    setIsSwitchLoading(true);
    try {
      const res = await api.get<AcceptResponse>("/api/users/accept-messages");
      setValue("acceptMessage", res.data.data.isAcceptingMessage);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to fetch message settings");
    } finally {
      setIsSwitchLoading(false);
    }
  }, [setValue]);

  // ── Fetch messages ────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (refresh = false) => {
    setIsLoading(true);
    try {
      const res = await api.get<MessagesResponse>("/api/messages");
      setMessages(res.data.data ?? []);
      if (refresh) toast.success("Showing latest messages");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to fetch messages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchAcceptMessage();
  }, [fetchMessages, fetchAcceptMessage]);

  const handleSwitchChange = async () => {
    try {
      const res = await api.patch<AcceptResponse>("/api/users/accept-messages", {
        isAcceptingMessage: !acceptMessages,
      });
      setValue("acceptMessage", res.data.data.isAcceptingMessage);
      toast.success("Setting updated");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to update setting");
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  };

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "";
  const profileUrl = `${baseUrl}/u/${authUser?.username ?? ""}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("URL copied to clipboard");
  };

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          {isConnected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-600">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-gray-400" />
              <span>Reconnecting…</span>
            </>
          )}
        </div>
      </div>

      {/* ── Profile link ─────────────────────────────────────────────────── */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-2">Your public link</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={profileUrl}
            disabled
            className="w-full p-2 text-sm border rounded bg-gray-50 text-gray-600"
          />
          <Button onClick={copyToClipboard} size="sm">Copy</Button>
        </div>
      </div>

      {/* ── Accept messages + notification settings ───────────────────────── */}
      <div className="mb-5 space-y-4">
        <div className="flex items-center gap-3">
          <Switch
            {...register("acceptMessage")}
            checked={acceptMessages}
            onCheckedChange={handleSwitchChange}
            disabled={isSwitchLoading}
          />
          <span className="text-sm text-gray-700">
            Accept Messages: <strong>{acceptMessages ? "On" : "Off"}</strong>
          </span>
        </div>
        <NotificationSettings />
      </div>

      <Separator className="mb-5" />

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {(["messages", "analytics"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
              activeTab === tab
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {tab === "messages" ? (
              <>
                <Inbox className="h-4 w-4" />
                Messages
                {messages.length > 0 && (
                  <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {messages.length}
                  </span>
                )}
              </>
            ) : (
              <>
                <BarChart2 className="h-4 w-4" />
                Analytics
              </>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      {activeTab === "messages" && (
        <>
          <Button
            className="mb-4"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              fetchMessages(true);
            }}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {messages.length > 0 ? (
              messages.map((message) => (
                <MessageCard
                  key={message._id}
                  message={message}
                  onMessageDelete={handleDeleteMessage}
                />
              ))
            ) : (
              <p className="text-gray-400 text-sm">No messages yet. Share your link!</p>
            )}
          </div>
        </>
      )}

      {activeTab === "analytics" && <AnalyticsDashboard />}
    </div>
  );
};

export default Page;
