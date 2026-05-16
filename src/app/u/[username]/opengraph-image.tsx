import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export const alt = "True Feedback — Send anonymous messages";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BACKEND = process.env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:8000";

interface ProfileData {
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  welcomeMessage: string | null;
  themeColor: string;
}

export default async function OgImage(
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Try to fetch real profile data; fall back to defaults if unavailable
  let profile: ProfileData = {
    username,
    bio: null,
    avatarUrl: null,
    welcomeMessage: null,
    themeColor: "#6366f1",
  };

  try {
    const res = await fetch(`${BACKEND}/api/users/profile/${username}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = (await res.json()) as { data: ProfileData };
      profile = { ...profile, ...json.data };
    }
  } catch {
    // silently use defaults
  }

  const color = profile.themeColor ?? "#6366f1";
  const colorMuted = color + "30";
  const displayMessage = profile.welcomeMessage ?? `Send @${username} an anonymous message`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d0d1a 0%, #111128 60%, #0d0d1a 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow blobs */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}40, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}25, transparent 70%)`,
          }}
        />

        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${color}08 1px, transparent 1px), linear-gradient(90deg, ${color}08 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "28px",
            padding: "52px 64px",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${color}40`,
            borderRadius: "24px",
            backdropFilter: "blur(20px)",
            maxWidth: "880px",
            width: "100%",
            boxShadow: `0 0 80px ${color}20`,
          }}
        >
          {/* Avatar or initial */}
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "24px",
              background: colorMuted,
              border: `2px solid ${color}60`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "44px",
              fontWeight: "700",
              color,
              overflow: "hidden",
            }}
          >
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                width={100}
                height={100}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              username.charAt(0).toUpperCase()
            )}
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                fontSize: "42px",
                fontWeight: "800",
                color: "#fff",
                textAlign: "center",
                lineHeight: 1.2,
                maxWidth: "720px",
              }}
            >
              {displayMessage}
            </div>
            <div style={{ fontSize: "22px", color: color, fontWeight: "600" }}>
              @{username}
            </div>
            {profile.bio && (
              <div
                style={{
                  fontSize: "18px",
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "center",
                  maxWidth: "600px",
                  lineHeight: 1.5,
                }}
              >
                {profile.bio.length > 80 ? profile.bio.slice(0, 80) + "…" : profile.bio}
              </div>
            )}
          </div>

          {/* CTA pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: color,
              borderRadius: "9999px",
              padding: "12px 32px",
              fontSize: "20px",
              fontWeight: "700",
              color: "#fff",
              boxShadow: `0 4px 24px ${color}50`,
            }}
          >
            💬  Send an anonymous message
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            right: "40px",
            fontSize: "16px",
            color: "rgba(255,255,255,0.25)",
            fontWeight: "600",
            letterSpacing: "0.05em",
          }}
        >
          truefeedback.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
