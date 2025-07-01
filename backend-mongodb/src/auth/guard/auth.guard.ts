import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { UserPayload } from '../types/user-payload.interface';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    console.log('[디버그] 로그인된 유저 정보:', request.user);

    // ✅ 올바른 public 체크
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      console.log('[AuthGuard] Public 메서드 - 인증 우회');
      return true;
    }

    if (!request.user || (request.user as UserPayload).type !== 'access') {
      console.log('[AuthGuard] 유저 없음 또는 access 토큰 아님 → 차단');
      return false;
    }

    return true;
  }
}
