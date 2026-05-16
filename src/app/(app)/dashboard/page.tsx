"use client";

import MessageCard from "@/components/MessageCard";
import { NotificationSettings } from "@/components/NotificationSettings";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import {
  Loader2,
  RefreshCcw,
  Wifi,
  WifiOff,
  BarChart2,
  Inbox,
  Copy,
  Check,
  Link2,
  Settings2,
} from "lucide-react";
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
  const [copied, setCopied] = useState(false);

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
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl gradient-text">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, <span className="font-medium text-foreground">@{authUser?.username}</span>
            </p>
          </div>
          {/* Live indicator */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
              isConnected
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white/5 border-white/10 text-muted-foreground"
            }`}
          >
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <Wifi className="h-3 w-3" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Reconnecting…
              </>
            )}
          </div>
        </div>

        {/* ── Profile link card ─────────────────────────────────────────────── */}
        <div className="glass-card glow-border mb-6 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Link2 className="h-4 w-4 text-indigo-400" />
            Your public link
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground truncate">
              {profileUrl}
            </div>
            <Button
              id="copy-link-btn"
              onClick={copyToClipboard}
              size="sm"
              className={`shrink-0 rounded-xl transition-all ${
                copied
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "shine-btn gradient-bg border-0 text-white hover:opacity-90"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Accept messages + notification settings ───────────────────────── */}
        <div className="glass-card mb-6 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="h-4 w-4 text-indigo-400" />
            Settings
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3" htmlFor="accept-switch">
              <Switch
                id="accept-switch"
                {...register("acceptMessage")}
                checked={acceptMessages}
                onCheckedChange={handleSwitchChange}
                disabled={isSwitchLoading}
              />
              <span className="text-sm">
                Accept messages:{" "}
                <span className={`font-semibold ${acceptMessages ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {acceptMessages ? "On" : "Off"}
                </span>
              </span>
            </label>
            <NotificationSettings />
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
          {(["messages", "analytics"] as Tab[]).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={[
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                activeTab === tab
                  ? "gradient-bg text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/8",
              ].join(" ")}
            >
              {tab === "messages" ? (
                <>
                  <Inbox className="h-4 w-4" />
                  Messages
                  {messages.length > 0 && (
                    <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      activeTab === "messages" ? "bg-white/20 text-white" : "bg-white/10 text-muted-foreground"
                    }`}>
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
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {messages.length === 0
                  ? "No messages yet — share your link!"
                  : `${messages.length} message${messages.length !== 1 ? "s" : ""}`}
              </p>
              <Button
                variant="outline"
                size="sm"
                id="refresh-messages-btn"
                onClick={(e) => {
                  e.preventDefault();
                  fetchMessages(true);
                }}
                className="h-8 gap-1.5 rounded-xl border-white/15 bg-white/5 text-xs hover:bg-white/10"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCcw className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <MessageCard
                    key={message._id}
                    message={message}
                    onMessageDelete={handleDeleteMessage}
                  />
                ))
              ) : (
                <div className="col-span-full glass-card flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8 border border-white/10">
                    <Inbox className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground">Share your link to start receiving anonymous feedback.</p>
                  <Button
                    size="sm"
                    onClick={copyToClipboard}
                    className="mt-2 shine-btn gradient-bg border-0 text-white rounded-xl"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy your link
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "analytics" && <AnalyticsDashboard />}
      </div>
    </div>
  );
};

export default Page;
