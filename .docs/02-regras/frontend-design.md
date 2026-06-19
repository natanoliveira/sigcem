# Frontend Design - SIGCEM

Sistema Integrado de Gestão de Cemitérios e Serviços Funerários

## Objetivo

Garantir consistência visual, acessibilidade, produtividade operacional e padronização da interface do sistema.

Toda implementação Frontend deve seguir este documento.

---

# Skill Obrigatória

frontend-design

Antes de criar:

- Páginas
- Layouts
- Componentes
- Dashboards
- Formulários
- Tabelas
- Relatórios

Aplicar obrigatoriamente esta skill.

---

# Filosofia de Design

Tema:

Moderno Institucional

Características:

- Formal
- Profissional
- Governamental
- Minimalista
- Funcional
- Escalável

Evitar:

- Visual gamer
- Estilo startup exagerado
- Animações excessivas
- Gradientes agressivos
- Poluição visual

---

# Perfil dos Usuários

## Operador

Responsável pelas operações diárias.

Objetivos:

- Rapidez
- Poucos cliques
- Navegação previsível

---

## Gestor

Responsável por indicadores e relatórios.

Objetivos:

- Visualização rápida
- Dados consolidados

---

## Administrador

Responsável por configuração e controle.

Objetivos:

- Segurança
- Auditoria
- Governança

---

## Cidadão

Usuário do Portal Público.

Objetivos:

- Busca simples
- Consulta rápida
- Experiência intuitiva

---

# Layout Oficial

## Desktop

Estrutura obrigatória:

Header
+
Sidebar Retrátil
+
Breadcrumb
+
Conteúdo

Modelo:

┌─────────────────────────┐
│ Header                  │
├─────────────────────────┤
│ Sidebar | Conteúdo      │
└─────────────────────────┘

---

## Mobile

Estrutura obrigatória:

Header
+
Drawer
+
Conteúdo

Modelo:

☰ SIGCEM

Menu lateral recolhível.

---

# Header

Itens obrigatórios:

- Logo da Prefeitura
- Nome do Sistema
- Ambiente
- Notificações
- Usuário logado

---

# Sidebar

Agrupamento por domínio.

Operação

- Dashboard
- Sepultamentos
- Exumações

Estrutura

- Cemitérios
- Quadras
- Jazigos
- Ossuários

Cadastros

- Falecidos
- Funerárias

Gestão

- Relatórios
- Auditoria
- Configurações

---

# Breadcrumb

Obrigatório em todas as páginas internas.

Exemplo:

Dashboard / Cemitérios / Cadastro

---

# Framework Oficial

UI

- Shadcn/UI

CSS

- TailwindCSS

Ícones

- Lucide React

Tipografia

- Inter

---

# Responsividade

Estratégia:

Mobile First

Breakpoints:

- Mobile
- Tablet
- Desktop
- Wide Desktop

Nenhuma funcionalidade pode existir apenas no Desktop.

---

# Cores

Primária:

Azul Institucional

Secundária:

Cinza Neutro

Sucesso:

Verde

Atenção:

Amarelo

Erro:

Vermelho

Informação:

Azul Claro

---

# Dashboard

Componentes:

- Cards
- Gráficos
- Indicadores
- Alertas

Prioridade:

Leitura rápida.

---

# Tabelas

Obrigatório:

- Busca
- Paginação
- Ordenação
- Filtro
- Exportação futura

Ações agrupadas em menu.

---

# Formulários

Princípios:

- Menos campos possíveis
- Agrupamento lógico
- Validação imediata

Estrutura:

- Dados Básicos
- Documentação
- Informações Complementares
- Anexos

---

# Componentes Reutilizáveis

Obrigatórios:

- PageHeader
- DataTable
- SearchInput
- ConfirmDialog
- StatusBadge
- UploadArea
- LoadingState
- EmptyState
- ErrorState
- AuditTimeline

---

# UX Operacional

Objetivo:

Executar qualquer ação principal em até 3 cliques.

Exemplos:

- Registrar Sepultamento
- Consultar Falecido
- Localizar Jazigo
- Registrar Exumação

---

# Acessibilidade

Obrigatório:

- Navegação por teclado
- Contraste adequado
- Labels em todos os campos
- Focus visível

Seguir WCAG AA.

---

# Regra Final

Toda proposta Frontend deve apresentar:

1. Objetivo da Tela
2. Estrutura Visual
3. Componentes Utilizados
4. Responsividade
5. Acessibilidade
6. Critérios de UX

Não gerar telas sem seguir este documento.