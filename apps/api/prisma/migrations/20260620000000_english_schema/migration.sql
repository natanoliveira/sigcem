-- Epic B: Full English schema standardisation
-- Renames all PT-BR tables, columns, enum names and enum values to English.

-- ── Enum value renames ────────────────────────────────────────────────────────

ALTER TYPE "UserRole" RENAME VALUE 'GESTOR'          TO 'MANAGER';
ALTER TYPE "UserRole" RENAME VALUE 'OPERADOR'        TO 'OPERATOR';
ALTER TYPE "UserRole" RENAME VALUE 'AGENTE_DOCUMENTAL' TO 'DOCUMENT_AGENT';

ALTER TYPE "EntityStatus" RENAME VALUE 'ATIVO'   TO 'ACTIVE';
ALTER TYPE "EntityStatus" RENAME VALUE 'INATIVO' TO 'INACTIVE';

ALTER TYPE "JazigoType" RENAME VALUE 'SIMPLES'  TO 'SINGLE';
ALTER TYPE "JazigoType" RENAME VALUE 'DUPLO'    TO 'DOUBLE';
ALTER TYPE "JazigoType" RENAME VALUE 'GAVETA'   TO 'DRAWER';
ALTER TYPE "JazigoType" RENAME VALUE 'OSSUARIO' TO 'OSSUARY';
ALTER TYPE "JazigoType" RENAME VALUE 'PERPETUO' TO 'PERPETUAL';

ALTER TYPE "JazigoStatus" RENAME VALUE 'DISPONIVEL'  TO 'AVAILABLE';
ALTER TYPE "JazigoStatus" RENAME VALUE 'OCUPADO'     TO 'OCCUPIED';
ALTER TYPE "JazigoStatus" RENAME VALUE 'RESERVADO'   TO 'RESERVED';
ALTER TYPE "JazigoStatus" RENAME VALUE 'INTERDITADO' TO 'BLOCKED';

ALTER TYPE "BurialType" RENAME VALUE 'INUMACAO'  TO 'INHUMATION';
ALTER TYPE "BurialType" RENAME VALUE 'EXUMACAO'  TO 'EXHUMATION';
ALTER TYPE "BurialType" RENAME VALUE 'TRANSLADO' TO 'TRANSFER';

ALTER TYPE "DocumentType" RENAME VALUE 'CERTIDAO'    TO 'CERTIFICATE';
ALTER TYPE "DocumentType" RENAME VALUE 'AUTORIZACAO' TO 'AUTHORIZATION';
ALTER TYPE "DocumentType" RENAME VALUE 'FOTOGRAFIA'  TO 'PHOTO';
ALTER TYPE "DocumentType" RENAME VALUE 'ANEXO'       TO 'ATTACHMENT';

-- ── Enum type renames ─────────────────────────────────────────────────────────

ALTER TYPE "JazigoType"   RENAME TO "GraveType";
ALTER TYPE "JazigoStatus" RENAME TO "GraveStatus";

-- ── tenants ───────────────────────────────────────────────────────────────────

ALTER TABLE "tenants" RENAME COLUMN "nome"      TO "name";
ALTER TABLE "tenants" RENAME COLUMN "dominio"   TO "domain";
ALTER TABLE "tenants" RENAME COLUMN "ativo"     TO "active";
ALTER TABLE "tenants" RENAME COLUMN "criado_em" TO "created_at";

-- ── users ─────────────────────────────────────────────────────────────────────

ALTER TABLE "users" RENAME COLUMN "nome"      TO "name";
ALTER TABLE "users" RENAME COLUMN "senha"     TO "password";
ALTER TABLE "users" RENAME COLUMN "perfil"    TO "role";
ALTER TABLE "users" RENAME COLUMN "ativo"     TO "active";
ALTER TABLE "users" RENAME COLUMN "criado_em" TO "created_at";

-- ── cemeteries ────────────────────────────────────────────────────────────────

ALTER TABLE "cemeteries" RENAME COLUMN "nome"         TO "name";
ALTER TABLE "cemeteries" RENAME COLUMN "endereco"     TO "address";
ALTER TABLE "cemeteries" RENAME COLUMN "bairro"       TO "neighborhood";
ALTER TABLE "cemeteries" RENAME COLUMN "capacidade"   TO "capacity";
ALTER TABLE "cemeteries" RENAME COLUMN "criado_em"    TO "created_at";
ALTER TABLE "cemeteries" RENAME COLUMN "atualizado_em" TO "updated_at";

-- ── quadras → blocks ──────────────────────────────────────────────────────────

ALTER TABLE "quadras" RENAME TO "blocks";
ALTER TABLE "blocks" RENAME COLUMN "cemiterio_id" TO "cemetery_id";
ALTER TABLE "blocks" RENAME COLUMN "codigo"       TO "code";
ALTER TABLE "blocks" RENAME COLUMN "nome"         TO "name";
ALTER TABLE "blocks" RENAME COLUMN "capacidade"   TO "capacity";
ALTER TABLE "blocks" RENAME COLUMN "criado_em"    TO "created_at";

-- ── jazigos → graves ──────────────────────────────────────────────────────────

