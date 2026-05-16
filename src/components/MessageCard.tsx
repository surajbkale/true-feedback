"use client";

import React, { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Trash2, MessageSquareHeart, Smile, Star, Pin } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AxiosError } from "axios";

dayjs.extend(relativeTime);

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Message {
  _id: string;
  content: string;
  createdAt: string;
  reaction?: string | null;
  isStarred?: boolean;
  isPinned?: boolean;
}

type MessageCardProps = {
  message: Message;
  onMessageDelete: (messageId: string) => void;
  onMessageUpdate?: (messageId: string, patch: Partial<Message>) => void;
};

// ── Constants ──────────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 72;
const MAX_SWIPE = 88;
const EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏"] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function MessageCard({ message, onMessageDelete, onMessageUpdate }: MessageCardProps) {
  // ── Swipe ────────────────────────────────────────────────────────────────────
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const startX = useRef<number | null>(null);

  // ── Local state (optimistic) ─────────────────────────────────────────────────
  const [reaction, setReaction] = useState<string | null>(message.reaction ?? null);
  const [isStarred, setIsStarred] = useState(message.isStarred ?? false);
  const [isPinned, setIsPinned] = useState(message.isPinned ?? false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // ── Touch handlers ────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    setPickerOpen(false);
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = startX.current - e.touches[0].clientX;
    setSwipeX(Math.max(0, Math.min(dx, MAX_SWIPE)));
  };
  const onTouchEnd = () => {
    setIsSwiping(false);
    startX.current = null;
    setSwipeX(swipeX >= SWIPE_THRESHOLD ? MAX_SWIPE : 0);
  };
  const resetSwipe = () => setSwipeX(0);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    try {
      const res = await api.delete<{ success: boolean; message: string }>(
        `/api/messages/${message._id}`
      );
      setIsExiting(true);
      setTimeout(() => {
        onMessageDelete(message._id);
        toast.success(res.data.message);
      }, 340);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to delete message");
      resetSwipe();
    }
  };

  // ── React (emoji) ─────────────────────────────────────────────────────────────
  const handleReact = async (emoji: string) => {
    const next = reaction === emoji ? null : emoji;
    setReaction(next);
    setPickerOpen(false);
    setIsReacting(true);
    try {
      await api.patch(`/api/messages/${message._id}/react`, { emoji: next });
    } catch (error) {
      setReaction(reaction);
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to save reaction");
    } finally {
      setIsReacting(false);
    }
  };

  // ── Star / Pin ────────────────────────────────────────────────────────────────
  const handleToggle = async (field: "isStarred" | "isPinned") => {
    const prev = field === "isStarred" ? isStarred : isPinned;
    const next = !prev;

    // optimistic
    if (field === "isStarred") setIsStarred(next);
    else setIsPinned(next);

    setIsUpdating(true);
    try {
      await api.patch(`/api/messages/${message._id}`, { [field]: next });
      onMessageUpdate?.(message._id, { [field]: next });
    } catch (error) {
      // rollback
      if (field === "isStarred") setIsStarred(prev);
      else setIsPinned(prev);
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`swipe-card-wrapper${isExiting ? " animate-slide-out" : ""}`}>

      {/* ── Red delete panel revealed on swipe ─────────────────────────────── */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            aria-label="Delete message"
            className="swipe-delete-bg"
            style={{
              opacity: swipeX > 0 ? Math.min(swipeX / MAX_SWIPE, 1) : 0,
              pointerEvents: swipeX >= SWIPE_THRESHOLD ? "auto" : "none",
            }}
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-[10px] font-semibold tracking-wide">Delete</span>
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-white/10" style={{ background: "#1e1e2e" }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetSwipe}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Card body ─────────────────────────────────────────────────────────── */}
      <div
        className={`swipe-card-inner glass-card border transition-colors duration-300 p-4 group
          ${isPinned
            ? "border-amber-500/30 hover:border-amber-500/50 shadow-amber-500/5 shadow-md"
            : "border-white/10 hover:border-indigo-500/30"
          }`}
        style={{
          transform: `translateX(-${swipeX}px)`,
          transition: isSwiping ? "none" : "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* ── Top row ─────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border
            ${isPinned
              ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/25"
              : "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border-indigo-500/20"
            }`}>
            <MessageSquareHeart className={`h-4 w-4 ${isPinned ? "text-amber-400" : "text-indigo-400"}`} />
          </div>

          {/* Content */}
          <p className="flex-1 text-sm font-medium leading-relaxed break-words">
            {message.content}
          </p>

          {/* Right action buttons — star + pin + delete (desktop hover-reveal) */}
          <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {/* Star */}
            <button
              aria-label={isStarred ? "Unstar message" : "Star message"}
              onClick={() => handleToggle("isStarred")}
              disabled={isUpdating}
              className={`rounded-lg p-1.5 transition-all active:scale-90
                ${isStarred
                  ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                  : "text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10"
                }`}
            >
              <Star className={`h-4 w-4 ${isStarred ? "fill-amber-400" : ""}`} />
            </button>

            {/* Pin */}
            <button
              aria-label={isPinned ? "Unpin message" : "Pin message"}
              onClick={() => handleToggle("isPinned")}
              disabled={isUpdating}
              className={`rounded-lg p-1.5 transition-all active:scale-90
                ${isPinned
                  ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                  : "text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10"
                }`}
            >
              <Pin className={`h-4 w-4 ${isPinned ? "fill-amber-400" : ""}`} />
            </button>

            {/* Delete — desktop only */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  aria-label="Delete message"
                  className="hidden sm:flex rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-white/10" style={{ background: "#1e1e2e" }}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600 text-white">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* ── Pin / Star badges ────────────────────────────────────────────── */}
        {(isPinned || isStarred) && (
          <div className="mt-2 flex items-center gap-1.5">
            {isPinned && (
              <span className="flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                <Pin className="h-2.5 w-2.5 fill-amber-400" />
                Pinned
              </span>
            )}
            {isStarred && (
              <span className="flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                <Star className="h-2.5 w-2.5 fill-amber-400" />
                Starred
              </span>
            )}
          </div>
        )}

        {/* ── Bottom row: emoji + timestamp ────────────────────────────────── */}
        <div className="mt-3 flex items-center justify-between gap-2">
          {/* Left: reaction bubble + emoji trigger */}
          <div className="relative flex items-center gap-2">
            {reaction && (
              <button
                onClick={() => handleReact(reaction)}
                disabled={isReacting}
                title="Tap to remove"
                className="flex items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 text-base transition-all hover:border-red-400/30 hover:bg-red-400/10 active:scale-90"
              >
                {reaction}
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setPickerOpen((o) => !o)}
                disabled={isReacting}
                aria-label="Add reaction"
                className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all
                  opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                  ${pickerOpen
                    ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                    : "border-white/15 bg-white/8 text-muted-foreground hover:border-indigo-500/40 hover:bg-indigo-500/15 hover:text-indigo-300"
                  }`}
              >
                <Smile className="h-4 w-4" />
              </button>

              {pickerOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-50 animate-fade-in-up">
                  <div
                    className="flex items-center gap-1 rounded-2xl border border-white/15 p-2 shadow-2xl shadow-black/60 ring-1 ring-white/10"
                    style={{ background: "#1e1e2e" }}
                  >
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        title={emoji}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all hover:scale-125 active:scale-90
                          ${reaction === emoji ? "bg-indigo-500/25 ring-1 ring-indigo-500/50" : "hover:bg-white/12"}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: mobile swipe hint + timestamp */}
          <div className="flex items-center gap-2">
            <span className="sm:hidden text-[10px] text-muted-foreground/40 select-none">← swipe to delete</span>
            <span className="rounded-full bg-white/6 border border-white/8 px-2.5 py-0.5 text-[10px] text-muted-foreground whitespace-nowrap">
              {dayjs(message.createdAt).fromNow()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageCard;
