import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BurialService } from '../src/modules/burial/burial.service';
import { PrismaService } from '../src/shared/database/prisma.service';
import { AuditService } from '../src/shared/audit/audit.service';
import { GraveStatus, BurialType } from '@prisma/client';

const TENANT = 'tenant-001';
const USER = 'user-001';

const mockDeceased = { id: 'f-1', fullName: 'João da Silva' };
const mockGraveAvailable = { id: 'j-1', code: 'A01', status: GraveStatus.AVAILABLE };
const mockGraveOccupied  = { id: 'j-2', code: 'A02', status: GraveStatus.OCCUPIED };
const mockGraveTarget    = { id: 'j-3', code: 'B01', status: GraveStatus.AVAILABLE };

function makeMockPrisma() {
  return {
    forTenant: jest.fn().mockReturnValue({
      deceased: { findFirst: jest.fn().mockResolvedValue(mockDeceased) },
      grave:    { findFirst: jest.fn() },
      burial:   { create: jest.fn() },
    }),
    $transaction: jest.fn(),
    burial:       { create: jest.fn() },
    grave:        { update: jest.fn() },
    graveHistory: { create: jest.fn() },
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
    it('cria burial e atualiza jazigo para OCCUPIED', async () => {
      prisma.forTenant().grave.findFirst.mockResolvedValue(mockGraveAvailable);
      const newBurial = { id: 'b-1', type: BurialType.INHUMATION };
      prisma.$transaction.mockResolvedValue([newBurial, {}, {}]);

      const dto = {
        deceasedId: 'f-1',
        graveId: 'j-1',
        eventDate: '2024-01-15',
        authorizedBy: 'Secretário',
      };

      const result = await service.inumar(dto, TENANT, USER);
      expect(result).toEqual(newBurial);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'create' }));
    });

    it('lança 409 se jazigo OCCUPIED', async () => {
      prisma.forTenant().grave.findFirst.mockResolvedValue(mockGraveOccupied);
      const dto = { deceasedId: 'f-1', graveId: 'j-2', eventDate: '2024-01-15', authorizedBy: 'X' };
      await expect(service.inumar(dto, TENANT, USER)).rejects.toThrow(ConflictException);
    });

    it('lança 404 se falecido não existe', async () => {
      prisma.forTenant().deceased.findFirst.mockResolvedValue(null);
      prisma.forTenant().grave.findFirst.mockResolvedValue(mockGraveAvailable);
      const dto = { deceasedId: 'x', graveId: 'j-1', eventDate: '2024-01-15', authorizedBy: 'X' };
      await expect(service.inumar(dto, TENANT, USER)).rejects.toThrow(NotFoundException);
    });
  });

  // ── Exumação ──────────────────────────────────────────────────────────────
  describe('exumar()', () => {
    it('cria burial e atualiza jazigo para AVAILABLE', async () => {
      prisma.forTenant().grave.findFirst.mockResolvedValue(mockGraveOccupied);
      const newBurial = { id: 'b-2', type: BurialType.EXHUMATION };
      prisma.$transaction.mockResolvedValue([newBurial, {}, {}]);

      const dto = { deceasedId: 'f-1', graveId: 'j-2', eventDate: '2024-02-10', authorizedBy: 'Y' };
      const result = await service.exumar(dto, TENANT, USER);
      expect(result).toEqual(newBurial);
    });

    it('lança 409 se jazigo AVAILABLE', async () => {
      prisma.forTenant().grave.findFirst.mockResolvedValue(mockGraveAvailable);
      const dto = { deceasedId: 'f-1', graveId: 'j-1', eventDate: '2024-02-10', authorizedBy: 'Y' };
      await expect(service.exumar(dto, TENANT, USER)).rejects.toThrow(ConflictException);
    });
  });

  // ── Translado ─────────────────────────────────────────────────────────────
  describe('transladar()', () => {
    it('lança BadRequest se origem === destino', async () => {
      const dto = {
        deceasedId: 'f-1', sourceGraveId: 'j-1', targetGraveId: 'j-1',
        eventDate: '2024-03-01', authorizedBy: 'Z',
      };
      await expect(service.transladar(dto, TENANT, USER)).rejects.toThrow(BadRequestException);
    });

    it('executa 6 operações em transaction', async () => {
      prisma.forTenant().grave.findFirst
        .mockResolvedValueOnce(mockGraveOccupied)  // origem
        .mockResolvedValueOnce(mockGraveTarget);   // destino

      const dto = {
        deceasedId: 'f-1', sourceGraveId: 'j-2', targetGraveId: 'j-3',
        eventDate: '2024-03-01', authorizedBy: 'Z',
      };
      prisma.$transaction.mockResolvedValue([{}, {}, {}, {}, {}, {}]);

      await service.transladar(dto, TENANT, USER);
      const txCalls = prisma.$transaction.mock.calls[0][0];
      expect(txCalls).toHaveLength(6);
    });

    it('lança 409 se origem não OCCUPIED', async () => {
      prisma.forTenant().grave.findFirst
        .mockResolvedValueOnce(mockGraveAvailable)
        .mockResolvedValueOnce(mockGraveTarget);

      const dto = {
        deceasedId: 'f-1', sourceGraveId: 'j-1', targetGraveId: 'j-3',
        eventDate: '2024-03-01', authorizedBy: 'Z',
      };
      await expect(service.transladar(dto, TENANT, USER)).rejects.toThrow(ConflictException);
    });
  });
});