ALTER TABLE "jazigos" RENAME TO "graves";
ALTER TABLE "graves" RENAME COLUMN "quadra_id"             TO "block_id";
ALTER TABLE "graves" RENAME COLUMN "codigo"                TO "code";
ALTER TABLE "graves" RENAME COLUMN "tipo"                  TO "type";
ALTER TABLE "graves" RENAME COLUMN "localizacao_referencia" TO "location_ref";
ALTER TABLE "graves" RENAME COLUMN "observacoes"           TO "notes";
ALTER TABLE "graves" RENAME COLUMN "criado_em"             TO "created_at";
ALTER TABLE "graves" RENAME COLUMN "atualizado_em"         TO "updated_at";

-- ── jazigo_historico → grave_history ─────────────────────────────────────────

ALTER TABLE "jazigo_historico" RENAME TO "grave_history";
ALTER TABLE "grave_history" RENAME COLUMN "jazigo_id"       TO "grave_id";
ALTER TABLE "grave_history" RENAME COLUMN "status_anterior" TO "previous_status";
ALTER TABLE "grave_history" RENAME COLUMN "status_novo"     TO "new_status";
ALTER TABLE "grave_history" RENAME COLUMN "motivo"          TO "reason";
ALTER TABLE "grave_history" RENAME COLUMN "usuario_id"      TO "user_id";
ALTER TABLE "grave_history" RENAME COLUMN "criado_em"       TO "created_at";

-- ── deceased ──────────────────────────────────────────────────────────────────

ALTER TABLE "deceased" RENAME COLUMN "nome_completo"    TO "full_name";
ALTER TABLE "deceased" RENAME COLUMN "data_nascimento"  TO "birth_date";
ALTER TABLE "deceased" RENAME COLUMN "data_falecimento" TO "death_date";
ALTER TABLE "deceased" RENAME COLUMN "cpf_hash"         TO "tax_id_hash";
ALTER TABLE "deceased" RENAME COLUMN "causa_mortis_enc" TO "cause_of_death_enc";
ALTER TABLE "deceased" RENAME COLUMN "naturalidade"     TO "birth_place";
ALTER TABLE "deceased" RENAME COLUMN "nacionalidade"    TO "nationality";
ALTER TABLE "deceased" RENAME COLUMN "nome_pai"         TO "father_name";
ALTER TABLE "deceased" RENAME COLUMN "nome_mae"         TO "mother_name";
ALTER TABLE "deceased" RENAME COLUMN "observacoes"      TO "notes";
ALTER TABLE "deceased" RENAME COLUMN "criado_em"        TO "created_at";
ALTER TABLE "deceased" RENAME COLUMN "atualizado_em"    TO "updated_at";

-- ── burials ───────────────────────────────────────────────────────────────────

ALTER TABLE "burials" RENAME COLUMN "falecido_id"      TO "deceased_id";
ALTER TABLE "burials" RENAME COLUMN "jazigo_id"        TO "grave_id";
ALTER TABLE "burials" RENAME COLUMN "tipo"             TO "type";
ALTER TABLE "burials" RENAME COLUMN "data_evento"      TO "event_date";
ALTER TABLE "burials" RENAME COLUMN "funeraria"        TO "funeral_home";
ALTER TABLE "burials" RENAME COLUMN "responsavel_nome" TO "responsible_name";
ALTER TABLE "burials" RENAME COLUMN "responsavel_cpf"  TO "responsible_tax_id";
ALTER TABLE "burials" RENAME COLUMN "autorizado_por"   TO "authorized_by";
ALTER TABLE "burials" RENAME COLUMN "observacoes"      TO "notes";
ALTER TABLE "burials" RENAME COLUMN "criado_em"        TO "created_at";

-- ── documents ─────────────────────────────────────────────────────────────────

ALTER TABLE "documents" RENAME COLUMN "tipo"          TO "type";
ALTER TABLE "documents" RENAME COLUMN "entidade_tipo" TO "entity_type";
ALTER TABLE "documents" RENAME COLUMN "entidade_id"   TO "entity_id";
ALTER TABLE "documents" RENAME COLUMN "nome_arquivo"  TO "file_name";
ALTER TABLE "documents" RENAME COLUMN "url_minio"     TO "storage_key";
ALTER TABLE "documents" RENAME COLUMN "emitido_em"    TO "issued_at";
ALTER TABLE "documents" RENAME COLUMN "emitido_por"   TO "issued_by";
ALTER TABLE "documents" RENAME COLUMN "ativo"         TO "active";

-- ── audit_logs ────────────────────────────────────────────────────────────────

ALTER TABLE "audit_logs" RENAME COLUMN "usuario_id"       TO "user_id";
ALTER TABLE "audit_logs" RENAME COLUMN "acao"             TO "action";
ALTER TABLE "audit_logs" RENAME COLUMN "entidade_tipo"    TO "entity_type";
ALTER TABLE "audit_logs" RENAME COLUMN "entidade_id"      TO "entity_id";
ALTER TABLE "audit_logs" RENAME COLUMN "dados_anteriores" TO "previous_data";
ALTER TABLE "audit_logs" RENAME COLUMN "dados_novos"      TO "new_data";
ALTER TABLE "audit_logs" RENAME COLUMN "criado_em"        TO "created_at";
