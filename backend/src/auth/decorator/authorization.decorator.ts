import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express'; 

export const Authorization = createParamDecorator(
  (data: unknown, context: ExecutionContext): string | undefined => {
    const req = context.switchToHttp().getRequest<Request>();
    return req.headers?.['authorization'] ?? undefined;
  },
);
