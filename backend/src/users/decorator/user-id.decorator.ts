
import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { UserPayload } from "src/auth/types/user-payload.interface";

interface CustomRequest extends Request {
    user: UserPayload; 
}

export const UserId = createParamDecorator(
    (data:unknown, context:ExecutionContext) => {
        const request=context.switchToHttp().getRequest<CustomRequest>();
     
        if(!request || !request.user || !request.user.sub){
            throw new UnauthorizedException('사용자  정보를 찾을 수 없습니다.');
        }

        return request?.user?.sub;
    }
);