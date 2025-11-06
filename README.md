# Cadastro de Candidatos — Next.js + Tailwind

Aplicativo simples para cadastrar, visualizar, editar e excluir candidatos. Front-end em Next.js (App Router) consumindo webhooks do n8n via rotas de API internas (proxy). Dados persistidos em Google Sheets pelo n8n.

## Setup

1) Instalação local

- Requisitos: Node.js 18+.
- Instale dependências: `npm install`
- Execute dev: `npm run dev` e acesse `http://localhost:3000`

2) Variáveis de ambiente (Vercel)

Crie as variáveis no projeto na Vercel:

- `N8N_BASE_URL` = `https://SEU-N8N.com`
- `N8N_TOKEN` = `xxxx`

Opcionalmente, crie um `.env.local` com:

```
N8N_BASE_URL=https://SEU-N8N.com
N8N_TOKEN=xxxx
```

3) Webhooks no n8n

Verifique os 4 webhooks (todos validam header `X-API-KEY`):

- `GET /webhook/candidates.list`
- `POST /webhook/candidates.create`
- `PUT /webhook/candidates.update`
- `DELETE /webhook/candidates.delete`

## Arquitetura

- Next.js 14+ com App Router (`src/app/`), TypeScript e Tailwind.
- Rotas internas (proxy) que chamam os webhooks do n8n sem expor as URLs reais no cliente:
  - `GET /api/candidates` → `GET {N8N_BASE_URL}/webhook/candidates.list`
  - `POST /api/candidates` → `POST {N8N_BASE_URL}/webhook/candidates.create`
  - `PUT /api/candidates/[id]` → `PUT {N8N_BASE_URL}/webhook/candidates.update` (body inclui `id`)
  - `DELETE /api/candidates/[id]` → `DELETE {N8N_BASE_URL}/webhook/candidates.delete` (body `{ id }`)
- Todas as chamadas enviam header `X-API-KEY: N8N_TOKEN`.
- GET sem cache (força `no-store`).

## Como usar

- Acesse a URL do app (local ou Vercel).
- Cadastre via formulário, edite pela lista (botão "Editar"), exclua com confirmação.
- Use a busca para filtrar por nome/e-mail.
- Botão "Limpar" zera apenas o formulário.
- Exportar CSV disponível na barra de busca.

## Modelo de dados (frontend)

```
type Candidate = {
  id?: string; // gerado no n8n
  nome_completo: string;
  email: string;
  telefone: string;
  area_interesse: string;
  data_cadastro: string; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
};
```

## Segurança mínima

- `N8N_BASE_URL` nunca é exposto no cliente — apenas o Next API chama o n8n.
- Tratamento de erros com `try/catch` nas rotas; respostas seguem `{ ok: false, error: string }` em falha.

## Aceite (checklist)

- Inserir, visualizar e editar registros (funcionando)
- Excluir por linha com confirmação
- Limpar formulário sem afetar lista
- Busca por nome/e-mail no client
- Sem cache no GET de listagem
- UI responsiva e clara
- `.env` com `N8N_BASE_URL` e `N8N_TOKEN` (documentado aqui)

## Notas

- Dados persistidos em Google Sheets via n8n.
- `id` é gerado no n8n e retorna para o front.
- Campos extras (`created_at`, `updated_at`) podem aparecer na resposta, mas não são obrigatórios na UI.

## Deploy

- Faça deploy no Vercel normalmente (importando este repositório).
- Configure as variáveis de ambiente na Vercel antes de publicar.
