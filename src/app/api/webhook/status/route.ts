import { NextRequest, NextResponse } from "next/server";
import { getStatus } from "../../../../lib/webhookStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get("requestId");
    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: "requestId ausente" },
        { status: 400 }
      );
    }
    const entry = getStatus(requestId);
    const status = entry?.status ?? "pending";
    return NextResponse.json({ ok: true, status, message: entry?.message, data: entry?.data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro inesperado" },
      { status: 500 }
    );
  }
}