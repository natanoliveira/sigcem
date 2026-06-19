-- Epic C: Group-based permission system
-- Adds Group, GroupMember, GroupPermission models and SystemModule/PermissionAction enums.

CREATE TYPE "SystemModule" AS ENUM (
  'CEMETERIES', 'BLOCKS', 'GRAVES', 'DECEASED',
  'BURIALS', 'DOCUMENTS', 'AUDIT', 'USERS', 'GROUPS'
);

CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'VIEW', 'EDIT', 'DELETE');

CREATE TABLE "groups" (
  "id"          TEXT        NOT NULL,
  "tenant_id"   TEXT        NOT NULL,
  "name"        TEXT        NOT NULL,
  "description" TEXT,
  "active"      BOOLEAN     NOT NULL DEFAULT true,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "groups_tenant_id_name_key" ON "groups"("tenant_id", "name");
CREATE INDEX "groups_tenant_id_idx" ON "groups"("tenant_id");

ALTER TABLE "groups"
  ADD CONSTRAINT "groups_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "group_members" (
  "group_id" TEXT NOT NULL,
  "user_id"  TEXT NOT NULL,
  CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id")
);

ALTER TABLE "group_members"
  ADD CONSTRAINT "group_members_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "groups"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_members"
  ADD CONSTRAINT "group_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "group_permissions" (
  "id"       TEXT              NOT NULL,
  "group_id" TEXT              NOT NULL,
  "module"   "SystemModule"    NOT NULL,
  "actions"  "PermissionAction"[],
  CONSTRAINT "group_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "group_permissions_group_id_module_key"
  ON "group_permissions"("group_id", "module");

ALTER TABLE "group_permissions"
  ADD CONSTRAINT "group_permissions_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "groups"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
