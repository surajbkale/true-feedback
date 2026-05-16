"use client";

import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Send, Sparkles, MessageSquareHeart, RefreshCcw, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as z from "zod";
import Link from "next/link";
import { useParams } from "next/navigation";
import { messageSchema } from "@/schemas/messageSchema";
import Navbar from "@/components/Navbar";

const BACKEND = process.env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:8000";
const specialChar = "||";

const parseStringMessages = (messageString: string): string[] =>
  messageString.split(specialChar).map((s) => s.trim()).filter(Boolean);

export default function SendMessages() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const [suggestedMessages, setSuggestedMessages] = useState<string[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
  });

  const messageContent = form.watch("content");

  const handleMessageClick = (message: string) => {
    form.setValue("content", message);
  };

  // ── Send anonymous message ───────────────────────────────────────────────
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
      toast.error(
        axiosError.response?.data?.message ?? "Failed to send message"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── AI-suggested messages ────────────────────────────────────────────────
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
      toast.error("Error fetching suggested messages");
    } finally {
      setIsSuggestLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Navbar />

      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="animate-blob absolute -top-40 -left-32 h-[450px] w-[450px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="animate-blob animation-delay-2000 absolute top-1/3 right-0 h-[350px] w-[350px] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}
        />
        <div
          className="animate-blob animation-delay-4000 absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
        />
      </div>

      <main className="mx-auto max-w-2xl px-4 py-10 pb-20">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-indigo-500/30">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Send to{" "}
            <span className="gradient-text">@{username}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your identity stays completely hidden. Be honest, be kind.
          </p>
        </div>

        {/* ── Message form ────────────────────────────────────────────────── */}
        <div className="glass-card glow-border p-6 mb-6 animate-fade-in-up delay-100">
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
                        className="min-h-[130px] resize-none rounded-xl border-white/15 bg-white/6 backdrop-blur-sm text-sm placeholder:text-muted-foreground/60 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {messageContent?.length ?? 0} characters
                </span>
                <Button
                  id="send-message-btn"
                  type="submit"
                  disabled={isLoading || !messageContent}
                  className={`shine-btn rounded-xl border-0 font-semibold text-white transition-all ${
                    sent
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "gradient-bg hover:opacity-90"
                  } shadow-lg shadow-indigo-500/25 disabled:opacity-50`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : sent ? (
                    <>
                      ✓ Sent!
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send anonymously
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* ── AI Suggestions ──────────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-fade-in-up delay-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold">AI Suggestions</h2>
              <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
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
              {isSuggestLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCcw className="h-3.5 w-3.5" />
              )}
              Refresh
            </Button>
          </div>

          {isSuggestLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-white/6 border border-white/8"
                />
              ))}
            </div>
          ) : suggestedMessages.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {suggestedMessages.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => handleMessageClick(msg)}
                  className="group relative rounded-xl border border-white/10 bg-white/5 p-3.5 text-left text-sm leading-relaxed text-muted-foreground transition-all hover:border-indigo-500/30 hover:bg-indigo-500/8 hover:text-foreground"
                >
                  {/* subtle gradient on hover */}
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/0 to-violet-500/0 transition-all group-hover:from-indigo-500/5 group-hover:to-violet-500/5" />
                  <span className="relative">{msg}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No suggestions yet.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSuggestedMessages}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Try generating some
              </Button>
            </div>
          )}
        </div>

        {/* ── CTA footer ──────────────────────────────────────────────────── */}
        <div className="mt-10 text-center animate-fade-in-up delay-300">
          <div className="mb-3 flex items-center justify-center gap-2">
            <MessageSquareHeart className="h-4 w-4 text-indigo-400" />
            <p className="text-sm text-muted-foreground">Want your own anonymous message board?</p>
          </div>
          <Link href="/sign-up">
            <button
              id="public-profile-cta"
              className="shine-btn inline-flex items-center gap-2 rounded-full gradient-bg px-7 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40"
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
