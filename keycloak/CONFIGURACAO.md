# Configuração do Keycloak — SIGCEM

O Keycloak é responsável **apenas pela autenticação** (quem você é).  
Gerenciamento de usuários, papéis e vínculos com entidades (municípios) é feito pela própria aplicação.

---

## 1. Acessar o painel administrativo

URL: `http://localhost:8080`  
Login: variáveis `KEYCLOAK_ADMIN` e `KEYCLOAK_ADMIN_PASSWORD` do `.env`

---

## 2. Criar o Realm

1. No menu lateral, clique em **Keycloak** (dropdown do realm atual) → **Create realm**
2. Preencha:
   - **Realm name:** `sigcem`
   - **Enabled:** ON
3. Clique em **Create**

---

## 3. Criar o Client da aplicação web

1. No realm `sigcem`, vá em **Clients** → **Create client**

**Aba General Settings:**
| Campo | Valor |
|---|---|
| Client type | `OpenID Connect` |
| Client ID | `sigcem-web` |
| Name | `SIGCEM Web` |

**Aba Capability config:**
| Campo | Valor |
|---|---|
| Client authentication | ON (confidential) |
| Authorization | OFF |
| Standard flow | ON |
| Direct access grants | OFF |
| Implicit flow | OFF |

**Aba Login settings:**
| Campo | Valor |
|---|---|
| Valid redirect URIs | `http://localhost:3002/api/auth/callback/keycloak` |
| Valid post logout redirect URIs | `http://localhost:3002/*` |
| Web origins | `http://localhost:3002` |

2. Clique em **Save**

3. Vá na aba **Credentials** e copie o **Client secret** gerado  
   → Cole em `KEYCLOAK_CLIENT_SECRET` no `apps/web/.env.local`

---

## 4. Criar usuários

1. Vá em **Users** → **Add user**
2. Preencha **Username** e **Email**
3. Na aba **Credentials** → **Set password** → desmarque **Temporary**
4. Clique em **Save**

> Papéis (ADMIN, GESTOR, etc.) e vínculo com o município são configurados dentro do SIGCEM, não no Keycloak.

---

## 5. Produção — ajustar URIs

Quando fizer o deploy, volte em **Clients → sigcem-web → Settings** e adicione as URLs de produção:

| Campo | Adicionar |
|---|---|
| Valid redirect URIs | `https://sigcem.municipio.gov.br/api/auth/callback/keycloak` |
| Valid post logout redirect URIs | `https://sigcem.municipio.gov.br/*` |
| Web origins | `https://sigcem.municipio.gov.br` |

---

## Variáveis resultantes para `apps/web/.env.local`

```env
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=<gerado com: openssl rand -base64 32>

KEYCLOAK_CLIENT_ID=sigcem-web
KEYCLOAK_CLIENT_SECRET=<copiado da aba Credentials do client>

NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=sigcem
NEXT_PUBLIC_API_URL=http://localhost:3001
```
