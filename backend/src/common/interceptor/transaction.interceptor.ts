import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UseInterceptors,

} from '@nestjs/common';
import { catchError, mergeMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { DataSource, QueryRunner } from 'typeorm';
import { NO_TRANSACTION_KEY } from './no-transaction.decorator';

// Request 타입 확장: queryRunner를 직접 넣기 위해 인터페이스 확장
export interface RequestWithQueryRunner extends Request {
  queryRunner: QueryRunner;
}



// ✅ 전체 요약
// CustomRequest를 통해 req.queryRunner 타입 안전하게 확장.

// QueryRunner를 생성하고 트랜잭션을 시작.

// 요청이 성공하면 commit + release, 실패하면 rollback + release.

// rxjs 연산자인 mergeMap, catchError와 from()을 활용하여 Promise → Observable로 변환하여 타입 오류 방지.

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
    constructor(
      private readonly dataSource: DataSource,
       private readonly reflector: Reflector,

  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<RequestWithQueryRunner>();
     // console.log('❤❤❤❤❤❤11트랜잭션 처리 ::::::::::::');
      
     const method = req.method.toUpperCase();
      
    // ⭐ ① 메타데이터 검사 (핸들러 or 클래스에 @NoTransaction 붙었는지)
    const noTransaction = this.reflector.getAllAndOverride<boolean>(
      NO_TRANSACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // ⭐ ② 트랜잭션 제외 조건 검사
    if (noTransaction || ['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }
   
    console.log("❤❤❤❤❤❤22트랜잭션 처리 ::::::::::::")

    // QueryRunner 생성 및 트랜잭션 시작
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    // Request 객체에 queryRunner 주입 → 서비스/컨트롤러에서 사용 가능
    req.queryRunner = qr;

    return next.handle().pipe(
      // 요청 처리 완료 후 트랜잭션 커밋 + 연결 해제
      mergeMap((data: unknown) =>
        from(
          qr
            .commitTransaction()
            .then(() => qr.release())
            .then(() => {
              console.log('❤트랜잭션 처리 완료 ::::::::::::::');
              return data;
              }              
            ), // data는 그대로 반환
        ),
      ),
      // 요청 처리 중 에러 발생 시 롤백 + 연결 해제
      catchError((err) =>
        
        from(
          qr
            .rollbackTransaction()
            .then(() => qr.release())
            .then(() => {
                console.log('❤트랜잭션 오류 롤백 처리 ::::::::::::');
              throw err; // 원본 에러 다시 throw (Nest가 처리)
            }),
        ),
      ),
    );
  }
}

export const Transactional = () => UseInterceptors(TransactionInterceptor);