"use client";

import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { authUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authUser) {
      router.replace("/sign-in");
    }
  }, [authUser, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!authUser) return null; // redirect in progress

  return (
    <main>
      <Navbar />
      {children}
    </main>
  );
}
