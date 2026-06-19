import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@shared/strategies/jwt.strategy';
import { IamController } from './iam.controller';
import { IamService } from './iam.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy, IamService],
  controllers: [IamController],
  exports: [PassportModule],
})
export class IamModule {}
