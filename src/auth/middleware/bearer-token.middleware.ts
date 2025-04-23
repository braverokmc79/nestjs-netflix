import { BadRequestException, Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { envVariableKeys } from "src/common/const/env.const";
import { UserPayload } from "../types/user-payload.interface";

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {       
        const authHeader = req.headers['authorization'];

        //console.log('🎈🎈🎈🎈BearerTokenMiddleware called! authHeader',authHeader);

        if (!authHeader) {
            next();
            return;
        }

        const token = this.validateBearerToken(authHeader);
       // console.log('🎈🎈🎈🎈BearerTokenMiddleware called! token', token);
        try {          
            const decodedPayload: UserPayload = this.jwtService.decode(token);

            if(decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access'){
                throw new UnauthorizedException('잘못된 토큰입니다!');
            }

            const secretKey = decodedPayload.type === 'refresh' ?
                envVariableKeys.refreshTokenSecret :
                envVariableKeys.accessTokenSecret;

            const payload : UserPayload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>(
                    secretKey,
                ),
            });

            req.user = payload;
            next();
        } catch (e : unknown) {
            //🔖 미들웨어는 토큰이 존재시 유저정보만 반화하는 역할을 하기위해 
            //🔖 throw 는 주석 처리 한다. 접근성 여부는 gard에서 처리하기로 한다.

            if (e instanceof Error && e.name === 'TokenExpiredError') {
                //throw new UnauthorizedException('토큰이 만료됐습니다.');
            }

            // 그 외 에러도 Nest에 맡김            
            //throw new UnauthorizedException('유효하지 않은 토큰입니다.');
            //===>🎈@Public() 경우에 토큰검증을 하기 때문에 오류 따라서,TokenExpiredError 가 아닌 이상
            // ====> gard에서 처리하기로 함 :
            next();
        }
    }

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