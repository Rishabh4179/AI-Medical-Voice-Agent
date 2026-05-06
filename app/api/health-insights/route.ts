import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/config/OpenAiModel";

const INSIGHTS_PROMPT = `You are a health assistant. Given the following medical report and conversation, provide 2-3 personalized, practical health tips or lifestyle recommendations for the user. Be specific, actionable, and friendly. Do not repeat the report. If information is missing, give general wellness advice.`;

export async function POST(req: NextRequest) {
  const { report, conversation } = await req.json();
  try {
    const userInput = `Medical Report: ${JSON.stringify(report)}\nConversation: ${JSON.stringify(conversation)}`;
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      temperature: 0.5,
      messages: [
        { role: "system", content: INSIGHTS_PROMPT },
        { role: "user", content: userInput },
      ],
    });
    const insights = completion.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ insights });
  } catch (e) {
    return NextResponse.json({ insights: null, error: String(e) }, { status: 500 });
  }
}
