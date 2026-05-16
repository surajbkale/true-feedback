"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  Camera,
  Check,
  Loader2,
  Palette,
  Pencil,
  User2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ProfileData {
  bio: string | null;
  avatarUrl: string | null;
  welcomeMessage: string | null;
  themeColor: string;
}

interface ApiResponse {
  success: boolean;
  data: ProfileData & { username: string };
}

// ── Theme color presets ───────────────────────────────────────────────────────
const THEME_COLORS = [
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#8b5cf6", label: "Violet" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#10b981", label: "Emerald" },
  { hex: "#06b6d4", label: "Cyan" },
  { hex: "#f59e0b", label: "Amber" },
  { hex: "#ef4444", label: "Red" },
];

// ── Cloudinary unsigned upload ────────────────────────────────────────────────
const CLOUD_NAME = process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"] ?? "";
const UPLOAD_PRESET = process.env["NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"] ?? "";

async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ProfileSettings() {
  const { authUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    bio: "",
    avatarUrl: null,
    welcomeMessage: "",
    themeColor: "#6366f1",
  });
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch current profile ──────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!authUser?.username) return;
    try {
      const res = await api.get<ApiResponse>(`/api/users/profile/${authUser.username}`);
      const d = res.data.data;
      setProfile({
        bio: d.bio ?? "",
        avatarUrl: d.avatarUrl ?? null,
        welcomeMessage: d.welcomeMessage ?? "",
        themeColor: d.themeColor ?? "#6366f1",
      });
    } catch {
      // 404 = profile not yet customised, use defaults
    } finally {
      setIsFetching(false);
    }
  }, [authUser?.username]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Avatar file pick ───────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview instantly
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setProfile((p) => ({ ...p, avatarUrl: url }));
      toast.success("Avatar uploaded!");
    } catch {
      toast.error("Avatar upload failed. Check Cloudinary config.");
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch("/api/users/profile", {
        bio: profile.bio || null,
        avatarUrl: profile.avatarUrl || null,
        welcomeMessage: profile.welcomeMessage || null,
        themeColor: profile.themeColor,
      });
      toast.success("Profile saved!");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message ?? "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const displayAvatar = avatarPreview ?? profile.avatarUrl;

  if (isFetching) {
    return (
      <div className="glass-card p-5 flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-5 mb-6">
      <div className="flex items-center gap-2 text-sm font-semibold mb-1">
        <User2 className="h-4 w-4 text-indigo-400" />
        Profile Customization
      </div>

      {/* ── Avatar upload ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div
            className="h-16 w-16 rounded-2xl overflow-hidden border-2 flex items-center justify-center"
            style={{ borderColor: profile.themeColor + "60" }}
          >
            {displayAvatar ? (
              <Image
                src={displayAvatar}
                alt="Avatar"
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center"
                style={{ background: profile.themeColor + "30" }}
              >
                <User2 className="h-7 w-7" style={{ color: profile.themeColor }} />
              </div>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-white shadow-lg transition-transform hover:scale-110"
            style={{ background: profile.themeColor }}
          >
            {isUploading
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Camera className="h-3 w-3" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Profile avatar</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            JPG, PNG or WebP · max 5MB
          </p>
          {displayAvatar && (
            <button
              onClick={() => { setProfile((p) => ({ ...p, avatarUrl: null })); setAvatarPreview(null); }}
              className="mt-1 flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          )}
        </div>
      </div>

      {/* ── Welcome message ────────────────────────────────────────────────── */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Welcome message
        </label>
        <div className="relative">
          <input
            type="text"
            value={profile.welcomeMessage ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, welcomeMessage: e.target.value }))}
            maxLength={120}
            placeholder="e.g. Hey! Send me your honest thoughts 👋"
            className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 pr-14"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50">
            {(profile.welcomeMessage ?? "").length}/120
          </span>
        </div>
      </div>

      {/* ── Bio ────────────────────────────────────────────────────────────── */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Bio
        </label>
        <div className="relative">
          <textarea
            value={profile.bio ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            maxLength={200}
            rows={2}
            placeholder="Tell senders a bit about yourself…"
            className="w-full resize-none rounded-xl border border-white/12 bg-white/6 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
          />
          <span className="absolute bottom-2.5 right-3 text-[10px] text-muted-foreground/50">
            {(profile.bio ?? "").length}/200
          </span>
        </div>
      </div>

      {/* ── Theme color ────────────────────────────────────────────────────── */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <Palette className="h-3.5 w-3.5" />
          Theme color
        </label>
        <div className="flex flex-wrap gap-2">
          {THEME_COLORS.map(({ hex, label }) => (
            <button
              key={hex}
              title={label}
              onClick={() => setProfile((p) => ({ ...p, themeColor: hex }))}
              className="relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                background: hex,
                borderColor: profile.themeColor === hex ? "white" : "transparent",
                boxShadow: profile.themeColor === hex ? `0 0 0 1px ${hex}` : "none",
              }}
            >
              {profile.themeColor === hex && (
                <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" />
              )}
            </button>
          ))}
          {/* Custom hex input */}
          <div className="relative flex items-center">
            <input
              type="color"
              value={profile.themeColor}
              onChange={(e) => setProfile((p) => ({ ...p, themeColor: e.target.value }))}
              className="h-8 w-8 cursor-pointer rounded-full border-2 border-white/20 bg-transparent p-0.5 appearance-none"
              title="Custom color"
            />
          </div>
        </div>
      </div>

      {/* ── Save button ────────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-1">
        <Button
          onClick={handleSave}
          disabled={isSaving || isUploading}
          className="shine-btn rounded-xl border-0 text-white font-semibold px-6"
          style={{ background: profile.themeColor }}
        >
          {isSaving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
          ) : (
            <><Pencil className="mr-2 h-4 w-4" />Save profile</>
          )}
        </Button>
      </div>
    </div>
  );
}
