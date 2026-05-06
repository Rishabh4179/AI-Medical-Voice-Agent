import { NextRequest, NextResponse } from "next/server";

const QA_PROMPT = `You are a helpful health assistant. Given the following medical report and conversation, answer the user's question in a clear, friendly, and concise way. If the question is not related to the report, politely say so.`;

export async function POST(req: NextRequest) {
  const { report, conversation, question } = await req.json();
  try {
    const userInput = `Medical Report: ${JSON.stringify(report)}\nConversation: ${JSON.stringify(conversation)}\nQuestion: ${question}`;
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: QA_PROMPT },
          { role: "user", content: userInput },
        ],
        temperature: 0.5,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json({ answer: null, error: String(e) }, { status: 500 });
  }
}