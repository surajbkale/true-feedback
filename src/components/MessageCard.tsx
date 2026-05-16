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
import { Trash2, MessageSquareHeart } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AxiosError } from "axios";

dayjs.extend(relativeTime);

interface Message {
  _id: string;
  content: string;
  createdAt: string;
}

type MessageCardProps = {
  message: Message;
  onMessageDelete: (messageId: string) => void;
};

const SWIPE_THRESHOLD = 60; // px to reveal delete button
const MAX_SWIPE = 80;       // px max pull

export function MessageCard({ message, onMessageDelete }: MessageCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const startX = useRef<number | null>(null);

  // ── Touch events ───────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
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
    if (swipeX < SWIPE_THRESHOLD) {
      setSwipeX(0); // snap back
    } else {
      setSwipeX(MAX_SWIPE); // lock open
    }
  };

  const resetSwipe = () => setSwipeX(0);

  // ── Delete logic ───────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/api/messages/${message._id}`
      );
      setIsExiting(true);
      setTimeout(() => {
        onMessageDelete(message._id);
        toast.success(response.data.message);
      }, 340);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to delete message");
      resetSwipe();
    }
  };

  return (
    <div
      className={`swipe-card-wrapper ${isExiting ? "animate-slide-out" : ""}`}
    >
      {/* Red delete background revealed on swipe */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            aria-label="Delete message"
            className="swipe-delete-bg select-none"
            style={{ opacity: swipeX > 0 ? Math.min(swipeX / MAX_SWIPE, 1) : 0, pointerEvents: swipeX >= SWIPE_THRESHOLD ? "auto" : "none" }}
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Delete</span>
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This message will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetSwipe}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Card inner (slides left on swipe) */}
      <div
        className="swipe-card-inner glass-card border border-white/10 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 p-4 group"
        style={{
          transform: `translateX(-${swipeX}px)`,
          transition: isSwiping ? "none" : "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
            <MessageSquareHeart className="h-4 w-4 text-indigo-400" />
          </div>

          {/* Content */}
          <p className="flex-1 text-sm font-medium leading-relaxed">
            {message.content}
          </p>

          {/* Desktop delete (AlertDialog) */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                aria-label="Delete message"
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This message will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Timestamp */}
        <div className="mt-3 flex items-center justify-end">
          <span className="rounded-full bg-white/6 border border-white/8 px-2.5 py-0.5 text-[10px] text-muted-foreground">
            {dayjs(message.createdAt).fromNow()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default MessageCard;
