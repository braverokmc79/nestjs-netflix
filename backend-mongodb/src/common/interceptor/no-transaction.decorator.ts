// no-transaction.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const NO_TRANSACTION_KEY = 'NO_TRANSACTION';
export const NoTransaction = () => SetMetadata(NO_TRANSACTION_KEY, true);



/**
    ✅ 4단계: 예외 라우트에서 사용

    @Controller('health')
    export class HealthController {
    @Get()
    @NoTransaction()
    getHealth() {
        return { status: 'ok' };
    }
    }
    또는 컨트롤러 전체에 적용할 수도 있어요:


    @NoTransaction()
    @Controller('public')
    export class PublicController {
    @Get('info')
    getPublicInfo() {
        return { public: true };
    }
    }

*/