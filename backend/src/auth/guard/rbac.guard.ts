// import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
// import { Reflector } from "@nestjs/core";
// // import { Role, User } from "src/users/entity/user.entity";
// import type { Request as ExpressRequest } from 'express';
// import { RBAC } from "../decorator/rbac.decorator";
// import { Role, User } from "@prisma/client";

// @Injectable()
// export class RbacGuard implements CanActivate {
 
//     constructor( private readonly reflector: Reflector) {}

//     canActivate(context: ExecutionContext): boolean {
//         console.log("***** RbacGuard ");
//         const role =this.reflector.get<Role>(RBAC, context.getHandler());
      
//         /// Role Enum 에 해당되는 값이 데코레이터에 들어갔는지 확인하기!
//         if(!Object.values(Role).includes(role)) {
//             //값이 없으면 적용을 안한다.
//             return true;
//         }
     

//         const request :ExpressRequest = context.switchToHttp().getRequest();

//         const user : User= request.user as User;

//         if(!user){
//             return false;
//         }
//         console.log('***** user.role', user.role, 'role', role);
//         //높은 권한을 가진 사용자가 낮은 권한을 가진 사용자를 접근할 수 있도록 한다.
//         // ex)
//         // 0 admin,
//         // 1 paidUser,
//         // 2 user,
//         // user.role 이 데코레이터에 있는 role 보다 작거나 같으면 true, 아니면 false
//         return user.role <= role;
//     }

// }


import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, User } from '@prisma/client';
import { RBAC_KEY } from '../decorator/rbac.decorator';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import type { Request } from 'express';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  private readonly rolePriority: Record<Role, number> = {
    [Role.admin]: 0,
    [Role.paidUser]: 1,
    [Role.user]: 2,
  };

  canActivate(context: ExecutionContext): boolean {
    // ✅ 1. @Public() 우회 처리
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      console.log('[RbacGuard] Public 메서드 - 인증 우회');
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(RBAC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as User;

    // ✅ 2. 로그인되지 않은 사용자 차단
    if (!user) {
      throw new ForbiddenException('로그인이 필요합니다.');
    }

    // ✅ 3. 역할 제한이 없으면 통과
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // ✅ 4. 역할 우선순위 비교
    const userLevel = this.rolePriority[user.role];
    const requiredMinLevel = Math.min(
      ...requiredRoles.map((r) => this.rolePriority[r]),
    );

    const hasPermission = userLevel <= requiredMinLevel;

    if (!hasPermission) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return true;
  }
}
