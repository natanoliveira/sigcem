import { Module } from '@nestjs/common';
import { QuadraController } from './quadra.controller';
import { QuadraService } from './quadra.service';

@Module({
  controllers: [QuadraController],
  providers: [QuadraService],
  exports: [QuadraService],
})
export class QuadraModule {}
