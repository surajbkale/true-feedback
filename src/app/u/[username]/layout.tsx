import type { Metadata } from "next";

const BACKEND = process.env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:8000";
const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://truefeedback.app";

interface ProfileData {
  username: string;
  bio: string | null;
  welcomeMessage: string | null;
  themeColor: string;
  isAcceptingMessage: boolean;
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;

  let profile: Partial<ProfileData> = { username };

  try {
    const res = await fetch(`${BACKEND}/api/users/profile/${username}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = (await res.json()) as { data: ProfileData };
      profile = json.data;
    }
  } catch {
    // use defaults
  }

  const title = profile.welcomeMessage
    ? `${profile.welcomeMessage} — True Feedback`
    : `Send @${username} an anonymous message — True Feedback`;

  const description =
    profile.bio ??
    `Send ${username} completely anonymous, honest feedback. Your identity is never revealed.`;

  const ogImageUrl = `${APP_URL}/u/${username}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/u/${username}`,
      siteName: "True Feedback",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function UserProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
