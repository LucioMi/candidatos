# Cadastro de Candidatos — Next.js + Tailwind + n8n

Aplicativo para cadastrar, buscar e limpar candidatos com UX baseada em modais. O front-end (Next.js + Tailwind) integra com um fluxo no n8n via webhooks e rotas internas (proxy). A persistência é feita em Google Sheets pelo n8n.

## Visão Geral

- Interface simples para:
  - `Cadastrar`: limpa o formulário imediatamente e exibe um modal de agradecimento.
  - `Buscar`: busca por e-mail, abre um modal com os resultados (tabela) e atualiza a lista.
  - `Limpar`: seção separada com e-mail; exibe um modal “Apagado com sucesso” e solicita a remoção no n8n.
- Integração com n8n via `POST /api/webhook`; resposta imediata do n8n alimenta a UI. Polling opcional via callback.
- Normalização de dados robusta para diferentes formatos de resposta do n8n e colunas do Google Sheets em português.

## Instalação

- Requisitos: Node.js 18+.
- Instalação: `npm install`
- Dev: `npm run dev` e acessar `http://localhost:3000`

## Variáveis de Ambiente

Em Vercel ou `.env.local`:

```
N8N_BASE_URL=https://SEU-N8N.com
N8N_TOKEN=xxxx
```

## Endpoints Internos (Proxy)

- `GET /api/candidates` → `GET {N8N_BASE_URL}/webhook/candidates.list`
- `POST /api/candidates` → `POST {N8N_BASE_URL}/webhook/candidates.create`
- `PUT /api/candidates/[id]` → `PUT {N8N_BASE_URL}/webhook/candidates.update`
- `DELETE /api/candidates/[id]` → `DELETE {N8N_BASE_URL}/webhook/candidates.delete`
- Todas as chamadas enviam `X-API-KEY: N8N_TOKEN`.

## Webhook Principal e Callback

- `POST /api/webhook` envia para o endpoint externo do fluxo n8n com o corpo:
  - `{ categoria: "Cadastrar" | "Buscar" | "Limpar", data: { ...campos }, requestId }`
  - Exemplo de corpo em `Buscar`: `{ categoria: "Buscar", data: { search: "email@dominio.com", timestamp: "..." }, requestId }`
- Resposta imediata do n8n é usada para abrir o modal de resultados.
- `GET /api/webhook/status?requestId=...` faz polling do status armazenado em memória.
- `POST /api/webhook/callback` (opcional no n8n): enviar `{ requestId, status: "success" | "error", data }` para confirmar assíncrono.

## Funcionalidades e UX

- `Cadastrar`
  - Valida campos, limpa o formulário imediatamente e abre modal “Obrigado! Cadastro completo”.
  - Dispara webhook “Cadastrar” e registra no Google Sheets via n8n.
  - Atualiza a lista após a operação.
- `Buscar` (apenas por e-mail)
  - Campo de busca aceita e-mail; botão `Buscar` abre modal “Resultados da busca”.
  - Modal exibe tabela com `Nome`, `E-mail`, `Telefone`, `Área` com fallbacks `-` quando vazio.
  - Resposta imediata do n8n (Respond to Webhook) e, opcionalmente, callback preenchem o modal.
- `Limpar`
  - Seção com campo “E-mail para limpar...” e botão `Limpar`.
  - Mostra modal “Apagado com sucesso” e solicita remoção ao n8n.

## Normalização de Dados

- O sistema aceita arrays em diferentes chaves comuns do n8n: `data`, `data.items`, `items`, `result`, `result.items`, `rows`, `records`, `hits`, `list`.
- Mapeamento de colunas do Google Sheets para o formato interno:
  - `nome_completo` ← `nome_completo` | `nome` | `"Nome completo"`
  - `email` ← `email` | `"E-mail"`
  - `telefone` ← `telefone` | `"Telefone"`
  - `area_interesse` ← `area_interesse` | `area` | `"Área de interesse"`
  - `data_cadastro` ← `data_cadastro` | `"Data de cadastro"`
- Limpeza de espaços em branco: strings como `" "` são tratadas como vazias; escolhemos o primeiro valor realmente preenchido.

## Fluxo n8n (Resumo)

- Webhook Node: caminho `candidados` (manter igual no front e no n8n).
- Switch por `categoria`:
  - `Cadastrar` → Append/Update no Google Sheets → Respond to Webhook.
  - `Buscar` → Get rows filtrando `E-mail == $json.body.data.search` → Respond to Webhook.
  - `Limpar` → Get row(s) por `E-mail` → Clear sheet (linha) → Respond to Webhook.
- Opcional: adicionar HTTP Request ao final para `POST /api/webhook/callback` com `{ requestId, status: "success", data }`.

## Dicas e Solução de Problemas

- Modal vazio na busca:
  - Verifique se o e-mail buscado existe exatamente no Sheets.
  - Garanta que o n8n responde um array ou `items` com colunas esperadas.
- Endpoint externo:
  - Certifique-se de que o caminho do webhook no n8n e no front é idêntico (`candidados`).
- Callback opcional:
  - Se desejar confirmação assíncrona/polling, implemente o `POST /api/webhook/callback` no fluxo n8n.

## Scripts

- `npm run dev`: executa o servidor de desenvolvimento.
- `npm run build`: build de produção.
- `npm start`: serve a build.
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
