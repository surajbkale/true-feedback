import { NextRequest, NextResponse } from "next/server";

// Protect the dashboard — unauthenticated users are redirected to sign-in.
// Since Firebase auth is client-side, we can't verify the token on the edge.
// The actual auth guard is in src/app/(app)/layout.tsx.
// This middleware only handles the redirect for already-authed users hitting auth pages.

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};

export function middleware(_request: NextRequest) {
  // Auth state is managed client-side via FirebaseAuthProvider + (app)/layout.tsx
  // No server-side token check needed here.
  return NextResponse.next();
}
