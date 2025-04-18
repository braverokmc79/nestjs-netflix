import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import type { Request } from '@nestjs/common';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
      console.log("❤❤❤❤❤ 인터 셉터:")
      const req = context.switchToHttp().getRequest<Request>();
      
      const reqTime = Date.now();
      
      return next.handle()
          .pipe(
             delay(1100),
              
                tap(() => {
                    const resTime = Date.now();

                    const diff = resTime - reqTime;
                    
                
                    if(diff > 1000) {
                        console.log(`${req.method} ${req.url} ${diff}ms`);

                        throw new InternalServerErrorException(`시간이 오래 걸렸네요. ${req.method} ${req.url} ${diff}ms`);
                    } else {
                        console.log(`${req.method} ${req.url} ${diff}ms`);
                    }

                })
        )
    
      
  }
    
    
}