import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  forTenant(tenantId: string) {
    return this.$extends({
      query: {
        $allModels: {
          async findMany({ args, query }) {
            args.where = { ...args.where, tenantId };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { ...args.where, tenantId };
            return query(args);
          },
          async findUnique({ args, query }) {
            return query(args);
          },
          async create({ args, query }) {
            (args.data as any).tenantId = tenantId;
            return query(args);
          },
          async update({ args, query }) {
            args.where = { ...args.where, tenantId } as any;
            return query(args);
          },
          async delete({ args, query }) {
            args.where = { ...args.where, tenantId } as any;
            return query(args);
          },
          async count({ args, query }) {
            args.where = { ...args.where, tenantId };
            return query(args);
          },
        },
      },
    });
  }
}
