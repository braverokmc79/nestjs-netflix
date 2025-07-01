import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { RequestWithQueryRunner } from '../interceptor/transaction.interceptor';



export const QueryRunner =createParamDecorator(
    (data: any, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithQueryRunner>(); 

    if(!request || !request.queryRunner){
        throw new InternalServerErrorException('사용자  정보를 찾을 수 없습니다.');
    }

    return request.queryRunner;
}); 