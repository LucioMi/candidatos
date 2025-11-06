import { NextRequest, NextResponse } from "next/server";
import { setStatus } from "../../../../lib/webhookStore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, status, message, data } = body || {};
    if (!requestId || !status) {
      return NextResponse.json(
        { ok: false, error: "requestId e status são obrigatórios" },
        { status: 400 }
      );
    }
    if (!["success", "error", "pending"].includes(status)) {
      return NextResponse.json(
        { ok: false, error: "status inválido" },
        { status: 400 }
      );
    }
    setStatus(requestId, { status, message, data });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro inesperado" },
      { status: 500 }
    );
  }
}