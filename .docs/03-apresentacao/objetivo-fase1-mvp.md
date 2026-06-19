# SIGCEM
## Sistema Integrado de Gestão de Cemitérios e Serviços Funerários
### Fase 1 — MVP | Apresentação Executiva

---

## O que é o SIGCEM?

Uma plataforma digital desenvolvida para prefeituras e autarquias municipais que precisam modernizar a gestão de cemitérios públicos e serviços funerários.

O SIGCEM substitui livros físicos, planilhas e controles manuais por um sistema web seguro, rastreável e pronto para auditoria — sem abrir mão da conformidade com a LGPD.

---

## O Problema que Resolvemos

A maioria dos municípios brasileiros ainda opera com:

| Situação Atual | Consequência |
|---|---|
| Controle manual de sepultamentos | Erros, retrabalho e perda de informação |
| Livros físicos deteriorados | Dados históricos irrecuperáveis |
| Sem localização de jazigos | Dificuldade operacional e para familiares |
| Sem auditoria | Risco de irregularidades não rastreadas |
| Sem transparência pública | Cidadão sem acesso a informações básicas |
| Sem indicadores de gestão | Decisões tomadas sem dados confiáveis |

**O custo do problema não é só operacional — é de credibilidade institucional.**

---

## Para Quem é o SIGCEM?

- **Prefeituras Municipais**
- **Secretarias de Administração, Infraestrutura e Serviços Urbanos**
- **Autarquias Municipais**
- **Consórcios Intermunicipais**

Cada município opera de forma independente dentro da mesma plataforma, com total isolamento de dados — sem interferência entre clientes.

---

## Quem usa no dia a dia?

| Perfil | O que faz no sistema |
|---|---|
| Administrador | Configura usuários, permissões e o município |
| Gestor Municipal | Acompanha indicadores e relatórios gerenciais |
| Operador Cemiterial | Registra sepultamentos, exumações e transferências |
| Agente Documental | Emite certidões e gerencia documentos |
| Cidadão | Consulta falecidos e localiza jazigos pelo portal público |

---

## O que entregamos na Fase 1

| Módulo | O que resolve |
|---|---|
| **Autenticação** | Acesso seguro com controle de perfis e permissões |
| **Cemitérios** | Cadastro e gestão dos cemitérios municipais |
| **Quadras** | Organização da estrutura interna dos cemitérios |
| **Jazigos** | Localização, status e histórico de cada jazigo |
| **Falecidos** | Registro completo com proteção de dados (LGPD) |
| **Sepultamentos** | Histórico rastreável de cada sepultamento |
| **Documentos** | Certidões, fotografias e anexos digitais |

---

## Valor Entregue

- **Operação sem papel** — do sepultamento à certidão, tudo digital
- **Rastreabilidade total** — cada ação registrada com usuário, data e hora
- **Transparência pública** — portal de consulta aberto ao cidadão, sem necessidade de login
- **Conformidade LGPD** — dados sensíveis tratados com os controles exigidos por lei
- **Múltiplos municípios** — um único sistema atende vários clientes, com isolamento total de dados
- **Segurança institucional** — auditoria completa para inspeções e prestação de contas

---

## Critérios de Sucesso da Fase 1

- Operador registra um sepultamento completo sem recorrer a papel
- Gestor visualiza jazigos ocupados e disponíveis por cemitério em tempo real
- Cidadão localiza um falecido pelo portal público sem precisar ligar para a prefeitura
- Todos os registros possuem log de auditoria com rastreabilidade completa
- Sistema no ar para ao menos um município em ambiente de produção

---

## Tecnologia de Referência

Construído sobre uma stack moderna, segura e amplamente adotada no mercado:

- **Frontend:** Next.js + TypeScript + Shadcn/UI
- **Backend:** NestJS + TypeScript
- **Banco de dados:** PostgreSQL
- **Autenticação:** Keycloak (padrão OpenID Connect / OAuth 2.0)
- **Infraestrutura:** Docker + Nginx
- **Armazenamento:** MinIO (documentos e imagens)

Arquitetura preparada para crescer: DDD, Clean Architecture e Multi-Tenant desde o primeiro dia.

---

## Próximos Passos

1. Aprovação do escopo da Fase 1
2. Especificação técnica detalhada por módulo
3. Planejamento e estimativas
4. Início da implementação

---

*SIGCEM — Gestão cemiterial que respeita o passado e organiza o futuro.*
