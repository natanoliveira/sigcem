import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserPayload } from '../types/user-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  validate(payload: any): UserPayload {
    if (!payload?.sub) throw new UnauthorizedException('Token inválido');
    return {
      sub:      payload.sub,
      email:    payload.email,
      name:     payload.name,
      tenantId: payload.tenantId,
      roles:    payload.roles ?? [],
    };
  }
}
