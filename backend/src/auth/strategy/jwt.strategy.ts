import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategyBase } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';
import type { Role } from 'src/users/entities/user.entity';
import { envVariableKeys } from 'src/common/const/env.const';

export interface JwtPayload {
  sub?: number;
  role?: Role;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  id?:number | string;

}

// ✅ 1. AuthGuard는 이렇게 선언하면 타입 경고 없음
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
// ✅ 2. JwtStrategy에 payload 타입 명시
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class JwtStrategy extends PassportStrategy(JwtStrategyBase, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>(envVariableKeys.accessTokenSecret),
    });
  }

  // ✅ 3. validate 메서드에 정확한 리턴 타입 명시
  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
