<div align="center">

# SIGCEM

**Sistema Integrado de Gestão de Cemitérios e Serviços Funerários**

Plataforma GovTech para modernização da gestão cemiterial municipal.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql)
![Keycloak](https://img.shields.io/badge/Keycloak-24-4D4D4D?style=flat-square&logo=keycloak)

</div>

---

## ✦ Sobre o projeto

O SIGCEM substitui livros físicos, planilhas e controles manuais por uma solução web segura, auditável e conforme a LGPD — desenvolvida para prefeituras e autarquias municipais.

**Principais características:**
- 🏛️ Multi-tenant — um sistema, vários municípios
- 🔐 Autenticação via Keycloak (OpenID Connect)
- 📋 Auditoria completa de todas as operações
- 🛡️ Proteção de dados sensíveis (LGPD)
- 🗂️ Rastreabilidade de sepultamentos, exumações e translados
- 🌐 Portal público de consulta de falecidos

---

## ⚙️ Stack

| Camada | Tecnologia |
|---|---|
| **Frontend** | Next.js 15 · React 18 · TypeScript · Shadcn/UI · TailwindCSS |
| **Backend** | NestJS 10 · TypeScript · Passport JWT |
| **ORM** | Prisma 6 |
| **Banco** | PostgreSQL via Neon |
| **Auth** | Keycloak 24 (OIDC / OAuth 2.0) |
| **Cache** | Redis 7 |
| **Storage** | MinIO |
| **Infra** | Docker Compose · Nginx |

---

## 🚀 Subindo o ambiente

### Pré-requisitos

- **Node.js** >= 20
- **pnpm** >= 9
- **Docker** e Docker Compose

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha os campos obrigatórios no `.env`:

| Variável | Como gerar |
|---|---|
| `DATABASE_URL` | URL Neon (pooled) |
| `DIRECT_DATABASE_URL` | URL Neon (sem `-pooler` no host) |
| `KEYCLOAK_ADMIN_PASSWORD` | Escolha uma senha forte |
| `KEYCLOAK_DB_PASSWORD` | Escolha uma senha forte |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` |

### 3. Subir a infraestrutura

```bash
pnpm infra:up
```

> O Keycloak pode levar até 60 segundos para inicializar no primeiro boot.
> O realm `sigcem` é importado automaticamente via `keycloak/realm-export.json`.

Serviços disponíveis:

| Serviço | URL |
|---|---|
| Keycloak Admin | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |
| Redis | localhost:6379 |

### 4. Banco de dados

```bash
pnpm db:generate   # gera o Prisma Client
pnpm db:migrate    # cria as tabelas no Neon
pnpm db:seed       # popula com dados de teste
```

### 5. Rodar os apps

```bash
# Terminal 1 — Backend em http://localhost:3001
pnpm dev:api

# Terminal 2 — Frontend em http://localhost:3000
pnpm dev:web
```

### ✅ Verificar saúde da API

```bash
curl http://localhost:3001/api/v1/health
# { "status": "ok" }
```

---

## 👤 Usuários de teste

Criados automaticamente no Keycloak:

| Usuário | Senha | Perfil |
|---|---|---|
| admin@sigcem.local | Admin@123 | ADMIN |
| gestor@sigcem.local | Gestor@123 | GESTOR |
| operador@sigcem.local | Operador@123 | OPERADOR |

> Todos pertencem ao tenant de testes `00000000-0000-0000-0000-000000000001`.

---

## 📁 Estrutura do projeto

```
sigcem/
├── apps/
│   ├── api/                       # Backend NestJS
│   │   ├── prisma/
│   │   │   └── schema.prisma      # Modelos e migrations
│   │   └── src/
│   │       ├── modules/           # Módulos de domínio
│   │       │   ├── health/
│   │       │   └── iam/
│   │       └── shared/            # Guards, decorators, Prisma
│   │           ├── database/
│   │           ├── decorators/
│   │           ├── guards/
│   │           ├── strategies/
│   │           └── types/
│   └── web/                       # Frontend Next.js
│       └── src/
│           ├── app/
│           │   ├── (auth)/        # Telas públicas (login)
│           │   ├── (protected)/   # Telas autenticadas
│           │   └── api/auth/      # Handler next-auth
│           ├── components/
│           │   ├── layout/        # Header e Sidebar
│           │   └── providers/     # SessionProvider
│           └── lib/               # auth, api, utils
├── keycloak/
│   └── realm-export.json          # Realm importado automaticamente
├── .env.example                   # Modelo de variáveis
├── docker-compose.yml             # Infraestrutura de desenvolvimento
└── pnpm-workspace.yaml            # Configuração do monorepo
```

---

## 🛠️ Comandos

```bash
# Infraestrutura
pnpm infra:up            # Sobe Docker Compose
pnpm infra:down          # Derruba Docker Compose

# Banco de dados
pnpm db:generate         # Gera Prisma Client
pnpm db:migrate          # Cria/atualiza tabelas (dev)
pnpm db:migrate:prod     # Aplica migrations em produção
pnpm db:seed             # Popula o banco com dados de teste
pnpm db:studio           # Abre Prisma Studio

# Apps
pnpm dev:api             # NestJS em modo watch
pnpm dev:web             # Next.js em modo dev
pnpm build:api           # Build do backend
pnpm build:web           # Build do frontend
```

---

## 📚 Documentação técnica

| Documento | Conteúdo |
|---|---|
| [Especificação](.docs/04-fases/fase1-mvp/especificacao.md) | Regras de negócio, casos de uso, entidades, LGPD |
| [Arquitetura](.docs/04-fases/fase1-mvp/arquitetura.md) | Bounded contexts, schema Prisma, APIs |
| [Planejamento](.docs/04-fases/fase1-mvp/planejamento.md) | Fases, dependências, riscos |
| [Backlog](.docs/04-fases/fase1-mvp/backlog.md) | 49 tasks em 6 epics |
| [Apresentação](.docs/03-apresentacao/objetivo-fase1-mvp.md) | Visão executiva do produto |

---

<div align="center">
  <sub>SIGCEM · Gestão cemiterial que respeita o passado e organiza o futuro.</sub>
</div>
