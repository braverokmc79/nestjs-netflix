import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch() // <== 여기 수정
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    // <== HttpException 대신 any
    console.error('필터에서 예외 발생 =====>', exception);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    let errorMessage: string | string[] = 'Internal Server Error';
    let errorType: string = 'Error';
    let errorData: Record<string, any> = {};

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        errorData = exceptionResponse as Record<string, any>;

        if ('message' in errorData) {
          errorMessage = errorData.message as string | string[];
        }

        if ('error' in errorData) {
          errorType = errorData.error as string;
        }
      } else if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
        errorType = exception.name;
      }
    } else {
      errorMessage = (exception as Error).message;
      errorType = (exception as { name: string }).name ?? 'Error';

      errorMessage = errorMessage ?? 'Unknown error';
      errorType = errorType ?? 'Error';
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorType,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
