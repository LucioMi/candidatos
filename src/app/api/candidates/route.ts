import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getConfig() {
  const baseUrl = process.env.N8N_BASE_URL;
  const token = process.env.N8N_TOKEN;
  if (!baseUrl || !token) {
    throw new Error('Variáveis de ambiente N8N_BASE_URL e N8N_TOKEN são obrigatórias.');
  }
  return { baseUrl, token };
}

export async function GET() {
  try {
    const { baseUrl, token } = getConfig();
    const res = await fetch(`${baseUrl}/webhook/candidates.list`, {
      method: 'GET',
      headers: { 'X-API-KEY': token },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, error: text || 'Falha ao listar candidatos' }, { status: res.status, headers: { 'Cache-Control': 'no-store' } });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro desconhecido' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { baseUrl, token } = getConfig();
    const res = await fetch(`${baseUrl}/webhook/candidates.create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': token,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, error: text || 'Falha ao criar candidato' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro desconhecido' }, { status: 500 });
  }
}