import { db } from "@/config/db";
import { openai } from "@/config/OpenAiModel";
import { sessionChatTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const REPORT_GEN_PROMPT = `You are an AI medical report generator. Using the doctor agent info and the full conversation transcript, extract a concise medical report. Populate each field ONLY from what appears in the transcript; do not invent data. If a piece of information is missing, use an empty string or empty array as appropriate.

Required JSON shape:
{
  "sessionId": "string",
  "agent": "string",
  "user": "string",
  "timestamp": "ISO Date string",
  "chiefComplaint": "string",
  "summary": "string",
  "symptoms": ["symptom1", "symptom2"],
  "duration": "string",
  "severity": "string",
  "medicationsMentioned": ["med1", "med2"],
  "recommendations": ["rec1", "rec2"]
}

Guidelines:
- chiefComplaint: one sentence reflecting the primary concern stated by the user.
- symptoms: list only symptoms explicitly mentioned.
- duration: extract phrases like "for 2 weeks", "since yesterday".
- severity: mild, moderate, severe if stated; else empty.
- medicationsMentioned: list medicine names, dosages, or over-the-counter products mentioned by either party.
- recommendations: include care advice or next steps explicitly given by the AI/doctor.
- Output strictly valid JSON with no markdown, no comments, no surrounding text.`;

function extractFromMessages(messages: any[], sessionDetail: any) {
  const userTexts = (messages || []).filter((m: any) => String(m?.role || '').toLowerCase() === 'user').map((m: any) => String(m?.text || ''));
  const assistantTexts = (messages || []).filter((m: any) => String(m?.role || '').toLowerCase() !== 'user').map((m: any) => String(m?.text || ''));
  const allText = (userTexts.join(' ') + ' ' + assistantTexts.join(' ')).toLowerCase();

  const symptomsKeywords = ['fever','cough','cold','headache','rash','itch','pain','nausea','vomit','dizziness','fatigue','sore throat','congestion','shortness of breath','diarrhea','back pain','knee pain','shoulder pain','swelling'];
  const symptoms = Array.from(new Set(symptomsKeywords.filter((k) => allText.includes(k))));

  const durationRegexes = [
    /\b(for|since|past)\s+[a-z0-9\s\-]+?(day|days|week|weeks|month|months|hour|hours)\b/,
    /\b\d+\s?(day|days|week|weeks|month|months|hour|hours)\b/
  ];
  let duration = '';
  for (const r of durationRegexes) {
    const m = allText.match(r);
    if (m) { duration = m[0]; break; }
  }

  const sevMatch = allText.match(/\b(mild|moderate|severe)\b/);
  const severity = sevMatch ? sevMatch[0] : '';

  const medList = ['paracetamol','acetaminophen','ibuprofen','amoxicillin','azithromycin','cetirizine','omeprazole','dolo','augmentin','metformin','insulin','naproxen','diclofenac'];
  const meds: string[] = [];
  medList.forEach((m) => { if (allText.includes(m)) meds.push(m); });
  const doseMatches = (userTexts.join(' ') + ' ' + assistantTexts.join(' ')).match(/\b\d{2,4}\s?mg\b/g) || [];
  const medicationsMentioned = Array.from(new Set([...meds, ...doseMatches]));

  const recPhrases = ['recommend','suggest','should','please','advise','consider','take','see a doctor','consult','rest','hydrate','ice','physiotherapy','avoid','diet','exercise'];
  const recommendations: string[] = [];
  assistantTexts.forEach((t) => {
    const lower = t.toLowerCase();
    if (recPhrases.some((p) => lower.includes(p))) {
      recommendations.push(t);
    }
  });

  const chiefComplaint = userTexts[0] || String(sessionDetail?.notes || '');
  let summary = '';
  if (chiefComplaint || symptoms.length || duration || severity || recommendations.length) {
    summary =
      `Patient reports ${chiefComplaint || 'a health concern'}.` +
      (symptoms.length ? ` Symptoms: ${symptoms.join(', ')}.` : '') +
      (duration ? ` Duration: ${duration}.` : '') +
      (severity ? ` Severity: ${severity}.` : '') +
      (recommendations.length ? ` Recommendations include ${recommendations.slice(0,2).join('; ')}.` : '');
  }

  return { chiefComplaint, symptoms, duration, severity, medicationsMentioned, recommendations, summary };
}

export async function POST(req: NextRequest) {
  const { sessionId, sessionDetail, messages } = await req.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "No conversation messages provided" },
      { status: 400 }
    );
  }

  try {
    const fallback = extractFromMessages(messages, sessionDetail);
    const UserInput =
      "AI Doctor Agent Info: " +
      JSON.stringify(sessionDetail) +  
      ", Conversation: " +
      JSON.stringify(messages);

    let JSONResp: any = {};
    try {
      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-3.5-sonnet",
        temperature: 0.2,
        messages: [
          { role: "system", content: REPORT_GEN_PROMPT },
          { role: "user", content: UserInput },
        ],
      });

      const choice = completion.choices?.[0];
      let contentStr = "";
      const c: any = choice?.message?.content;
      if (typeof c === "string") {
        contentStr = c;
      } else if (Array.isArray(c)) {
        const textPart = c.find((p: any) => typeof p?.text === "string")?.text ?? "";
        contentStr = textPart || JSON.stringify(c);
      }
      contentStr = contentStr.trim().replace(/```json\s*|\s*```/g, "");

      try {
        JSONResp = JSON.parse(contentStr);
      } catch {
        const match = contentStr.match(/\{[\s\S]*\}/);
        JSONResp = match ? JSON.parse(match[0]) : {};
      }
    } catch (aiError) {
      console.error("AI report generation failed, using fallback report:", aiError);
    }

    JSONResp.sessionId = JSONResp.sessionId || sessionId;
    JSONResp.agent = JSONResp.agent || sessionDetail?.selectedDoctor?.specialist || "";
    JSONResp.user = JSONResp.user || "Anonymous";
    JSONResp.timestamp = JSONResp.timestamp || new Date().toISOString();

    const mergeArray = (a: any, b: any) => (Array.isArray(a) && a.length > 0 ? a : (Array.isArray(b) ? b : []));
    JSONResp.symptoms = mergeArray(JSONResp.symptoms, fallback.symptoms);
    JSONResp.medicationsMentioned = mergeArray(JSONResp.medicationsMentioned, fallback.medicationsMentioned);
    JSONResp.recommendations = mergeArray(JSONResp.recommendations, fallback.recommendations);

    JSONResp.duration = JSONResp.duration || fallback.duration || "";
    JSONResp.severity = JSONResp.severity || fallback.severity || "";
    JSONResp.chiefComplaint = JSONResp.chiefComplaint || fallback.chiefComplaint || "";
    JSONResp.summary = JSONResp.summary || fallback.summary || "";

    await db.update(sessionChatTable).set({
      report: JSONResp,
      conversation: messages,
    }).where(eq(sessionChatTable.sessionId, sessionId));

    return NextResponse.json(JSONResp);
  } catch (e: any) {
    console.error("Medical report generation error:", e);
    return NextResponse.json(
      { error: "Failed to generate report", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
