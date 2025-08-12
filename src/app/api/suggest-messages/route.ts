// File: app/api/generate-stream/route.ts (or pages/api/generate-stream.ts)
import { NextResponse } from "next/server";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { TextEncoder } from "util";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model: GenerativeModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      temperature: 0.7,
    });

    const stream = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 400 },
    });

    const encoder = new TextEncoder();
    const reader = stream.stream.getReader();
    let completeText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = new TextDecoder().decode(value);
      completeText += chunkText;
    }

    return NextResponse.json({ text: completeText });
  } catch (error: any) {
    console.error("Error in Gemini streaming API:", error);
    const statusCode = error.status || 500;
    return NextResponse.json(
      {
        name: error.name || "Error",
        message: error.message || "Unknown error",
      },
      { status: statusCode }
    );
  }
}
