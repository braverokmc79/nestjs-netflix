import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, of, tap } from "rxjs";
import type { Request } from 'express';


@Injectable()
export class CacheInterceptor implements NestInterceptor{

    private  cache = new Map<string, any>();

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        console.log('❤❤❤❤❤ 캐시 인터 셉터:');
        const req = context.switchToHttp().getRequest<Request>();
        

        const key = `${req.method}-${req.url}`;

        if (this.cache.has(key)) {
            return of(this.cache.get(key));   
        }
        
        return next.handle()
                .pipe(
                    tap(response => this.cache.set(key, response)),
                )

    }

    
}