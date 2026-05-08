"use client";

import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CardHeader, CardContent, Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as z from "zod";
import Link from "next/link";
import { useParams } from "next/navigation";
import { messageSchema } from "@/schemas/messageSchema";

const BACKEND = process.env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:8000";
const specialChar = "||";

const parseStringMessages = (messageString: string): string[] =>
  messageString.split(specialChar).map((s) => s.trim()).filter(Boolean);

export default function SendMessages() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const [suggestedMessages, setSuggestedMessages] = useState<string[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
  });

  const messageContent = form.watch("content");

  const handleMessageClick = (message: string) => {
    form.setValue("content", message);
  };

  // ── Send anonymous message → Express backend ───────────────────────────────
  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    setIsLoading(true);
    try {
      const response = await axios.post<{ success: boolean; message: string }>(
        `${BACKEND}/api/messages/send/${username}`,
        { content: data.content }
      );
      toast.success(response.data.message);
      form.reset({ content: "" });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(
        axiosError.response?.data?.message ?? "Failed to send message"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── AI-suggested questions → Next.js API route (Gemini stays in FE) ────────
  const fetchSuggestedMessages = async () => {
    try {
      setIsSuggestLoading(true);
      const res = await axios.post("/api/suggest-messages");
      if (typeof res.data === "string") {
        setSuggestedMessages(parseStringMessages(res.data));
      } else if (res.data?.message) {
        setSuggestedMessages(parseStringMessages(res.data.message));
      } else {
        toast.error("Error while fetching suggestions");
      }
    } catch (e) {
      console.error("Error fetching suggestions", e);
      toast.error("Error fetching suggested messages");
    } finally {
      setIsSuggestLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedMessages();
  }, []);

  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-center">Public Profile Link</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Send Anonymous Message to @{username}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your anonymous message here"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-center">
            <Button type="submit" disabled={isLoading || !messageContent}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send It"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* AI suggestions */}
      <div className="space-y-4 my-8">
        <div className="space-y-2">
          <Button
            onClick={fetchSuggestedMessages}
            className="my-4"
            disabled={isSuggestLoading}
          >
            {isSuggestLoading ? "Loading…" : "Suggest Messages"}
          </Button>
          <p>Click on any message below to select it.</p>
        </div>
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Suggestions</h3>
          </CardHeader>
          <CardContent>
            {suggestedMessages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedMessages.map((msg, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto whitespace-normal text-left p-3 rounded-xl"
                    onClick={() => handleMessageClick(msg)}
                  >
                    {msg}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No suggestions yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />
      <div className="text-center">
        <div className="mb-4">Get your own message board</div>
        <Link href="/sign-up">
          <Button>Create Your Account</Button>
        </Link>
      </div>
    </div>
  );
}
