# Gestão de Pedidos

Sistema de gestão de pedidos para confeitaria/doceria.

## Stack

- **API** — NestJS 11 · Prisma 7 · PostgreSQL · JWT (access + refresh) · Socket.io
- **Web** — Next.js 16 · App Router · Tailwind CSS v4 · shadcn/ui · Zustand · React Query
- **Infra** — Docker Compose · nginx (prod)

---

## Primeiro uso (desenvolvimento)

### 1. Pré-requisitos

- Node.js ≥ 22
- pnpm ≥ 10
- Docker Desktop

### 2. Variáveis de ambiente

Copie e ajuste o arquivo raiz:

```bash
cp .env.example .env
```

As principais variáveis:

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/gestao_pedidos` | Conexão Postgres |
| `JWT_SECRET` | — | **Troque por valor seguro** |
| `JWT_REFRESH_SECRET` | — | **Troque por valor seguro** |
| `WEB_URL` | `http://localhost:3000` | URL do frontend (CORS) |

### 3. Autorizar builds nativos (bcrypt + Prisma)

```bash
cd apps/api
pnpm approve-builds   # responda "y" para bcrypt e @prisma/engines
cd ../..
```

### 4. Subir banco de dados

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 5. Executar migrations e seed

```bash
cd apps/api
pnpm exec prisma migrate dev --name init
pnpm exec prisma db seed
cd ../..
```

Login inicial: `admin@gestao.local` / `admin123`
(mude via `SEED_ADMIN_PASSWORD=outrasenha pnpm exec prisma db seed`)

### 6. Iniciar em modo desenvolvimento

```bash
# Terminal 1 — API (porta 3001)
cd apps/api && pnpm start:dev

# Terminal 2 — Web (porta 3000)
cd apps/web && pnpm dev
```

Acesse: http://localhost:3000

---

## PWA

Para habilitar instalação como PWA em produção:

1. Instale o pacote compatível com Next.js 14+:
   ```bash
   cd apps/web
   pnpm add @ducanh2912/next-pwa
   ```
2. Descomente o bloco `withPWA` em [apps/web/next.config.ts](apps/web/next.config.ts).
3. Adicione ícones em `apps/web/public/icons/` (icon-192.png, icon-512.png).

---

## Produção (Docker Compose)

```bash
docker compose up -d --build
```

Serviços: `postgres`, `api`, `web`, `nginx` (porta 80/443).

---

## Perfis de usuário

| Perfil | Acesso |
|---|---|
| `ADMIN` | Tudo: pedidos, cozinha, clientes, produtos, usuários |
| `ATENDENTE` | Pedidos e clientes |
| `COZINHA` | Painel de cozinha (read + atualizar status produção) |
| `ENTREGADOR` | Pedidos em entrega |
