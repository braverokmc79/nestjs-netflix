import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
} from '@nestjs/common';

import { Request, Response } from 'express'; 

@Catch(ForbiddenException)
export class ForbiddenExceptionFilter implements ExceptionFilter {

  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
     console.log("============================ ForbiddenExceptionFilter ");


    const response: Response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status: number = exception.getStatus();

    console.log(`[UnauthorizedException] ${request.method} ${request.url}`);

        response.status(status).json({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                message: '권한이 없습니다!!!',
        });
  }
}
