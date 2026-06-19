import { PrismaClient, GraveStatus, GraveType, BurialType, DocumentType, EntityStatus, UserRole } from '@prisma/client';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { hashSync } from 'bcrypt';

const prisma = new PrismaClient();

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const ADMIN_KEYCLOAK_ID = '00000000-0000-0000-0000-000000000010';

function encrypt(value: string): string {
  const key = createHash('sha256')
    .update(process.env.ENCRYPTION_KEY ?? 'seed-dev-key-not-for-production-use')
    .digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // ── Limpa dados existentes (ordem respeitando FK) ──────────────────────────
  await prisma.auditLog.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.document.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.burial.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.graveHistory.deleteMany();
  await prisma.grave.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.deceased.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.block.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.cemetery.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.user.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.tenant.deleteMany({ where: { id: TENANT_ID } });

  // ── Tenant ────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      id: TENANT_ID,
      name: 'Prefeitura Municipal de São João',
      domain: 'saojoao.sigcem.local',
      active: true,
    },
  });
  console.log(`✓ Tenant: ${tenant.name}`);

  // ── Usuário (espelho do Keycloak) ─────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      id: ADMIN_KEYCLOAK_ID,
      tenantId: TENANT_ID,
      name: 'Admin Teste',
      email: 'admin@sigcem.local',
      password: hashSync('Admin@123', 12),
      role: UserRole.ADMIN,
      active: true,
    },
  });
  console.log(`✓ Usuário: ${adminUser.name} (${adminUser.role})`);

  // ── Cemitério ─────────────────────────────────────────────────────────────
  const cemetery = await prisma.cemetery.create({
    data: {
      tenantId: TENANT_ID,
      name: 'Cemitério Municipal São João',
      address: 'Rua das Acácias, 500',
      neighborhood: 'Jardim das Flores',
      areaM2: 25000,
      capacity: 5000,
      status: EntityStatus.ACTIVE,
    },
  });
  console.log(`✓ Cemitério: ${cemetery.name}`);

  // ── Quadras (Blocks) ───────────────────────────────────────────────────────
  const blockA = await prisma.block.create({
    data: {
      tenantId: TENANT_ID,
      cemeteryId: cemetery.id,
      code: 'A',
      name: 'Quadra A',
      capacity: 100,
      status: EntityStatus.ACTIVE,
    },
  });

  const blockB = await prisma.block.create({
    data: {
      tenantId: TENANT_ID,
      cemeteryId: cemetery.id,
      code: 'B',
      name: 'Quadra B',
      capacity: 100,
      status: EntityStatus.ACTIVE,
    },
  });
  console.log(`✓ Quadras: A e B`);

  // ── Jazigos (Graves) ───────────────────────────────────────────────────────
  const gravesData = [
    { blockId: blockA.id, code: 'A-001', type: GraveType.SINGLE,    status: GraveStatus.OCCUPIED },
    { blockId: blockA.id, code: 'A-002', type: GraveType.SINGLE,    status: GraveStatus.AVAILABLE },
    { blockId: blockA.id, code: 'A-003', type: GraveType.DOUBLE,    status: GraveStatus.OCCUPIED },
    { blockId: blockA.id, code: 'A-004', type: GraveType.DOUBLE,    status: GraveStatus.AVAILABLE },
    { blockId: blockA.id, code: 'A-005', type: GraveType.PERPETUAL, status: GraveStatus.RESERVED },
    { blockId: blockB.id, code: 'B-001', type: GraveType.DRAWER,    status: GraveStatus.OCCUPIED },
    { blockId: blockB.id, code: 'B-002', type: GraveType.DRAWER,    status: GraveStatus.AVAILABLE },
    { blockId: blockB.id, code: 'B-003', type: GraveType.OSSUARY,   status: GraveStatus.AVAILABLE },
    { blockId: blockB.id, code: 'B-004', type: GraveType.SINGLE,    status: GraveStatus.BLOCKED },
    { blockId: blockB.id, code: 'B-005', type: GraveType.SINGLE,    status: GraveStatus.AVAILABLE },
  ];

  const graves = await Promise.all(
    gravesData.map((g) =>
      prisma.grave.create({ data: { tenantId: TENANT_ID, ...g } }),
    ),
  );
  console.log(`✓ Jazigos: ${graves.length} criados (variados status e tipos)`);

  // ── Histórico de jazigos interditados/ocupados ────────────────────────────
  await prisma.graveHistory.createMany({
    data: [
      {
        graveId: graves[8].id, // B-004 bloqueado
        previousStatus: GraveStatus.AVAILABLE,
        newStatus: GraveStatus.BLOCKED,
        reason: 'Estrutura comprometida — aguardando vistoria',
        userId: ADMIN_KEYCLOAK_ID,
      },
    ],
  });

  // ── Falecidos ─────────────────────────────────────────────────────────────
  const deceasedData = [
    {
      fullName: 'José Aparecido da Silva',
      birthDate: new Date('1942-03-15'),
      deathDate: new Date('2024-01-10'),
      taxIdHash: encrypt('123.456.789-00'),
      birthPlace: 'São João',
      nationality: 'Brasileira',
      fatherName: 'Antônio da Silva',
      motherName: 'Maria Aparecida da Silva',
    },
    {
      fullName: 'Ana Maria Ferreira',
      birthDate: new Date('1955-07-22'),
      deathDate: new Date('2024-03-05'),
      taxIdHash: encrypt('234.567.890-11'),
      birthPlace: 'Belo Horizonte',
      nationality: 'Brasileira',
      fatherName: 'Carlos Ferreira',
      motherName: 'Rita Ferreira',
    },
    {
      fullName: 'Manoel Rodrigues Costa',
      birthDate: new Date('1938-11-30'),
      deathDate: new Date('2024-05-18'),
      taxIdHash: encrypt('345.678.901-22'),
      birthPlace: 'São João',
      nationality: 'Brasileira',
      fatherName: 'Pedro Costa',
      motherName: 'Josefa Costa',
    },
    {
      fullName: 'Francisca Oliveira Santos',
      birthDate: new Date('1960-02-08'),
      deathDate: new Date('2024-08-22'),
      taxIdHash: encrypt('456.789.012-33'),
      birthPlace: 'São Paulo',
      nationality: 'Brasileira',
      fatherName: 'João Santos',
      motherName: 'Benedita Santos',
    },
    {
      fullName: 'Raimundo Nonato Lima',
      birthDate: new Date('1950-09-14'),
      deathDate: new Date('2025-01-03'),
      taxIdHash: encrypt('567.890.123-44'),
      causeOfDeathEnc: encrypt('Insuficiência cardíaca congestiva'),
      birthPlace: 'Fortaleza',
      nationality: 'Brasileira',
      fatherName: 'Francisco Lima',
      motherName: 'Conceição Lima',
    },
  ];

  const deceasedList = await Promise.all(
    deceasedData.map((f) =>
      prisma.deceased.create({ data: { tenantId: TENANT_ID, ...f } }),
    ),
  );
  console.log(`✓ Falecidos: ${deceasedList.length} registrados`);

  // ── Sepultamentos ─────────────────────────────────────────────────────────
  const burial1 = await prisma.burial.create({
    data: {
      tenantId: TENANT_ID,
      deceasedId: deceasedList[0].id,
      graveId: graves[0].id, // A-001 OCCUPIED
      type: BurialType.INHUMATION,
      eventDate: new Date('2024-01-12'),
      funeralHome: 'Funerária Paz Eterna',
      responsibleName: 'Pedro da Silva',
      authorizedBy: ADMIN_KEYCLOAK_ID,
      notes: 'Sepultamento realizado com presença de familiares',
    },
  });

  const burial2 = await prisma.burial.create({
    data: {
      tenantId: TENANT_ID,
      deceasedId: deceasedList[1].id,
      graveId: graves[2].id, // A-003 OCCUPIED
      type: BurialType.INHUMATION,
      eventDate: new Date('2024-03-07'),
      funeralHome: 'Funerária Saudade',
      responsibleName: 'Luís Ferreira',
      authorizedBy: ADMIN_KEYCLOAK_ID,
    },
  });

  const burial3 = await prisma.burial.create({
    data: {
      tenantId: TENANT_ID,
      deceasedId: deceasedList[2].id,
      graveId: graves[5].id, // B-001 OCCUPIED
      type: BurialType.INHUMATION,
      eventDate: new Date('2024-05-20'),
      funeralHome: 'Funerária Paz Eterna',
      responsibleName: 'Marcos Costa',
      authorizedBy: ADMIN_KEYCLOAK_ID,
    },
  });

  const burial4 = await prisma.burial.create({
    data: {
      tenantId: TENANT_ID,
      deceasedId: deceasedList[3].id,
      graveId: graves[5].id, // B-001 — exumação posterior
      type: BurialType.INHUMATION,
      eventDate: new Date('2024-08-25'),
      funeralHome: 'Funerária Saudade',
      responsibleName: 'Carlos Santos',
      authorizedBy: ADMIN_KEYCLOAK_ID,
    },
  });

  // Exumação de Francisca (translado posterior)
  const burial5 = await prisma.burial.create({
    data: {
      tenantId: TENANT_ID,
      deceasedId: deceasedList[3].id,
      graveId: graves[5].id,
      type: BurialType.EXHUMATION,
      eventDate: new Date('2025-02-10'),
      funeralHome: 'Funerária Saudade',
      responsibleName: 'Carlos Santos',
      authorizedBy: ADMIN_KEYCLOAK_ID,
      notes: 'Exumação para translado a pedido da família',
    },
  });

  console.log(`✓ Sepultamentos: 4 inumações + 1 exumação`);

  // Histórico de status dos jazigos com sepultamento
  await prisma.graveHistory.createMany({
    data: [
      {
        graveId: graves[0].id,
        previousStatus: GraveStatus.AVAILABLE,
        newStatus: GraveStatus.OCCUPIED,
        reason: `Inumação — ${burial1.id}`,
        userId: ADMIN_KEYCLOAK_ID,
      },
      {
        graveId: graves[2].id,
        previousStatus: GraveStatus.AVAILABLE,
        newStatus: GraveStatus.OCCUPIED,
        reason: `Inumação — ${burial2.id}`,
        userId: ADMIN_KEYCLOAK_ID,
      },
      {
        graveId: graves[5].id,
        previousStatus: GraveStatus.AVAILABLE,
        newStatus: GraveStatus.OCCUPIED,
        reason: `Inumação — ${burial3.id}`,
        userId: ADMIN_KEYCLOAK_ID,
      },
    ],
  });

  // ── Documentos ────────────────────────────────────────────────────────────
  await prisma.document.createMany({
    data: [
      {
        tenantId: TENANT_ID,
        type: DocumentType.CERTIFICATE,
        entityType: 'sepultamento',
        entityId: burial1.id,
        fileName: 'certidao-sepultamento-jose-silva.pdf',
        storageKey: 'sigcem-tenant-1/certidoes/certidao-sepultamento-jose-silva.pdf',
        issuedBy: ADMIN_KEYCLOAK_ID,
      },
      {
        tenantId: TENANT_ID,
        type: DocumentType.AUTHORIZATION,
        entityType: 'sepultamento',
        entityId: burial5.id,
        fileName: 'autorizacao-exumacao-francisca-santos.pdf',
        storageKey: 'sigcem-tenant-1/autorizacoes/autorizacao-exumacao-francisca-santos.pdf',
        issuedBy: ADMIN_KEYCLOAK_ID,
      },
    ],
  });
  console.log(`✓ Documentos: 2 criados (certidão + autorização)`);

  // ── Audit Logs ────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: TENANT_ID,
        userId: ADMIN_KEYCLOAK_ID,
        action: 'create',
        entityType: 'cemetery',
        entityId: cemetery.id,
        newData: { name: cemetery.name },
        ip: '192.168.1.1',
      },
      {
        tenantId: TENANT_ID,
        userId: ADMIN_KEYCLOAK_ID,
        action: 'create',
        entityType: 'burial',
        entityId: burial1.id,
        newData: { type: 'INHUMATION', graveId: graves[0].id },
        ip: '192.168.1.1',
      },
      {
        tenantId: TENANT_ID,
        userId: ADMIN_KEYCLOAK_ID,
        action: 'create',
        entityType: 'burial',
        entityId: burial5.id,
        newData: { type: 'EXHUMATION', graveId: graves[5].id },
        ip: '192.168.1.1',
      },
      {
        tenantId: TENANT_ID,
        userId: ADMIN_KEYCLOAK_ID,
        action: 'view_sensitive',
        entityType: 'deceased',
        entityId: deceasedList[4].id,
        newData: { campo: 'causeOfDeath', perfil: 'ADMIN' },
        ip: '192.168.1.1',
      },
    ],
  });
  console.log(`✓ Audit logs: 4 entradas`);

  // ── Resumo ────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed concluído com sucesso!\n');
  console.log('📊 Dados criados:');
  console.log(`   • 1 tenant    → ${tenant.name}`);
  console.log(`   • 1 usuário   → ${adminUser.email}`);
  console.log(`   • 1 cemitério → ${cemetery.name}`);
  console.log(`   • 2 quadras   → A e B`);
  console.log(`   • 10 jazigos  → variados (disponível, ocupado, reservado, interditado)`);
  console.log(`   • 5 falecidos → nomes reais de teste`);
  console.log(`   • 5 eventos   → 4 inumações + 1 exumação`);
  console.log(`   • 2 documentos → certidão + autorização`);
  console.log(`   • 4 audit logs → rastreabilidade`);
  console.log('\n🔑 Acesso:');
  console.log('   admin@sigcem.local    / Admin@123    (ADMIN)');
  console.log('   gestor@sigcem.local   / Gestor@123   (MANAGER)');
  console.log('   operador@sigcem.local / Operador@123 (OPERATOR)');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
