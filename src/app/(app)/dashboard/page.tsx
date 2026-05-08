"use client";

import MessageCard from "@/components/MessageCard";
import { NotificationSettings } from "@/components/NotificationSettings";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { Loader2, RefreshCcw, Wifi, WifiOff } from "lucide-react";
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

// ── Component ──────────────────────────────────────────────────────────────
const Page = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState(false);

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
      // Deduplicate by _id before prepending
      const existingIds = new Set(prev.map((m) => m._id));
      const fresh = liveMessages.filter((m) => !existingIds.has(m._id));
      return [...fresh, ...prev];
    });

    clearLiveMessages(); // consumed — clear the context buffer
    markAllRead();       // user can see them, reset badge
  }, [liveMessages, clearLiveMessages, markAllRead]);

  // Mark all as read when dashboard mounts / gains focus
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  // ── Fetch accept-message setting ─────────────────────────────────────────
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

  // ── Toggle accept-messages ────────────────────────────────────────────────
  const handleSwitchChange = async () => {
    try {
      const res = await api.patch<AcceptResponse>("/api/users/accept-messages", {
        isAcceptingMessage: !acceptMessages,
      });
      setValue("acceptMessage", res.data.data.isAcceptingMessage);
      toast.success("Setting updated");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(
        axiosError.response?.data?.message ?? "Failed to update message settings"
      );
    }
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  };

  // ── Profile link ──────────────────────────────────────────────────────────
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold">User Dashboard</h1>
        {/* SSE connection status indicator */}
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

      {/* Profile link */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Copy your unique link</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={profileUrl}
            disabled
            className="input input-bordered w-full p-2 border rounded"
          />
          <Button onClick={copyToClipboard}>Copy</Button>
        </div>
      </div>

      {/* Accept messages toggle */}
      <div className="mb-4 flex items-center gap-2">
        <Switch
          {...register("acceptMessage")}
          checked={acceptMessages}
          onCheckedChange={handleSwitchChange}
          disabled={isSwitchLoading}
        />
        <span>Accept Messages: {acceptMessages ? "On" : "Off"}</span>
      </div>

      {/* Notification preference */}
      <div className="mb-6">
        <NotificationSettings />
      </div>

      <Separator />

      {/* Refresh */}
      <Button
        className="mt-4"
        variant="outline"
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
      </Button>

      {/* Messages grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {messages.length > 0 ? (
          messages.map((message) => (
            <MessageCard
              key={message._id}
              message={message}
              onMessageDelete={handleDeleteMessage}
            />
          ))
        ) : (
          <p className="text-gray-500">No messages to display</p>
        )}
      </div>
    </div>
  );
};

export default Page;
