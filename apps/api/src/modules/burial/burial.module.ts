import { Module } from '@nestjs/common';
import { BurialController } from './burial.controller';
import { BurialService } from './burial.service';

@Module({
  controllers: [BurialController],
  providers: [BurialService],
  exports: [BurialService],
})
export class BurialModule {}
