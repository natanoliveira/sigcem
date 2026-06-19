import { Module } from '@nestjs/common';
import { JazigoController } from './jazigo.controller';
import { JazigoService } from './jazigo.service';

@Module({
  controllers: [JazigoController],
  providers: [JazigoService],
  exports: [JazigoService],
})
export class JazigoModule {}
