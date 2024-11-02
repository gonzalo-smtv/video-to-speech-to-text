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
  try {
    return NextResponse.json({ text: "hola mundo" });
    // const body = await req.json();
    // const base64Audio = body.audio;
    // const audio = Buffer.from(base64Audio, "base64");
    // const filePath = "tmp/input.mp3";

    // fs.writeFileSync(filePath, audio);
    // const readStream = fs.createReadStream(filePath);
    // const data = await openai.audio.transcriptions.create({
    //   file: readStream,
    //   model: "whisper-1",
    // });
    // // Remove the file after use
    // fs.unlinkSync(filePath);

    // console.log("data: ", data);
    // return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.error();
  }
}
