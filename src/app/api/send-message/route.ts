import UserModel from "@/model/User";
import MessageModel from "@/model/Message";
import dbConnect from "@/lib/dbConnect";
import { messageSchema } from "@/schemas/messageSchema";
import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// In-memory rate limiter (Bug #5 fix)
// Tracks: IP -> { count, resetAt }
// Limit: 5 requests per 10 minutes per IP
// Note: For multi-server / serverless deployments, swap this for Upstash Redis.
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now >= entry.resetAt) {
    // First request or window expired — reset
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true; // Too many requests
  }

  entry.count += 1;
  return false;
}

// Clean up expired entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) rateLimitStore.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS);

// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  await dbConnect();

  // --- Rate limiting (Bug #5) ---
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return Response.json(
      {
        success: false,
        message: "Too many requests. Please wait a few minutes before trying again.",
      },
      { status: 429 }
    );
  }

  // --- Content validation (Bug #6) ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    const errorMessage = parsed.error.errors[0]?.message ?? "Invalid message content.";
    return Response.json(
      { success: false, message: errorMessage },
      { status: 400 }
    );
  }

  const { username, content } = body as { username: string; content: string };

  if (!username || typeof username !== "string") {
    return Response.json(
      { success: false, message: "Username is required." },
      { status: 400 }
    );
  }

  try {
    const user = await UserModel.findOne({ username }).lean();

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.isAcceptingMessage) {
      return Response.json(
        { success: false, message: "User is not accepting messages" },
        { status: 403 }
      );
    }

    // Save to the standalone Message collection
    await MessageModel.create({
      userId: user._id,
      content,
    });

    return Response.json(
      { success: true, message: "Message sent successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error(`Error sending message: ${error}`);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
