import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const restaurant = String(body?.restaurant ?? "").trim();
    const city = String(body?.city ?? "").trim();

    if (!name || !phone || !restaurant) {
      return NextResponse.json(
        { error: "Please provide your name, phone, and restaurant name." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const conn = (global as any).mongooseCache?.conn;
    const db = conn?.connection?.db;
    if (!db) {
      return NextResponse.json({ error: "Database not available." }, { status: 500 });
    }

    await db.collection("demo_requests").insertOne({
      name,
      phone,
      restaurant,
      city: city || null,
      createdAt: new Date(),
      userAgent: req.headers.get("user-agent"),
      referer: req.headers.get("referer")
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to submit demo request." },
      { status: 500 }
    );
  }
}

