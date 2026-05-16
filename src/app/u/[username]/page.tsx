"use client";

import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Loader2, Send, Sparkles, MessageSquareHeart,
  RefreshCcw, ArrowRight, User2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as z from "zod";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { messageSchema } from "@/schemas/messageSchema";
import Navbar from "@/components/Navbar";

const BACKEND = process.env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:8000";
const specialChar = "||";

const parseStringMessages = (s: string): string[] =>
  s.split(specialChar).map((m) => m.trim()).filter(Boolean);

// ── Types ──────────────────────────────────────────────────────────────────────
interface PublicProfile {
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  welcomeMessage: string | null;
  themeColor: string;
  isAcceptingMessage: boolean;
}

export default function SendMessages() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  // ── Profile state ─────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ── Message / suggestions state ───────────────────────────────────────────
  const [suggestedMessages, setSuggestedMessages] = useState<string[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<z.infer<typeof messageSchema>>({ resolver: zodResolver(messageSchema) });
  const messageContent = form.watch("content");

  // ── Fetch public profile ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get<{ success: boolean; data: PublicProfile }>(
          `${BACKEND}/api/users/profile/${username}`
        );
        setProfile(res.data.data);
      } catch (err) {
        const axiosError = err as AxiosError<{ message: string }>;
        if (axiosError.response?.status === 404) setNotFound(true);
      } finally {
        setProfileLoading(false);
      }
    };
    if (username) fetchProfile();
  }, [username]);

  // ── Send message ───────────────────────────────────────────────────────────
  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    setIsLoading(true);
    try {
      const response = await axios.post<{ success: boolean; message: string }>(
        `${BACKEND}/api/messages/send/${username}`,
        { content: data.content }
      );
      toast.success(response.data.message);
      form.reset({ content: "" });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  // ── AI suggestions ─────────────────────────────────────────────────────────
  const fetchSuggestedMessages = async () => {
    try {
      setIsSuggestLoading(true);
      const res = await axios.post("/api/suggest-messages");
      if (typeof res.data === "string") {
        setSuggestedMessages(parseStringMessages(res.data));
      } else if (res.data?.message) {
        setSuggestedMessages(parseStringMessages(res.data.message));
      } else {
        toast.error("Error while fetching suggestions");
      }
    } catch (e) {
      console.error("Error fetching suggestions", e);
    } finally {
      setIsSuggestLoading(false);
    }
  };

  useEffect(() => { fetchSuggestedMessages(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ────────────────────────────────────────────────────────────────
  const themeColor = profile?.themeColor ?? "#6366f1";
  const themeColorMuted = themeColor + "25";
  const themeColorBorder = themeColor + "50";

  // ── Loading state ──────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <>
        <Navbar />
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      </>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <>
        <Navbar />
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
          <XCircle className="h-12 w-12 text-red-400" />
          <h1 className="text-xl font-bold">User not found</h1>
          <p className="text-sm text-muted-foreground">@{username} doesn&apos;t exist.</p>
          <Link href="/">
            <Button className="gradient-bg text-white border-0 rounded-xl shine-btn">Go home</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* ── Background blobs (tinted with theme color) ───────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="animate-blob absolute -top-40 -left-32 h-[450px] w-[450px] rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${themeColor}, transparent)` }}
        />
        <div
          className="animate-blob animation-delay-2000 absolute top-1/3 right-0 h-[350px] w-[350px] rounded-full opacity-15 blur-3xl"
          style={{ background: `radial-gradient(circle, ${themeColor}bb, transparent)` }}
        />
        <div
          className="animate-blob animation-delay-4000 absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
        />
      </div>

      <main className="mx-auto max-w-2xl px-4 py-10 pb-20">

        {/* ── Profile header ──────────────────────────────────────────────── */}
        <div className="mb-8 text-center animate-fade-in-up">
          {/* Avatar */}
          <div className="mb-4 flex justify-center">
            <div
              className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 shadow-lg"
              style={{ borderColor: themeColorBorder, boxShadow: `0 8px 32px ${themeColor}30` }}
            >
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={`@${username}`}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center"
                  style={{ background: themeColorMuted }}
                >
                  <User2 className="h-9 w-9" style={{ color: themeColor }} />
                </div>
              )}
            </div>
          </div>

          {/* Welcome message / username */}
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            {profile?.welcomeMessage ?? (
              <>Send to <span style={{ color: themeColor }}>@{username}</span></>
            )}
          </h1>
          {profile?.welcomeMessage && (
            <p className="mt-1 text-sm font-medium" style={{ color: themeColor }}>
              @{username}
            </p>
          )}

          {/* Bio */}
          {profile?.bio && (
            <p className="mt-3 max-w-sm mx-auto text-sm text-muted-foreground leading-relaxed">
              {profile.bio}
            </p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Your identity stays completely hidden. Be honest, be kind.
          </p>
        </div>

        {/* ── Not accepting messages ───────────────────────────────────────── */}
        {profile && !profile.isAcceptingMessage && (
          <div
            className="mb-6 rounded-2xl border p-4 text-center text-sm"
            style={{ borderColor: themeColorBorder, background: themeColorMuted }}
          >
            <p className="font-medium" style={{ color: themeColor }}>
              @{username} isn&apos;t accepting messages right now.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Check back later!</p>
          </div>
        )}

        {/* ── Message form ─────────────────────────────────────────────────── */}
        <div className="glass-card glow-border p-6 mb-6 animate-fade-in-up delay-100"
          style={{ "--glow-color": themeColorBorder } as React.CSSProperties}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder={`Write an anonymous message to @${username}…`}
                        disabled={profile ? !profile.isAcceptingMessage : false}
                        className="min-h-[130px] resize-none rounded-xl border-white/15 bg-white/6 backdrop-blur-sm text-sm placeholder:text-muted-foreground/60"
                        style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{messageContent?.length ?? 0} characters</span>
                <Button
                  id="send-message-btn"
                  type="submit"
                  disabled={isLoading || !messageContent || (profile ? !profile.isAcceptingMessage : false)}
                  className={`shine-btn rounded-xl border-0 font-semibold text-white shadow-lg disabled:opacity-50 transition-all ${
                    sent ? "bg-emerald-500 hover:bg-emerald-600" : ""
                  }`}
                  style={!sent ? { background: themeColor, boxShadow: `0 4px 20px ${themeColor}40` } : {}}
                >
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                    : sent ? <>✓ Sent!</>
                    : <><Send className="mr-2 h-4 w-4" />Send anonymously</>}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* ── AI Suggestions ───────────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-fade-in-up delay-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: themeColor }} />
              <h2 className="text-sm font-semibold">AI Suggestions</h2>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium border"
                style={{ background: themeColorMuted, borderColor: themeColorBorder, color: themeColor }}
              >
                Tap to use
              </span>
            </div>
            <Button
              id="refresh-suggestions-btn"
              variant="ghost"
              size="sm"
              onClick={fetchSuggestedMessages}
              disabled={isSuggestLoading}
              className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/8"
            >
              {isSuggestLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCcw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>

          {isSuggestLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-white/6 border border-white/8" />
              ))}
            </div>
          ) : suggestedMessages.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {suggestedMessages.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => form.setValue("content", msg)}
                  className="group relative rounded-xl border border-white/10 bg-white/5 p-3.5 text-left text-sm leading-relaxed text-muted-foreground transition-all hover:text-foreground"
                  style={{
                    ["--hover-border" as string]: themeColorBorder,
                    ["--hover-bg" as string]: themeColorMuted,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = themeColorBorder;
                    (e.currentTarget as HTMLButtonElement).style.background = themeColorMuted;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "";
                    (e.currentTarget as HTMLButtonElement).style.background = "";
                  }}
                >
                  {msg}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No suggestions yet.</p>
              <Button variant="ghost" size="sm" onClick={fetchSuggestedMessages}
                className="text-xs hover:text-foreground" style={{ color: themeColor }}>
                Try generating some
              </Button>
            </div>
          )}
        </div>

        {/* ── CTA footer ───────────────────────────────────────────────────── */}
        <div className="mt-10 text-center animate-fade-in-up delay-300">
          <div className="mb-3 flex items-center justify-center gap-2">
            <MessageSquareHeart className="h-4 w-4 text-indigo-400" />
            <p className="text-sm text-muted-foreground">Want your own anonymous message board?</p>
          </div>
          <Link href="/sign-up">
            <button
              id="public-profile-cta"
              className="shine-btn inline-flex items-center gap-2 rounded-full px-7 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02]"
              style={{ background: themeColor, boxShadow: `0 4px 20px ${themeColor}40` }}
            >
              Create your free account
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </main>
    </>
  );
}
