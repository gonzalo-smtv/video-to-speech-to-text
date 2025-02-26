import * as dotenv from "dotenv";
import fs from "fs";
import { NextResponse } from "next/server";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @ts-ignore
export async function POST(req) {
  const filePath = "tmp/input.m4a";

  try {
    const body = await req.json();
    const base64Audio = body.audio;

    const audio = Buffer.from(base64Audio, "base64");

    fs.writeFileSync(filePath, audio);
    const readStream = fs.createReadStream(filePath);
    const data = await openai.audio.transcriptions.create({
      file: readStream,
      model: "whisper-1",
    });

    // Remove the file after use
    fs.unlinkSync(filePath);

    return NextResponse.json({ text: data.text });
  } catch (error) {
    fs.unlinkSync(filePath);

    console.error("Error processing audio:", error);
    return NextResponse.error();
  }
}
