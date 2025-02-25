import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    console.error('필터에서 예외 발생 =================================');

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorMessage: string | string[] = 'An error occurred';
    let errorData: Record<string, any> = {};
    let errorType: string = 'Error';

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

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorType,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
