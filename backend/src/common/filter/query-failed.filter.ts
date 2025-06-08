import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express'; 

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();


    const status = 400;

    console.log(exception);

    let message = '데이터베이스 에러 발생!';

        if (
          (exception instanceof Error &&
            typeof exception.message === 'string' &&
            ( exception.message.includes('duplicate key') ||
              exception.message.includes('중복된 키')
            )
          )
        ) {
          message = '중복 키 에러!';
        }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
