"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The public landing page lives at src/app/page.tsx.
// Authenticated users who land on the (app) group root are sent to /dashboard.
export default function AppHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
