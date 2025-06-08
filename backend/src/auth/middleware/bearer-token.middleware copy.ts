import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Inject, Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { envVariableKeys } from "src/common/const/env.const";

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService, // JWT 서명 및 검증을 위한 서비스
        private readonly configService: ConfigService, // .env 환경 변수 접근용 서비스

        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache, // NestJS 캐시 매니저 (메모리/레디스 등)
    ) { }

    async use(req: Request, res: Response, next: NextFunction) {
        // Authorization 헤더에서 토큰을 추출
        const authHeader = req.headers['authorization'];

        // 헤더가 없는 경우, 인증 없이 통과 (next 호출)
        if (!authHeader) {
            next();
            return;
        }

        // "Bearer xxx" 형식 확인 및 토큰 값만 추출
        const token = this.validateBearerToken(authHeader);

        // 캐시에서 해당 토큰이 블랙리스트(차단된 토큰)인지 조회
        const blockedToken = await this.cacheManager.get<string>(`BLOCK_TOKEN_${token}`);
        
        // 차단된 토큰이면 예외 발생
        if (blockedToken) {
            throw new UnauthorizedException('차단된 토큰입니다!');
        }

        // 캐시에 이미 파싱된 토큰 payload가 있다면 활용
        const tokenKey = `TOKEN_${token}`;
        const cachedPayload = await this.cacheManager.get(tokenKey);

        if (cachedPayload) {
            // 캐시된 사용자 정보를 요청 객체에 담고 다음 미들웨어로 이동
            req.user = cachedPayload;
            return next();
        }

        // 토큰을 디코딩 (검증은 아직 아님)
        const decodedPayload = this.jwtService.decode(token) as Record<string, any> | null;

        // 디코딩 실패 or 예상하지 않은 토큰 타입이면 예외 발생
        if (!decodedPayload || (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access')) {
            throw new UnauthorizedException('잘못된 토큰입니다!');
        }

        try {
            // 토큰 타입에 따라 사용할 비밀 키 결정
            const secretKey = decodedPayload.type === 'refresh'
                ? envVariableKeys.refreshTokenSecret
                : envVariableKeys.accessTokenSecret;

            // 비밀 키로 토큰 검증 및 payload 추출
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>(
                    secretKey
                ),
            });

            // 만료 시간 계산 (epoch → ms 변환)
            const expiryDate = +new Date(payload['exp'] * 1000);
            const now = +Date.now();

            // 남은 만료 시간(초 단위) 계산
            const differenceInSeconds = (expiryDate - now) / 1000;

            // 캐시에 저장 (만료 시간에서 약간의 여유를 줌)
            await this.cacheManager.set(
                tokenKey,
                payload,
                Math.max((differenceInSeconds - 30) * 1000, 1) // 최소 1ms
            );

            // 사용자 정보를 요청 객체에 담고 다음 미들웨어로 이동
            req.user = payload;
            next();

        } catch (e) {
            // 만료된 토큰이면 예외 던짐
            if (e.name === 'TokenExpiredError') {
                throw new UnauthorizedException('토큰이 만료됐습니다.');
            }

            // 그 외 오류는 무시하고 다음으로 넘김
            next();
        }
    }

    // "Bearer $token" 포맷 확인 후 토큰 추출하는 유틸
    validateBearerToken(rawToken: string) {
        const basicSplit = rawToken.split(' ');

        if (basicSplit.length !== 2) {
            throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
        }

        const [bearer, token] = basicSplit;

        if (bearer.toLowerCase() !== 'bearer') {
            throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
        }

        return token;
    }
}
