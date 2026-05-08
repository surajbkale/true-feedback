"use client";

import React from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const Navbar = () => {
  const { authUser } = useAuth();
  const { unreadCount, markAllRead } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/sign-in");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const handleDashboardClick = () => {
    markAllRead(); // clear badge when user navigates to dashboard
  };

  return (
    <nav className="p-4 md:p-6 shadow-md">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <Link className="text-xl font-bold mb-4 md:mb-0" href="/">
          True Feedback
        </Link>

        {authUser ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              @{authUser.username ?? authUser.email}
            </span>

            {/* Dashboard link with notification badge */}
            <Link
              href="/dashboard"
              onClick={pathname !== "/dashboard" ? handleDashboardClick : undefined}
              className="relative"
            >
              <Button variant="ghost" size="icon" aria-label="Dashboard">
                <Bell className="h-5 w-5" />
              </Button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <Button
              className="w-full md:w-auto"
              variant="outline"
              onClick={handleSignOut}
            >
              Logout
            </Button>
          </div>
        ) : (
          <Link href="/sign-in">
            <Button className="w-full md:w-auto">Login</Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
