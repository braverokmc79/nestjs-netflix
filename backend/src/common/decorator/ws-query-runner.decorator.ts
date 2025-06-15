import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { QueryRunner } from 'typeorm';


export const WsQueryRunner =createParamDecorator(
   (data: any, context: ExecutionContext) => {
   const client = context.switchToWs().getClient<Socket>(); 
   type ClientData = { queryRunner?: QueryRunner };
   const clientData = client?.data as ClientData;

    if(!client || !clientData || !clientData.queryRunner ){
           
        throw new InternalServerErrorException('사용자  정보를 찾을 수 없습니다.');
    }

    return clientData.queryRunner;
}); 