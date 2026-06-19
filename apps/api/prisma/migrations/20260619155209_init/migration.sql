-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GESTOR', 'OPERADOR', 'AGENTE_DOCUMENTAL');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "JazigoType" AS ENUM ('SIMPLES', 'DUPLO', 'GAVETA', 'OSSUARIO', 'PERPETUO');

-- CreateEnum
CREATE TYPE "JazigoStatus" AS ENUM ('DISPONIVEL', 'OCUPADO', 'RESERVADO', 'INTERDITADO');

-- CreateEnum
CREATE TYPE "BurialType" AS ENUM ('INUMACAO', 'EXUMACAO', 'TRANSLADO');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CERTIDAO', 'AUTORIZACAO', 'FOTOGRAFIA', 'ANEXO');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dominio" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "keycloak_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "perfil" "UserRole" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cemeteries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "bairro" TEXT,
    "area_m2" DECIMAL(65,30),
    "capacidade" INTEGER,
    "status" "EntityStatus" NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cemeteries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quadras" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cemiterio_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT,
    "capacidade" INTEGER,
    "status" "EntityStatus" NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quadras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jazigos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "quadra_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "JazigoType" NOT NULL,
    "status" "JazigoStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "localizacao_referencia" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jazigos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jazigo_historico" (
    "id" TEXT NOT NULL,
    "jazigo_id" TEXT NOT NULL,
    "status_anterior" "JazigoStatus" NOT NULL,
    "status_novo" "JazigoStatus" NOT NULL,
    "motivo" TEXT,
    "usuario_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jazigo_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deceased" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "data_nascimento" TIMESTAMP(3) NOT NULL,
    "data_falecimento" TIMESTAMP(3) NOT NULL,
    "cpf_hash" TEXT,
    "causa_mortis_enc" TEXT,
    "naturalidade" TEXT,
    "nacionalidade" TEXT,
    "nome_pai" TEXT,
    "nome_mae" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deceased_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "burials" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "falecido_id" TEXT NOT NULL,
    "jazigo_id" TEXT NOT NULL,
    "tipo" "BurialType" NOT NULL,
    "data_evento" TIMESTAMP(3) NOT NULL,
    "funeraria" TEXT,
    "responsavel_nome" TEXT,
    "responsavel_cpf" TEXT,
    "autorizado_por" TEXT NOT NULL,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "burials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tipo" "DocumentType" NOT NULL,
    "entidade_tipo" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "url_minio" TEXT NOT NULL,
    "emitido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emitido_por" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade_tipo" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "dados_anteriores" JSONB,
    "dados_novos" JSONB,
    "ip" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_dominio_key" ON "tenants"("dominio");

-- CreateIndex
CREATE UNIQUE INDEX "users_keycloak_id_key" ON "users"("keycloak_id");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "cemeteries_tenant_id_status_idx" ON "cemeteries"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cemeteries_tenant_id_nome_key" ON "cemeteries"("tenant_id", "nome");

-- CreateIndex
CREATE INDEX "quadras_tenant_id_idx" ON "quadras"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "quadras_cemiterio_id_codigo_key" ON "quadras"("cemiterio_id", "codigo");

-- CreateIndex
CREATE INDEX "jazigos_tenant_id_status_idx" ON "jazigos"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "jazigos_quadra_id_codigo_key" ON "jazigos"("quadra_id", "codigo");

-- CreateIndex
CREATE INDEX "jazigo_historico_jazigo_id_idx" ON "jazigo_historico"("jazigo_id");

-- CreateIndex
CREATE INDEX "deceased_tenant_id_nome_completo_idx" ON "deceased"("tenant_id", "nome_completo");

-- CreateIndex
CREATE INDEX "burials_tenant_id_idx" ON "burials"("tenant_id");

-- CreateIndex
CREATE INDEX "burials_falecido_id_idx" ON "burials"("falecido_id");

-- CreateIndex
CREATE INDEX "burials_jazigo_id_idx" ON "burials"("jazigo_id");

-- CreateIndex
CREATE INDEX "documents_tenant_id_entidade_tipo_entidade_id_idx" ON "documents"("tenant_id", "entidade_tipo", "entidade_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_entidade_tipo_entidade_id_idx" ON "audit_logs"("tenant_id", "entidade_tipo", "entidade_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_criado_em_idx" ON "audit_logs"("tenant_id", "criado_em");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cemeteries" ADD CONSTRAINT "cemeteries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quadras" ADD CONSTRAINT "quadras_cemiterio_id_fkey" FOREIGN KEY ("cemiterio_id") REFERENCES "cemeteries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jazigos" ADD CONSTRAINT "jazigos_quadra_id_fkey" FOREIGN KEY ("quadra_id") REFERENCES "quadras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jazigo_historico" ADD CONSTRAINT "jazigo_historico_jazigo_id_fkey" FOREIGN KEY ("jazigo_id") REFERENCES "jazigos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "burials" ADD CONSTRAINT "burials_falecido_id_fkey" FOREIGN KEY ("falecido_id") REFERENCES "deceased"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "burials" ADD CONSTRAINT "burials_jazigo_id_fkey" FOREIGN KEY ("jazigo_id") REFERENCES "jazigos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
