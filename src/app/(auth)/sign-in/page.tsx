"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
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
import { Loader2, MessageSquareHeart, ArrowRight } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const Page = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignInFormValues) => {
    setIsSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Guard: require email verification before allowing access
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        toast.warning(
          "Please verify your email first. We've resent the verification link."
        );
        await auth.signOut();
        setIsSubmitting(false);
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message
          .replace("Firebase: ", "")
          .replace(/\(auth\/.*\)\.?/, "")
          .trim();
        toast.error(msg || "Invalid email or password");
      } else {
        toast.error("Sign in failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="animate-blob absolute -top-32 -left-32 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="animate-blob animation-delay-2000 absolute bottom-0 right-0 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}
        />
        <div
          className="animate-blob animation-delay-4000 absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-3xl"
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
            <h1 className="text-2xl font-extrabold gradient-text">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your True Feedback account</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
              id="signin-submit"
              type="submit"
              className="shine-btn w-full rounded-xl gradient-bg border-0 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-90 hover:shadow-indigo-500/40 transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          {"Don't have an account?"}{" "}
          <Link
            href="/sign-up"
            className="font-semibold gradient-text hover:opacity-80 transition-opacity"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Page;
