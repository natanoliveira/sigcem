# Security - SIGCEM

Sistema Integrado de Gestão de Cemitérios e Serviços Funerários

## Objetivo

Garantir segurança por padrão (Security by Default) em toda a aplicação.

Toda implementação deve considerar:

- Segurança
- LGPD
- Auditoria
- Multi-Tenant

---

# Skill Obrigatória

security

Aplicar antes de:

- Criar APIs
- Criar telas
- Criar integrações
- Criar banco de dados
- Criar infraestrutura

---

# Princípios

## Security by Default

Todo recurso nasce protegido.

Proibido:

- Rotas abertas sem justificativa
- Permissões implícitas
- Dados sensíveis expostos

---

## Least Privilege

Todo usuário recebe apenas as permissões necessárias.

Exemplo:

Operador:

Pode:

- Consultar
- Registrar

Não pode:

- Excluir
- Administrar usuários

---

## Defense in Depth

Camadas obrigatórias:

1. Firewall
2. Nginx
3. Keycloak
4. Backend
5. Banco
6. Auditoria

---

# Infraestrutura

## Nginx

Obrigatório.

Funções:

- Reverse Proxy
- SSL
- Rate Limit
- Proteção básica

---

## HTTPS

Obrigatório.

Mínimo:

TLS 1.2

Preferencial:

TLS 1.3

---

# Proteção DDoS

## Rate Limit

Login:

5 requisições/minuto

API:

100 requisições/minuto

Portal Público:

60 requisições/minuto

---

## Fail2Ban

Obrigatório para ambientes Linux.

Monitorar:

- Tentativas de login
- Ataques automatizados
- Força bruta

---

## Cloudflare

Recomendado quando possível.

Benefícios:

- Mitigação DDoS
- WAF
- Proteção DNS

---

# Autenticação

## Keycloak

Obrigatório.

Responsável por:

- Login
- Sessão
- MFA
- JWT
- Refresh Token

---

## MFA

Obrigatório:

- Administradores
- Gestores

Recomendado:

- Operadores

---

# Controle de Acesso

Modelo:

RBAC

Perfis:

- Administrador
- Gestor
- Operador
- Consulta
- Portal Público

---

# APIs

Obrigatório:

- JWT
- Guards
- DTO Validation

Nunca confiar apenas no Frontend.

---

# Proteção contra Ataques

Mitigar:

- SQL Injection
- XSS
- CSRF
- Path Traversal
- Command Injection
- SSRF

---

# Banco de Dados

PostgreSQL

Regras:

- Sem acesso público
- Usuário dedicado da aplicação
- Menor privilégio possível

---

# Multi-Tenant

Obrigatório.

Todas as tabelas devem possuir:

tenant_id

Toda consulta deve filtrar:

tenant_id

Não permitir vazamento entre municípios.

---

# Auditoria

Registrar:

- Login
- Logout
- Inclusão
- Alteração
- Exclusão
- Consulta sensível

Campos mínimos:

- Usuário
- Data
- Hora
- IP
- Operação
- Registro afetado

---

# LGPD

Dados protegidos:

- CPF
- RG
- Endereço
- Telefone
- Certidões
- Documentos pessoais

Obrigatório:

- Controle de acesso
- Auditoria
- Histórico de consultas

---

# Upload de Arquivos

Validar:

- Tipo
- Extensão
- Tamanho

Bloquear:

- Executáveis
- Scripts
- Arquivos suspeitos

---

# Backup

Obrigatório.

Estratégia:

- Diário
- Semanal
- Mensal

Testar restauração periodicamente.

---

# Logs

Centralizar logs.

Monitorar:

- Erros críticos
- Tentativas de invasão
- Falhas de autenticação

---

# Dependências

Executar regularmente:

- npm audit
- Dependabot
- Auditoria de vulnerabilidades

---

# Segredos

Proibido armazenar:

- Senhas
- Chaves
- Tokens

No código fonte.

Utilizar:

- .env
- Docker Secrets
- Vault futuramente

---

# Checklist de Aprovação

Nenhuma funcionalidade pode ser considerada pronta sem validar:

[ ] Segurança

[ ] LGPD

[ ] Auditoria

[ ] Multi-Tenant

[ ] Controle de Permissões

[ ] Logs

[ ] Backup

[ ] Validação de Entrada

[ ] Rate Limit

[ ] HTTPS

Se qualquer item falhar, a funcionalidade não está aprovada.