"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

// ── SVG icons (inline so no extra deps) ──────────────────────────────────────
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface ShareButtonsProps {
  profileUrl: string;
  username: string;
  /** Compact mode = icon-only buttons, used on dashboard */
  compact?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ShareButtons({ profileUrl, username, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `Send me an anonymous message on True Feedback 💬`;
  const encodedUrl = encodeURIComponent(profileUrl);
  const encodedText = encodeURIComponent(shareText);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${profileUrl}`)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Send @${username} an anonymous message`,
          text: shareText,
          url: profileUrl,
        });
      } catch {
        // dismissed
      }
    }
  };

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {/* Copy */}
        <button
          onClick={handleCopy}
          aria-label="Copy link"
          title="Copy link"
          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all active:scale-90 ${
            copied
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
              : "border-white/12 bg-white/6 text-muted-foreground hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300"
          }`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>

        {/* X / Twitter */}
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X (Twitter)"
          title="Share on X"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/6 text-muted-foreground transition-all hover:border-[#1da1f2]/30 hover:bg-[#1da1f2]/10 hover:text-[#1da1f2] active:scale-90"
        >
          <XIcon />
        </a>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
          title="Share on WhatsApp"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/6 text-muted-foreground transition-all hover:border-[#25d366]/30 hover:bg-[#25d366]/10 hover:text-[#25d366] active:scale-90"
        >
          <WhatsAppIcon />
        </a>

        {/* Native share (mobile) */}
        {hasNativeShare && (
          <button
            onClick={handleNativeShare}
            aria-label="More share options"
            title="More options"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/6 text-muted-foreground transition-all hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300 active:scale-90"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Full / expanded mode (for future use)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleCopy}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
          copied
            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
            : "border-white/12 bg-white/6 text-muted-foreground hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300"
        }`}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied!" : "Copy link"}
      </button>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-[#1da1f2]/30 hover:bg-[#1da1f2]/10 hover:text-[#1da1f2] active:scale-95"
      >
        <XIcon />
        Post on X
      </a>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-[#25d366]/30 hover:bg-[#25d366]/10 hover:text-[#25d366] active:scale-95"
      >
        <WhatsAppIcon />
        WhatsApp
      </a>

      {hasNativeShare && (
        <button
          onClick={handleNativeShare}
          className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300 active:scale-95"
        >
          <Share2 className="h-4 w-4" />
          More
        </button>
      )}
    </div>
  );
}
