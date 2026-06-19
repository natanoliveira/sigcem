import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { UserPayload } from '../types/user-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const keycloakUrl = config.get<string>('KEYCLOAK_INTERNAL_URL');
    const realm = config.get<string>('KEYCLOAK_REALM');

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: `${keycloakUrl}/realms/${realm}`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: any): UserPayload {
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.preferred_username,
      tenantId: payload.tenant_id,
      roles: payload.realm_access?.roles ?? [],
    };
  }
}
