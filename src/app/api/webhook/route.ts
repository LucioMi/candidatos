import { NextRequest, NextResponse } from "next/server";
import { createPending } from "../../../lib/webhookStore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoria, data, requestId: incomingId } = body || {};
    const requestId = incomingId || crypto.randomUUID();
    // registra estado pendente para posterior callback do n8n
    createPending(requestId, { categoria, data });
    const url = "https://webhook.rexusaigency.com/webhook/candidados";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria, data, requestId }),
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: text || "Falha ao enviar webhook" },
        { status: res.status }
      );
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    return NextResponse.json({ ok: true, data: parsed, requestId });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro inesperado" },
      { status: 500 }
    );
  }
}