"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Moon, Sun, LogOut, LayoutDashboard, MessageSquareHeart, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";

const Navbar = () => {
  const { authUser } = useAuth();
  const { unreadCount, markAllRead } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/sign-in");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const handleDashboardClick = () => {
    markAllRead();
    setMobileOpen(false);
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg">
            <MessageSquareHeart className="h-4 w-4 text-white" />
          </span>
          <span className="gradient-text hidden sm:block">True Feedback</span>
        </Link>

        {/* Desktop right side */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full hover:bg-white/10 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-yellow-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500 transition-transform hover:-rotate-12" />
              )}
            </Button>
          )}

          {authUser ? (
            <>
              <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-white/5 border border-white/10">
                @{authUser.username ?? authUser.email}
              </span>

              {/* Dashboard / Bell */}
              <Link
                href="/dashboard"
                onClick={pathname !== "/dashboard" ? handleDashboardClick : undefined}
                className="relative"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Dashboard"
                  className="h-9 w-9 rounded-full hover:bg-white/10"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full gradient-bg text-[9px] font-bold text-white shadow-lg">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="h-8 gap-1.5 rounded-full border-white/20 hover:bg-white/10 hover:border-white/30 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </>
          ) : (
            <Link href="/sign-in">
              <Button
                size="sm"
                className="shine-btn h-8 rounded-full gradient-bg border-0 text-white text-xs font-medium px-4 hover:opacity-90 transition-opacity"
              >
                Get started
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile: theme + bell + hamburger */}
        <div className="flex sm:hidden items-center gap-1">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full hover:bg-white/10"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-yellow-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
              )}
            </Button>
          )}

          {authUser && (
            <Link href="/dashboard" onClick={handleDashboardClick} className="relative">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/10">
                <Bell className="h-4 w-4" />
              </Button>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full gradient-bg text-[9px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-white/10"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-white/10 bg-background/95 backdrop-blur-xl px-4 pb-4 pt-3 space-y-2 animate-fade-in-up">
          {authUser ? (
            <>
              <div className="text-xs text-muted-foreground px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                @{authUser.username ?? authUser.email}
              </div>
              <Link
                href="/dashboard"
                onClick={handleDashboardClick}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/8 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
              <Button className="w-full shine-btn gradient-bg border-0 text-white rounded-xl">
                Get started
              </Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
