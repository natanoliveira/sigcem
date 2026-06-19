import { PrismaClient, JazigoStatus, JazigoType, BurialType, DocumentType, EntityStatus, UserRole } from '@prisma/client';
import { createCipheriv, createHash, randomBytes } from 'crypto';

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
  await prisma.jazigoHistorico.deleteMany();
  await prisma.jazigo.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.deceased.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.quadra.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.cemetery.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.user.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.tenant.deleteMany({ where: { id: TENANT_ID } });

  // ── Tenant ────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      id: TENANT_ID,
      nome: 'Prefeitura Municipal de São João',
      dominio: 'saojoao.sigcem.local',
      ativo: true,
    },
  });
  console.log(`✓ Tenant: ${tenant.nome}`);

  // ── Usuário (espelho do Keycloak) ─────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      id: ADMIN_KEYCLOAK_ID,
      tenantId: TENANT_ID,
      keycloakId: 'admin-test-keycloak-sub',
      nome: 'Admin Teste',
      email: 'admin@sigcem.local',
      perfil: UserRole.ADMIN,
      ativo: true,
    },
  });
  console.log(`✓ Usuário: ${adminUser.nome} (${adminUser.perfil})`);

  // ── Cemitério ─────────────────────────────────────────────────────────────
  const cemetery = await prisma.cemetery.create({
    data: {
      tenantId: TENANT_ID,
      nome: 'Cemitério Municipal São João',
      endereco: 'Rua das Acácias, 500',
      bairro: 'Jardim das Flores',
      areaM2: 25000,
      capacidade: 5000,
      status: EntityStatus.ATIVO,
    },
  });
  console.log(`✓ Cemitério: ${cemetery.nome}`);

  // ── Quadras ───────────────────────────────────────────────────────────────
  const quadraA = await prisma.quadra.create({
    data: {
      tenantId: TENANT_ID,
      cemiterioId: cemetery.id,
      codigo: 'A',
      nome: 'Quadra A',
      capacidade: 100,
      status: EntityStatus.ATIVO,
    },
  });

  const quadraB = await prisma.quadra.create({
    data: {
      tenantId: TENANT_ID,
      cemiterioId: cemetery.id,
      codigo: 'B',
      nome: 'Quadra B',
      capacidade: 100,
      status: EntityStatus.ATIVO,
    },
  });
  console.log(`✓ Quadras: A e B`);

  // ── Jazigos ───────────────────────────────────────────────────────────────
  const jazigosData = [
    { quadraId: quadraA.id, codigo: 'A-001', tipo: JazigoType.SIMPLES,   status: JazigoStatus.OCUPADO },
    { quadraId: quadraA.id, codigo: 'A-002', tipo: JazigoType.SIMPLES,   status: JazigoStatus.DISPONIVEL },
    { quadraId: quadraA.id, codigo: 'A-003', tipo: JazigoType.DUPLO,     status: JazigoStatus.OCUPADO },
    { quadraId: quadraA.id, codigo: 'A-004', tipo: JazigoType.DUPLO,     status: JazigoStatus.DISPONIVEL },
    { quadraId: quadraA.id, codigo: 'A-005', tipo: JazigoType.PERPETUO,  status: JazigoStatus.RESERVADO },
    { quadraId: quadraB.id, codigo: 'B-001', tipo: JazigoType.GAVETA,    status: JazigoStatus.OCUPADO },
    { quadraId: quadraB.id, codigo: 'B-002', tipo: JazigoType.GAVETA,    status: JazigoStatus.DISPONIVEL },
    { quadraId: quadraB.id, codigo: 'B-003', tipo: JazigoType.OSSUARIO,  status: JazigoStatus.DISPONIVEL },
    { quadraId: quadraB.id, codigo: 'B-004', tipo: JazigoType.SIMPLES,   status: JazigoStatus.INTERDITADO },
    { quadraId: quadraB.id, codigo: 'B-005', tipo: JazigoType.SIMPLES,   status: JazigoStatus.DISPONIVEL },
  ];

  const jazigos = await Promise.all(
    jazigosData.map((j) =>
      prisma.jazigo.create({ data: { tenantId: TENANT_ID, ...j } }),
    ),
  );
  console.log(`✓ Jazigos: ${jazigos.length} criados (variados status e tipos)`);

  // ── Histórico de jazigos interditados/ocupados ────────────────────────────
  await prisma.jazigoHistorico.createMany({
    data: [
      {
        jazigoId: jazigos[8].id, // B-004 interditado
        statusAnterior: JazigoStatus.DISPONIVEL,
        statusNovo: JazigoStatus.INTERDITADO,
        motivo: 'Estrutura comprometida — aguardando vistoria',
        usuarioId: ADMIN_KEYCLOAK_ID,
      },
    ],
  });

  // ── Falecidos ─────────────────────────────────────────────────────────────
  const falecidosData = [
    {
      nomeCompleto: 'José Aparecido da Silva',
      dataNascimento: new Date('1942-03-15'),
      dataFalecimento: new Date('2024-01-10'),
      cpfHash: encrypt('123.456.789-00'),
      naturalidade: 'São João',
      nacionalidade: 'Brasileira',
      nomePai: 'Antônio da Silva',
      nomeMae: 'Maria Aparecida da Silva',
    },
    {
      nomeCompleto: 'Ana Maria Ferreira',
      dataNascimento: new Date('1955-07-22'),
      dataFalecimento: new Date('2024-03-05'),
      cpfHash: encrypt('234.567.890-11'),
      naturalidade: 'Belo Horizonte',
      nacionalidade: 'Brasileira',
      nomePai: 'Carlos Ferreira',
      nomeMae: 'Rita Ferreira',
    },
    {
      nomeCompleto: 'Manoel Rodrigues Costa',
      dataNascimento: new Date('1938-11-30'),
      dataFalecimento: new Date('2024-05-18'),
      cpfHash: encrypt('345.678.901-22'),
      naturalidade: 'São João',
      nacionalidade: 'Brasileira',
      nomePai: 'Pedro Costa',
      nomeMae: 'Josefa Costa',
    },
    {
      nomeCompleto: 'Francisca Oliveira Santos',
      dataNascimento: new Date('1960-02-08'),
      dataFalecimento: new Date('2024-08-22'),
      cpfHash: encrypt('456.789.012-33'),
      naturalidade: 'São Paulo',
      nacionalidade: 'Brasileira',
      nomePai: 'João Santos',
      nomeMae: 'Benedita Santos',
    },
    {
      nomeCompleto: 'Raimundo Nonato Lima',
      dataNascimento: new Date('1950-09-14'),
      dataFalecimento: new Date('2025-01-03'),
      cpfHash: encrypt('567.890.123-44'),
      causaMortisEnc: encrypt('Insuficiência cardíaca congestiva'),
      naturalidade: 'Fortaleza',
      nacionalidade: 'Brasileira',
      nomePai: 'Francisco Lima',
      nomeMae: 'Conceição Lima',
    },
  ];

  const falecidos = await Promise.all(
    falecidosData.map((f) =>
      prisma.deceased.create({ data: { tenantId: TENANT_ID, ...f } }),
    ),
  );
  console.log(`✓ Falecidos: ${falecidos.length} registrados`);

  // ── Sepultamentos ─────────────────────────────────────────────────────────
  const burial1 = await prisma.burial.create({
    data: {
      tenantId: TENANT_ID,
      falecidoId: falecidos[0].id,
      jazigoId: jazigos[0].id, // A-001 OCUPADO
      tipo: BurialType.INUMACAO,
      dataEvento: new Date('2024-01-12'),
      funeraria: 'Funerária Paz Eterna',
      responsavelNome: 'Pedro da Silva',
      autorizadoPor: ADMIN_KEYCLOAK_ID,
      observacoes: 'Sepultamento realizado com presença de familiares',
    },
  });

  const burial2 = await prisma.burial.create({
    data: {
      tenantId: TENANT_ID,
      falecidoId: falecidos[1].id,
      jazigoId: jazigos[2].id, // A-003 OCUPADO
      tipo: BurialType.INUMACAO,
      dataEvento: new Date('2024-03-07'),
      funeraria: 'Funerária Saudade',
      responsavelNome: 'Luís Ferreira',
      autorizadoPor: ADMIN_KEYCLOAK_ID,
    },
  });

  const burial3 = await prisma.burial.create({
    data: {
      tenantId: TENANT_ID,
      falecidoId: falecidos[2].id,
      jazigoId: jazigos[5].id, // B-001 OCUPADO
      tipo: BurialType.INUMACAO,
      dataEvento: new Date('2024-05-20'),
      funeraria: 'Funerária Paz Eterna',
      responsavelNome: 'Marcos Costa',
      autorizadoPor: ADMIN_KEYCLOAK_ID,
    },
  });

  const burial4 = await prisma.burial.create({
    data: {
      tenantId: TENANT_ID,
      falecidoId: falecidos[3].id,
      jazigoId: jazigos[5].id, // B-001 — exumação posterior
      tipo: BurialType.INUMACAO,
      dataEvento: new Date('2024-08-25'),
      funeraria: 'Funerária Saudade',
      responsavelNome: 'Carlos Santos',
      autorizadoPor: ADMIN_KEYCLOAK_ID,
    },
  });

  // Exumação de Francisca (translado posterior)
  const burial5 = await prisma.burial.create({
    data: {
      tenantId: TENANT_ID,
      falecidoId: falecidos[3].id,
      jazigoId: jazigos[5].id,
      tipo: BurialType.EXUMACAO,
      dataEvento: new Date('2025-02-10'),
      funeraria: 'Funerária Saudade',
      responsavelNome: 'Carlos Santos',
      autorizadoPor: ADMIN_KEYCLOAK_ID,
      observacoes: 'Exumação para translado a pedido da família',
    },
  });

  console.log(`✓ Sepultamentos: 4 inumações + 1 exumação`);

  // Histórico de status dos jazigos com sepultamento
  await prisma.jazigoHistorico.createMany({
    data: [
      {
        jazigoId: jazigos[0].id,
        statusAnterior: JazigoStatus.DISPONIVEL,
        statusNovo: JazigoStatus.OCUPADO,
        motivo: `Inumação — ${burial1.id}`,
        usuarioId: ADMIN_KEYCLOAK_ID,
      },
      {
        jazigoId: jazigos[2].id,
        statusAnterior: JazigoStatus.DISPONIVEL,
        statusNovo: JazigoStatus.OCUPADO,
        motivo: `Inumação — ${burial2.id}`,
        usuarioId: ADMIN_KEYCLOAK_ID,
      },
      {
        jazigoId: jazigos[5].id,
        statusAnterior: JazigoStatus.DISPONIVEL,
        statusNovo: JazigoStatus.OCUPADO,
        motivo: `Inumação — ${burial3.id}`,
        usuarioId: ADMIN_KEYCLOAK_ID,
      },
    ],
  });

  // ── Documentos ────────────────────────────────────────────────────────────
  await prisma.document.createMany({
    data: [
      {
        tenantId: TENANT_ID,
        tipo: DocumentType.CERTIDAO,
        entidadeTipo: 'sepultamento',
        entidadeId: burial1.id,
        nomeArquivo: 'certidao-sepultamento-jose-silva.pdf',
        urlMinio: 'sigcem-tenant-1/certidoes/certidao-sepultamento-jose-silva.pdf',
        emitidoPor: ADMIN_KEYCLOAK_ID,
      },
      {
        tenantId: TENANT_ID,
        tipo: DocumentType.AUTORIZACAO,
        entidadeTipo: 'sepultamento',
        entidadeId: burial5.id,
        nomeArquivo: 'autorizacao-exumacao-francisca-santos.pdf',
        urlMinio: 'sigcem-tenant-1/autorizacoes/autorizacao-exumacao-francisca-santos.pdf',
        emitidoPor: ADMIN_KEYCLOAK_ID,
      },
    ],
  });
  console.log(`✓ Documentos: 2 criados (certidão + autorização)`);

  // ── Audit Logs ────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: TENANT_ID,
        usuarioId: ADMIN_KEYCLOAK_ID,
        acao: 'create',
        entidadeTipo: 'cemetery',
        entidadeId: cemetery.id,
        dadosNovos: { nome: cemetery.nome },
        ip: '192.168.1.1',
      },
      {
        tenantId: TENANT_ID,
        usuarioId: ADMIN_KEYCLOAK_ID,
        acao: 'create',
        entidadeTipo: 'burial',
        entidadeId: burial1.id,
        dadosNovos: { tipo: 'INUMACAO', jazigoId: jazigos[0].id },
        ip: '192.168.1.1',
      },
      {
        tenantId: TENANT_ID,
        usuarioId: ADMIN_KEYCLOAK_ID,
        acao: 'create',
        entidadeTipo: 'burial',
        entidadeId: burial5.id,
        dadosNovos: { tipo: 'EXUMACAO', jazigoId: jazigos[5].id },
        ip: '192.168.1.1',
      },
      {
        tenantId: TENANT_ID,
        usuarioId: ADMIN_KEYCLOAK_ID,
        acao: 'view_sensitive',
        entidadeTipo: 'deceased',
        entidadeId: falecidos[4].id,
        dadosNovos: { campo: 'causa_mortis', perfil: 'ADMIN' },
        ip: '192.168.1.1',
      },
    ],
  });
  console.log(`✓ Audit logs: 4 entradas`);

  // ── Resumo ────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed concluído com sucesso!\n');
  console.log('📊 Dados criados:');
  console.log(`   • 1 tenant    → ${tenant.nome}`);
  console.log(`   • 1 usuário   → ${adminUser.email}`);
  console.log(`   • 1 cemitério → ${cemetery.nome}`);
  console.log(`   • 2 quadras   → A e B`);
  console.log(`   • 10 jazigos  → variados (disponível, ocupado, reservado, interditado)`);
  console.log(`   • 5 falecidos → nomes reais de teste`);
  console.log(`   • 5 eventos   → 4 inumações + 1 exumação`);
  console.log(`   • 2 documentos → certidão + autorização`);
  console.log(`   • 4 audit logs → rastreabilidade`);
  console.log('\n🔑 Acesso:');
  console.log('   admin@sigcem.local    / Admin@123    (ADMIN)');
  console.log('   gestor@sigcem.local   / Gestor@123   (GESTOR)');
  console.log('   operador@sigcem.local / Operador@123 (OPERADOR)');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
