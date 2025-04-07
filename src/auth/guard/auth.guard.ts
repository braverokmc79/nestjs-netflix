import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from 'express';
import { UserPayload } from "../types/user-payload.interface";

@Injectable()
export class AuthGuard implements CanActivate {

    canActivate(context: ExecutionContext): boolean  {
        // 요청에서 user 객체가 존재하는지 확인한다.
        const request : Request = context.switchToHttp().getRequest();

        console.log('✔❤ AuthGuard called!', request.user);
        if (!request.user || (request.user as UserPayload).type !== 'access') {
          console.log('✔❤ AuthGuard called! false');
          return false;
        }

        return true
    }


}