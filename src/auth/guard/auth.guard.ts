import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from 'express';
import { UserPayload } from "../types/user-payload.interface";
import { Reflector } from "@nestjs/core";
import { Public } from "../decorator/public.decorator";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean  {
        // 만약에  public decoration 이 돼있으면
        // 모든 로직을 bypass
        const isPublic = this.reflector.get(Public, context.getHandler());
        console.log('✔❤ AuthGuard called! isPublic', isPublic);
        if (isPublic) return true;
    
          // 요청에서 user 객체가 존재하는지 확인한다.
          const request: Request = context.switchToHttp().getRequest();

        console.log('✔❤ AuthGuard called!', request.user);
        if (!request.user || (request.user as UserPayload).type !== 'access') {
          console.log('✔❤ AuthGuard called! false');
          return false;
        }

        return true
    }


}