import { db } from "@/config/db";
import { sessionChatTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { eq, desc, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { notes, selectedDoctor } = await req.json();
  const user = await currentUser();

  try {
    const sessionId = uuidv4();
    const result = await db
      .insert(sessionChatTable)
      .values({
        sessionId: sessionId,
        createdBy: user?.primaryEmailAddress?.emailAddress,
        notes: notes,
        selectedDoctor: selectedDoctor,
        createdOn: new Date().toString(),
      }) //@ts-ignore
      .returning({ sessionChatTable });

    return NextResponse.json(result[0]?.sessionChatTable);
  } catch (e) {
    console.error("Session creation error:", e);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const user = await currentUser();

    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    if (sessionId === "all") {
      const result = await db
        .select()
        .from(sessionChatTable)
        .where(eq(sessionChatTable.createdBy, email))
        .orderBy(desc(sessionChatTable.id));
      return NextResponse.json(result);
    }

    const result = await db
      .select()
      .from(sessionChatTable)
      .where(
        and(
          eq(sessionChatTable.sessionId, sessionId),
          eq(sessionChatTable.createdBy, email)
        )
      );

    if (!result[0]) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (e) {
    console.error("Session history fetch error:", e);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const user = await currentUser();

    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    await db
      .delete(sessionChatTable)
      .where(
        and(
          eq(sessionChatTable.sessionId, sessionId),
          eq(sessionChatTable.createdBy, email)
        )
      );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Session delete error:", e);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}