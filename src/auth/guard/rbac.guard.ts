import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role, User } from "src/users/entities/user.entity";
import type { Request as ExpressRequest } from 'express';
import { RBAC } from "../decorator/rbac.decorator";

@Injectable()
export class RbacGuard implements CanActivate {
 
    constructor( private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {  
      

        const role =this.reflector.get<Role>(RBAC, context.getHandler());
        console.log('🎈RbacGuard11', role);

        /// Role Enum 에 해당되는 값이 데코레이터에 들어갔는지 확인하기!
        if(!Object.values(Role).includes(role)) {
          
            //값이 없으면 적용을 안한다.
            return true;
        }
     

        const request :ExpressRequest = context.switchToHttp().getRequest();

        const user : User= request.user as User; 

        if(!user){        
            return false;
        }

        //높은 권한을 가진 사용자가 낮은 권한을 가진 사용자를 접근할 수 있도록 한다.
        // ex)
        // 0 admin, 
        // 1 paidUser,
        // 2 user,         
        // user.role 이 데코레이터에 있는 role 보다 작거나 같으면 true, 아니면 false
        console.log('🎈user.role', user.role, 'role', role);
        return user.role <= role; 
    }

}