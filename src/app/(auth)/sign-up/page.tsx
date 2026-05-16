"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";
import axios from "axios";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MessageSquareHeart, ArrowRight } from "lucide-react";

const signUpSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be no longer than 30 characters")
    .regex(
      /^[a-z0-9_-]+$/i,
      "Username can only contain letters, numbers, _ and -"
    ),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const Page = () => {
  const [username, setUsername] = useState("");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounced = useDebounceCallback(setUsername, 400);
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  // ── Live username availability check ──────────────────────────────────────
  useEffect(() => {
    if (!username) {
      setUsernameMessage("");
      return;
    }
    const check = async () => {
      setIsCheckingUsername(true);
      setUsernameMessage("");
      try {
        const BACKEND = process.env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:8000";
        await axios.get(`${BACKEND}/api/users/check-username?username=${username}`);
        setUsernameMessage("Username is available");
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setUsernameMessage(err.response?.data?.message ?? "Error checking username");
        }
      } finally {
        setIsCheckingUsername(false);
      }
    };
    check();
  }, [username]);

  // ── Registration ─────────────────────────────────────────────────────────
  const onSubmit = async (data: SignUpFormValues) => {
    setIsSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      await sendEmailVerification(credential.user);
      await api.post("/api/auth/register", { username: data.username });

      toast.success(
        "Account created! Check your email to verify your address before signing in."
      );
      router.replace("/sign-in");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message ?? "Registration failed");
      } else if (err instanceof Error) {
        const msg = err.message.replace("Firebase: ", "").replace(/\(.*\)\.?/, "").trim();
        toast.error(msg);
      } else {
        toast.error("Registration failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUsernameAvailable = usernameMessage === "Username is available";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="animate-blob absolute -top-40 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="animate-blob animation-delay-2000 absolute -bottom-20 -left-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}
        />
        <div
          className="animate-blob animation-delay-4000 absolute top-1/3 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
        />
      </div>

      {/* Glass card */}
      <div className="glass-card glow-border w-full max-w-md space-y-7 p-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-indigo-500/30">
            <MessageSquareHeart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold gradient-text">Join True Feedback</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create your anonymous feedback link in seconds</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Username */}
            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Username
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="johndoe"
                        className="rounded-xl border-white/15 bg-white/6 backdrop-blur-sm focus:border-indigo-500/50 focus:ring-indigo-500/20 pr-8"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          debounced(e.target.value);
                        }}
                      />
                      {/* Status icon */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingUsername && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {!isCheckingUsername && usernameMessage && (
                          isUsernameAvailable
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            : <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  {!isCheckingUsername && usernameMessage && (
                    <p className={`text-xs ${isUsernameAvailable ? "text-emerald-400" : "text-red-400"}`}>
                      {usernameMessage}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="rounded-xl border-white/15 bg-white/6 backdrop-blur-sm focus:border-indigo-500/50 focus:ring-indigo-500/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="rounded-xl border-white/15 bg-white/6 backdrop-blur-sm focus:border-indigo-500/50 focus:ring-indigo-500/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              id="signup-submit"
              type="submit"
              className="shine-btn w-full rounded-xl gradient-bg border-0 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-90 hover:shadow-indigo-500/40 transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Already a member?{" "}
          <Link
            href="/sign-in"
            className="font-semibold gradient-text hover:opacity-80 transition-opacity"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Page;
