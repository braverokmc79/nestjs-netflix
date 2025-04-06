import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {  User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './strategy/jwt.strategy';
import { envVariableKeys } from 'src/common/const/env.const';



@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}



  parseBasicToken(rawToken: string) {
    //1)토큰을  '' 기준으로 스프릿 한 후 토큰 값만 추출하기
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    const [basic, token] = basicSplit;
    
    if(basic.toLowerCase() !== 'basic') {
      throw new BadRequestException('Basic 토큰이 아닙니다.');
    }

    //2) 추출한 토큰을 Base64 decoding  해서 이메일과 비밀번호를 나눈다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    /// "email:password"
    const tokenSplit = decoded.split(':');
    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    const [email, password] = tokenSplit;
    return { email, password };
  }



  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    try {
      const bearerSplit = rawToken.split(' ');
    
      if (bearerSplit.length !== 2) {
        throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
      }
    
      const [bearer, token] = bearerSplit;
      if (bearer.toLowerCase() !== 'bearer') {
        throw new BadRequestException('Bearer 토큰이 아닙니다.');
      }
    
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>(envVariableKeys.refreshTokenSecret),
      });
    
   
      if(isRefreshToken){
        if(payload.type !== 'refresh') {
          throw new BadRequestException('Refresh 토큰을 입력해 주세요.!');
        }
      }else{
        if(payload.type !== 'access') {
          throw new BadRequestException('Access 토큰을 입력해 주세요.!');
        }
     }
      return payload;
    } catch (error) { 
      console.log("👺👺👺👺👺");     
      throw new UnauthorizedException('유효하지 않은 토큰입니다.'+(error as Error).message);
    }
   
  }
  



  async registerUser(rowToken: string) {
    const { email, password } = this.parseBasicToken(rowToken);
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException('이미 가입한 이메일 입니다.');
    }

    const hashRounds = this.configService.get<number>('HASH_ROUNDS') || 10;
    const hashedPassword = await bcrypt.hash(password, hashRounds);
    await this.usersRepository.save({
      username: email,
      email,
      password: hashedPassword,
    });
    return this.usersRepository.findOne({ where: { email } });
  }



  async authenticate(email: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }
    return user;
  }



  async issueToken(user : JwtPayload, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(envVariableKeys.refreshTokenSecret);
    const accessTokenSecret = this.configService.get<string>(envVariableKeys.accessTokenSecret);
    
    return  await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '14d' : 300,
      },
    );
  }




  async login(token: string) {
    const { email, password } = this.parseBasicToken(token);
    const user = await this.authenticate(email, password);
    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false)
    }    
  }



  

}
