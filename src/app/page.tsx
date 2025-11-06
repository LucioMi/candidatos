"use client";

import { useEffect, useMemo, useState } from "react";
// Toggle removido

type Candidate = {
  id?: string;
  nome_completo: string;
  email: string;
  telefone: string;
  area_interesse: string;
  data_cadastro: string; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
};

type Toast = { type: "success" | "error"; message: string } | null;

const today = () => new Date().toISOString().slice(0, 10);

const initialForm: Candidate = {
  nome_completo: "",
  email: "",
  telefone: "",
  area_interesse: "",
  data_cadastro: today(),
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatPhoneBR(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length <= 10) {
    // (XX) XXXX-XXXX
    const part1 = digits.slice(0, 2);
    const part2 = digits.slice(2, 6);
    const part3 = digits.slice(6, 10);
    return [
      part1 ? `(${part1}` : "",
      part1 && part1.length === 2 ? ") " : "",
      part2,
      part3 ? `-${part3}` : "",
    ].join("");
  }
  // (XX) XXXXX-XXXX
  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 7);
  const part3 = digits.slice(7, 11);
  return [
    part1 ? `(${part1}` : "",
    part1 && part1.length === 2 ? ") " : "",
    part2,
    part3 ? `-${part3}` : "",
  ].join("");
}

