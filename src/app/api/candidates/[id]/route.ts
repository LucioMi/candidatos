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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { baseUrl, token } = getConfig();
    const payload = { ...body, id: params.id };
    const res = await fetch(`${baseUrl}/webhook/candidates.update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': token,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, error: text || 'Falha ao atualizar candidato' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro desconhecido' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { baseUrl, token } = getConfig();
    const res = await fetch(`${baseUrl}/webhook/candidates.delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': token,
      },
      body: JSON.stringify({ id: params.id }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, error: text || 'Falha ao excluir candidato' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro desconhecido' }, { status: 500 });
  }
}