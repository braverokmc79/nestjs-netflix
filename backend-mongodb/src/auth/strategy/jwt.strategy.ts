import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategyBase } from 'passport-jwt';
import { AuthGuard } from '@nestjs/passport';
import { envVariableKeys } from 'src/common/const/env.const';
import { Role } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';


export interface JwtPayload {
  sub?: number;
  role?: Role;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  id?:number | string;

}

// ✅ 1. AuthGuard는 이렇게 선언하면 타입 경고 없음
 

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('✅ [JwtAuthGuard] isPublic:', isPublic);

    if (isPublic) {
      console.log('🟢 인증 우회 허용됨 (Public)');
      return true;
    }

    console.log('🔒 인증 필요 → AuthGuard 동작');
    return super.canActivate(context);
  }
}





@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase, 'jwt') {
  constructor(private readonly configService: ConfigService) {
     
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
