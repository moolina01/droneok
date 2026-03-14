import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import nodemailer from "nodemailer";

const FEEDBACK_FILE = path.join(process.cwd(), "data", "feedback.json");

const reactionLabel: Record<string, string> = {
  bad:  "😕 Malo",
  meh:  "😐 Regular",
  good: "🙂 Bueno",
  love: "🤩 Excelente",
};

async function readAll(): Promise<object[]> {
  try {
    const raw = await fs.readFile(FEEDBACK_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function sendEmail(entry: {
  reaction: string;
  message: string | null;
  email: string | null;
  createdAt: string;
  url: string | null;
}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return; // silently skip if not configured

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const lines = [
    `<b>Reacción:</b> ${reactionLabel[entry.reaction] ?? entry.reaction}`,
    entry.message ? `<b>Comentario:</b> ${entry.message}` : null,
    entry.email   ? `<b>Email del usuario:</b> ${entry.email}` : null,
    `<b>Página:</b> ${entry.url ?? "—"}`,
    `<b>Fecha:</b> ${new Date(entry.createdAt).toLocaleString("es-CL")}`,
  ].filter(Boolean);

  await transporter.sendMail({
    from: `"DroneOK Feedback" <${user}>`,
    to: "mhuryy22@gmail.com",
    subject: `[DroneOK] Nuevo feedback — ${reactionLabel[entry.reaction] ?? entry.reaction}`,
    html: `<div style="font-family:sans-serif;font-size:14px;line-height:1.8">${lines.join("<br/>")}</div>`,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { reaction, message, email } = await req.json();

    if (!reaction) {
      return NextResponse.json({ ok: false, error: "Reacción requerida" }, { status: 400 });
    }

    const entry = {
      id: Date.now().toString(),
      reaction,
      message: message?.trim() || null,
      email: email?.trim() || null,
      createdAt: new Date().toISOString(),
      url: req.headers.get("referer") || null,
    };

    // Save to file
    await fs.mkdir(path.dirname(FEEDBACK_FILE), { recursive: true });
    const all = await readAll();
    all.push(entry);
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(all, null, 2));

    // Send email (non-blocking — don't fail the request if email fails)
    sendEmail(entry).catch((e) => console.error("email error", e));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("feedback error", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
