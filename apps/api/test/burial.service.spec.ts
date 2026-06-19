import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BurialService } from '../src/modules/burial/burial.service';
import { PrismaService } from '../src/shared/database/prisma.service';
import { AuditService } from '../src/shared/audit/audit.service';
import { JazigoStatus, BurialType } from '@prisma/client';

const TENANT = 'tenant-001';
const USER = 'user-001';

const mockFalecido = { id: 'f-1', nomeCompleto: 'João da Silva' };
const mockJazigoDisponivel = { id: 'j-1', codigo: 'A01', status: JazigoStatus.DISPONIVEL };
const mockJazigoOcupado   = { id: 'j-2', codigo: 'A02', status: JazigoStatus.OCUPADO };
const mockJazigoDestino   = { id: 'j-3', codigo: 'B01', status: JazigoStatus.DISPONIVEL };

function makeMockPrisma() {
  return {
    forTenant: jest.fn().mockReturnValue({
      deceased: { findFirst: jest.fn().mockResolvedValue(mockFalecido) },
      jazigo:   { findFirst: jest.fn() },
      burial:   { create: jest.fn() },
    }),
    $transaction: jest.fn(),
    burial:         { create: jest.fn() },
    jazigo:         { update: jest.fn() },
    jazigoHistorico:{ create: jest.fn() },
  };
}

describe('BurialService', () => {
  let service: BurialService;
  let prisma: ReturnType<typeof makeMockPrisma>;
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = makeMockPrisma();
    audit  = { log: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        BurialService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService,  useValue: audit },
      ],
    }).compile();

    service = module.get(BurialService);
  });

  // ── Inumação ──────────────────────────────────────────────────────────────
  describe('inumar()', () => {
    it('cria burial e atualiza jazigo para OCUPADO', async () => {
      prisma.forTenant().jazigo.findFirst.mockResolvedValue(mockJazigoDisponivel);
      const newBurial = { id: 'b-1', tipo: BurialType.INUMACAO };
      prisma.$transaction.mockResolvedValue([newBurial, {}, {}]);

      const dto = {
        falecidoId: 'f-1',
        jazigoId: 'j-1',
        tipo: BurialType.INUMACAO,
        dataEvento: '2024-01-15',
        autorizadoPor: 'Secretário',
      };

      const result = await service.inumar(dto, TENANT, USER);
      expect(result).toEqual(newBurial);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ acao: 'create' }));
    });

    it('lança 409 se jazigo OCUPADO', async () => {
      prisma.forTenant().jazigo.findFirst.mockResolvedValue(mockJazigoOcupado);
      const dto = { falecidoId: 'f-1', jazigoId: 'j-2', tipo: BurialType.INUMACAO, dataEvento: '2024-01-15', autorizadoPor: 'X' };
      await expect(service.inumar(dto, TENANT, USER)).rejects.toThrow(ConflictException);
    });

    it('lança 404 se falecido não existe', async () => {
      prisma.forTenant().deceased.findFirst.mockResolvedValue(null);
      prisma.forTenant().jazigo.findFirst.mockResolvedValue(mockJazigoDisponivel);
      const dto = { falecidoId: 'x', jazigoId: 'j-1', tipo: BurialType.INUMACAO, dataEvento: '2024-01-15', autorizadoPor: 'X' };
      await expect(service.inumar(dto, TENANT, USER)).rejects.toThrow(NotFoundException);
    });
  });

  // ── Exumação ──────────────────────────────────────────────────────────────
  describe('exumar()', () => {
    it('cria burial e atualiza jazigo para DISPONIVEL', async () => {
      prisma.forTenant().jazigo.findFirst.mockResolvedValue(mockJazigoOcupado);
      const newBurial = { id: 'b-2', tipo: BurialType.EXUMACAO };
      prisma.$transaction.mockResolvedValue([newBurial, {}, {}]);

      const dto = { falecidoId: 'f-1', jazigoId: 'j-2', tipo: BurialType.EXUMACAO, dataEvento: '2024-02-10', autorizadoPor: 'Y' };
      const result = await service.exumar(dto, TENANT, USER);
      expect(result).toEqual(newBurial);
    });

    it('lança 409 se jazigo DISPONIVEL', async () => {
      prisma.forTenant().jazigo.findFirst.mockResolvedValue(mockJazigoDisponivel);
      const dto = { falecidoId: 'f-1', jazigoId: 'j-1', tipo: BurialType.EXUMACAO, dataEvento: '2024-02-10', autorizadoPor: 'Y' };
      await expect(service.exumar(dto, TENANT, USER)).rejects.toThrow(ConflictException);
    });
  });

  // ── Translado ─────────────────────────────────────────────────────────────
  describe('transladar()', () => {
    it('lança BadRequest se origem === destino', async () => {
      const dto = {
        falecidoId: 'f-1', jazigoOrigemId: 'j-1', jazigoDestinoId: 'j-1',
        dataEvento: '2024-03-01', autorizadoPor: 'Z',
      };
      await expect(service.transladar(dto, TENANT, USER)).rejects.toThrow(BadRequestException);
    });

    it('executa 6 operações em transaction', async () => {
      prisma.forTenant().jazigo.findFirst
        .mockResolvedValueOnce(mockJazigoOcupado)   // origem
        .mockResolvedValueOnce(mockJazigoDestino);  // destino

      const dto = {
        falecidoId: 'f-1', jazigoOrigemId: 'j-2', jazigoDestinoId: 'j-3',
        dataEvento: '2024-03-01', autorizadoPor: 'Z',
      };
      prisma.$transaction.mockResolvedValue([{}, {}, {}, {}, {}, {}]);

      await service.transladar(dto, TENANT, USER);
      const txCalls = prisma.$transaction.mock.calls[0][0];
      expect(txCalls).toHaveLength(6);
    });

    it('lança 409 se origem não OCUPADO', async () => {
      prisma.forTenant().jazigo.findFirst
        .mockResolvedValueOnce(mockJazigoDisponivel)
        .mockResolvedValueOnce(mockJazigoDestino);

      const dto = {
        falecidoId: 'f-1', jazigoOrigemId: 'j-1', jazigoDestinoId: 'j-3',
        dataEvento: '2024-03-01', autorizadoPor: 'Z',
      };
      await expect(service.transladar(dto, TENANT, USER)).rejects.toThrow(ConflictException);
    });
  });
});