export default function Home() {
  const [list, setList] = useState<Candidate[]>([]);
  const [form, setForm] = useState<Candidate>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [toast, setToast] = useState<Toast>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listFiltered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (c) =>
        c.nome_completo.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
    );
  }, [list, search]);

  function showToast(next: Toast) {
    setToast(next);
    if (next) setTimeout(() => setToast(null), 3000);
  }

  async function triggerWebhook(
    categoria: "Cadastrar" | "Limpar" | "Buscar",
    onData?: (data: any) => void
  ) {
    try {
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria,
          data: {
            ...form,
            search,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      const json = await res.json();
      const requestId: string | undefined = json?.requestId;
      if (requestId) {
        void pollWebhookStatus(requestId, onData);
      }
      return json;
    } catch (_) {
      // Ignora erros do webhook para não atrapalhar UX principal
      return null;
    }
  }

  async function pollWebhookStatus(requestId: string, onData?: (data: any) => void) {
    const timeoutAt = Date.now() + 30_000; // 30s
    let status = "pending";
    while (Date.now() < timeoutAt && status === "pending") {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const res = await fetch(`/api/webhook/status?requestId=${encodeURIComponent(requestId)}`, { cache: "no-store" });
        const json = await res.json();
        status = json?.status || "pending";
        if (status === "success") {
          showToast({ type: "success", message: "Operação confirmada pelo n8n com sucesso." });
          if (onData && json?.data !== undefined) {
            onData(json.data);
          }
          return;
        }
        if (status === "error") {
          showToast({ type: "error", message: json?.message || "O n8n retornou erro no processamento." });
          return;
        }
      } catch (_) {
        // Continua tentando até timeout
      }
    }
  }

  async function refresh() {
    try {
      setLoadingList(true);
      const res = await fetch("/api/candidates", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Erro ao listar");
      const items: Candidate[] = Array.isArray(json.data)
        ? json.data
        : json.data?.items || [];
      setList(items);
    } catch (e: any) {
      showToast({ type: "error", message: e?.message || "Erro ao buscar" });
    } finally {
      setLoadingList(false);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome_completo || form.nome_completo.trim().length < 3) {
      e.nome_completo = "Preencha o nome completo (mín. 3 caracteres)";
    }
    if (!form.email || !emailRegex.test(form.email)) {
      e.email = "Preencha um e-mail válido";
    }
    if (!form.area_interesse) {
      e.area_interesse = "Selecione a área de interesse";
    }
    if (!form.data_cadastro) {
      e.data_cadastro = "Informe a data de cadastro";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      // Dispara webhook e inicia polling por confirmação do n8n
      await triggerWebhook("Cadastrar");
      const payload = { ...form };
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/candidates/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/candidates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Falha na operação");
      showToast({ type: "success", message: editingId ? "Alterações salvas" : "Cadastrado com sucesso" });
      setForm(initialForm);
      setEditingId(null);
      setErrors({});
      // Atualiza a lista sem sobrescrever o toast de sucesso em caso de falha
      try {
        await refresh();
      } catch (_) {
        // Silencia erro de atualização de lista para manter a confirmação de sucesso
      }
    } catch (err: any) {
      showToast({ type: "error", message: err?.message || "Erro inesperado" });
    } finally {
      setLoading(false);
    }
  }

  function startEdit(c: Candidate) {
    setForm({
      nome_completo: c.nome_completo || "",
      email: c.email || "",
      telefone: c.telefone || "",
      area_interesse: c.area_interesse || "",
      data_cadastro: c.data_cadastro || today(),
    });
    setEditingId(c.id || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmRemove() {
    if (!confirmDeleteId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/candidates/${confirmDeleteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Falha ao excluir");
      showToast({ type: "success", message: "Registro excluído" });
      setConfirmDeleteId(null);
      await refresh();
    } catch (err: any) {
      showToast({ type: "error", message: err?.message || "Erro ao excluir" });
    } finally {
      setLoading(false);
    }
  }

  function clearForm() {
    // Dispara webhook e inicia polling por confirmação do n8n
    void triggerWebhook("Limpar");
    setForm(initialForm);
    setEditingId(null);
    setErrors({});
    showToast({ type: "success", message: "Formulário limpo com sucesso" });
  }

  function onChange<K extends keyof Candidate>(key: K, value: Candidate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function exportCSV() {
    const headers = ["Nome", "E-mail", "Telefone", "Área", "Data de cadastro"];
    const rows = listFiltered.map((c) => [
      c.nome_completo,
      c.email,
      c.telefone,
      c.area_interesse,
      c.data_cadastro,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${(cell ?? "").toString().replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidatos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto p-6 space-y-8 font-sans">
        <div className="flex items-center justify-start">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white">Cadastro de Candidatos</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">Insira, visualize e exclua candidatos.</p>
          </div>
        </div>
        <section className="rounded-2xl shadow border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">

          {toast && (
            <div
              className={`mt-4 rounded-lg p-3 text-sm ${
                toast.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {toast.message}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Nome completo*</label>
              <input
                type="text"
                required
                minLength={3}
                placeholder="Nome completo"
                value={form.nome_completo}
                onChange={(e) => onChange("nome_completo", e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:bg-zinc-900 dark:text-white"
              />
              {errors.nome_completo && (
                <p className="mt-1 text-xs text-red-600">{errors.nome_completo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">E-mail*</label>
              <input
                type="email"
                required
                placeholder="E-mail"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:bg-zinc-900 dark:text-white"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Telefone</label>
              <input
                type="text"
                placeholder="Telefone"
                value={form.telefone}
                onChange={(e) => onChange("telefone", formatPhoneBR(e.target.value))}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:bg-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Área de interesse*</label>
              <select
                required
                value={form.area_interesse}
                onChange={(e) => onChange("area_interesse", e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:bg-zinc-900 dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="Marketing">Marketing</option>
                <option value="Vendas">Vendas</option>
                <option value="TI">TI</option>
                <option value="Operações">Operações</option>
              </select>
              {errors.area_interesse && (
                <p className="mt-1 text-xs text-red-600">{errors.area_interesse}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Data de cadastro</label>
              <input
                type="date"
                required
                value={form.data_cadastro}
                onChange={(e) => onChange("data_cadastro", e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:bg-zinc-900 dark:text-white"
              />
              {errors.data_cadastro && (
                <p className="mt-1 text-xs text-red-600">{errors.data_cadastro}</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`rounded-lg px-4 py-2 font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white ${
                  loading ? "bg-zinc-800/70" : "bg-black hover:bg-zinc-900"
                } disabled:cursor-not-allowed`}
              >
                {loading ? (editingId ? "Salvando..." : "Cadastrando...") : editingId ? "Salvar alterações" : "Cadastrar"}
              </button>
              <button
                type="button"
                onClick={clearForm}
                disabled={loading}
                className="rounded-lg px-4 py-2 font-medium border transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:cursor-not-allowed"
              >
                Limpar
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl shadow border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-2/3 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:bg-zinc-900 dark:text-white"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  // Dispara webhook de busca e usa a resposta para preencher a lista
                  try {
                    setLoadingList(true);
                    // Limpa o formulário ao clicar em Buscar
                    setForm(initialForm);
                    setEditingId(null);
                    setErrors({});
                    const resp = await triggerWebhook("Buscar", (data) => {
                      const items: Candidate[] = Array.isArray(data)
                        ? data
                        : (data?.items as Candidate[]) || [];
                      setList(items || []);
                    });
                    if (resp && resp.ok) {
                      const payload = resp.data;
                      const items: Candidate[] = Array.isArray(payload)
                        ? payload
                        : (payload?.items as Candidate[]) || [];
                      if (items && items.length >= 0) {
                        setList(items);
                        showToast({ type: "success", message: "Busca realizada com sucesso" });
                      }
                    } else if (resp && resp.error) {
                      showToast({ type: "error", message: resp.error || "Falha ao buscar via webhook" });
                    } else {
                      showToast({ type: "error", message: "Falha ao buscar via webhook" });
                    }
                  } catch (err: any) {
                    showToast({ type: "error", message: err?.message || "Erro ao buscar" });
                  } finally {
                    setLoadingList(false);
                  }
                }}
                disabled={loadingList}
                className="rounded-lg px-4 py-2 font-medium border transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:cursor-not-allowed"
              >
                {loadingList ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {listFiltered.length === 0 ? (
              <p className="text-zinc-600">Sem registros ainda.</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Nome</th>
                    <th className="py-2">E-mail</th>
                    <th className="py-2">Telefone</th>
                    <th className="py-2">Área</th>
                    <th className="py-2">Data de cadastro</th>
                    <th className="py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listFiltered.map((c) => (
                    <tr key={c.id || `${c.email}-${c.nome_completo}`} className="border-b transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <td className="py-2 pr-2">{c.nome_completo}</td>
                      <td className="py-2 pr-2">{c.email}</td>
                      <td className="py-2 pr-2">{c.telefone}</td>
                      <td className="py-2 pr-2">{c.area_interesse}</td>
                      <td className="py-2 pr-2">{c.data_cadastro}</td>
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-md border px-2 py-1 text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                            onClick={() => startEdit(c)}
                          >
                            Editar
                          </button>
                          <button
                            className="rounded-md bg-red-600 text-white px-2 py-1 text-xs transition-colors hover:bg-red-700"
                            onClick={() => setConfirmDeleteId(c.id || "")}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-950 p-6 shadow-lg">
              <h3 className="text-lg font-semibold">Confirmar exclusão</h3>
              <p className="text-sm text-zinc-600 mt-1">Tem certeza que deseja excluir este candidato?</p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={confirmRemove}
                  className="rounded-lg px-4 py-2 font-medium bg-black text-white transition-colors hover:bg-zinc-900"
                >
                  {loading ? "Excluindo..." : "Excluir"}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded-lg px-4 py-2 font-medium border transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
