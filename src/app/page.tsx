"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import messages from "@/messages.json";
import Navbar from "@/components/Navbar";
import { ArrowRight, Link2, Eye, MessageSquareHeart, Sparkles, Shield, Zap } from "lucide-react";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Link2,
    title: "Share your link",
    desc: "Copy your unique profile URL and share it anywhere — social media, bios, or with friends.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    step: "02",
    icon: MessageSquareHeart,
    title: "Receive anonymous messages",
    desc: "Anyone can send you honest, anonymous feedback without revealing their identity.",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    step: "03",
    icon: Eye,
    title: "Read & reflect",
    desc: "View all messages in your dashboard. Gain insights, grow, and toggle message acceptance anytime.",
    color: "from-fuchsia-500 to-cyan-500",
  },
];

const FEATURES = [
  { icon: Shield, label: "100% Anonymous" },
  { icon: Zap, label: "Real-time delivery" },
  { icon: Sparkles, label: "AI suggestions" },
];

const Home = () => {
  return (
    <>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <main className="relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="animate-blob animation-delay-0 absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
          />
          <div
            className="animate-blob animation-delay-2000 absolute top-20 right-0 h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}
          />
          <div
            className="animate-blob animation-delay-4000 absolute bottom-0 left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
          />
        </div>

        {/* Hero content */}
        <section className="mx-auto flex max-w-4xl flex-col items-center px-4 pb-16 pt-20 text-center sm:pt-28">
          {/* Pill badge */}
          <span className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Anonymous feedback, reimagined
          </span>

          <h1 className="animate-fade-in-up delay-100 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="gradient-text">Honest feedback.</span>
            <br />
            <span>Zero identity.</span>
          </h1>

          <p className="animate-fade-in-up delay-200 mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            True Feedback lets anyone send you candid, anonymous messages — so you get the
            truth without the awkwardness. Share your link, read your feedback, and grow.
          </p>

          {/* Feature pills */}
          <div className="animate-fade-in-up delay-300 mt-8 flex flex-wrap items-center justify-center gap-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                <Icon className="h-3 w-3 text-indigo-400" />
                {label}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="animate-fade-in-up delay-400 mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-up">
              <button
                id="hero-cta-signup"
                className="shine-btn inline-flex items-center gap-2 rounded-full gradient-bg px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-8 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:bg-white/12 hover:border-white/25"
            >
              See how it works
            </a>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              How it <span className="gradient-text">works</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Three simple steps to unlock honest conversations.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color }) => (
              <div
                key={step}
                className="glass-card glow-border group relative flex flex-col gap-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="absolute right-5 top-5 text-5xl font-black text-white/5 group-hover:text-white/8 transition-colors select-none">
                  {step}
                </span>
                <div>
                  <h3 className="font-semibold text-base">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Social proof carousel ─────────────────────────────────────── */}
        <section className="mx-auto max-w-2xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Real <span className="gradient-text">anonymous</span> messages
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Here's what people are saying.</p>
          </div>

          <Carousel
            plugins={[Autoplay({ delay: 2800, stopOnInteraction: false })]}
            className="w-full"
            opts={{ loop: true }}
          >
            <CarouselContent>
              {messages.map((message, index) => (
                <CarouselItem key={index}>
                  <div className="p-2">
                    <Card className="glass-card glow-border border-0 shadow-none">
                      <CardContent className="flex min-h-[160px] flex-col items-center justify-center gap-4 p-8 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg">
                          <MessageSquareHeart className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-base font-medium leading-relaxed">
                          &ldquo;{message.content}&rdquo;
                        </p>
                        <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-muted-foreground border border-white/10">
                          {message.title}
                        </span>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </section>

        {/* ── CTA banner ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 pb-24">
          <div className="relative overflow-hidden rounded-3xl gradient-bg p-px">
            <div className="rounded-[calc(1.5rem-1px)] bg-background/80 backdrop-blur-sm px-8 py-14 text-center sm:px-16">
              {/* inner glow */}
              <div className="pointer-events-none absolute inset-0 rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-cyan-500/10" />
              <h2 className="relative text-3xl font-bold sm:text-4xl">
                Ready to hear the <span className="gradient-text">truth?</span>
              </h2>
              <p className="relative mt-4 text-sm text-muted-foreground sm:text-base">
                Create your anonymous feedback link in seconds. No credit card required.
              </p>
              <Link href="/sign-up">
                <button
                  id="bottom-cta-signup"
                  className="shine-btn relative mt-8 inline-flex items-center gap-2 rounded-full gradient-bg px-10 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:scale-[1.02]"
                >
                  Create your link
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 px-4 py-8 text-center">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-md gradient-bg">
              <MessageSquareHeart className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="gradient-text">True Feedback</span>
          </Link>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} True Feedback. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Home;
