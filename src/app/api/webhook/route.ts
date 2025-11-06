import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = "https://webhook.rexusaigency.com/webhook/candidados";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: text || "Falha ao enviar webhook" },
        { status: res.status }
      );
    }

    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro inesperado" },
      { status: 500 }
    );
  }
}