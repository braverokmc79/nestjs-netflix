import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { catchError, Observable, tap } from "rxjs";
import { DataSource } from "typeorm";
import { Socket } from 'socket.io';

@Injectable()
export class WsTransactionInterceptor implements NestInterceptor {
    constructor(
        private readonly dataSource: DataSource,
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const client = context.switchToWs().getClient<Socket>();
        
        const qr = this.dataSource.createQueryRunner();

        await qr.connect();
        await qr.startTransaction();

        (client.data as { queryRunner?: typeof qr }).queryRunner = qr;

        return next.handle()
            .pipe(
                catchError(
                    async (e)=>{
                        await qr.rollbackTransaction();
                        await qr.release();

                        throw e;
                    }
                ),
                tap(() => {
                    qr.commitTransaction()
                        .then(() => qr.release())
                        .catch(() => qr.release());
                }),
            );
    }
}