import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {  User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './strategy/jwt.strategy';
import { envVariableKeys } from 'src/common/const/env.const';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';



@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService:UsersService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {}


  async tokenBlock(token: string) {

    const payload : JwtPayload = this.jwtService.decode(token);
    if (!payload || !payload.exp) {
      throw new UnauthorizedException('차단된 토큰입니다.');
    }

    const expiryDate =new Date(payload['exp'] * 1000);// JWT 만료 시각
    
    const now = +Date.now();  // 현재 시각
    const differenceInSeconds =(expiryDate.getTime()-now)/1000;                 
    const ttl = Math.max((differenceInSeconds)*1000, 1);

    await this.cacheManager.set(`BLOCK_TOKEN_${token}`, payload, ttl);

    return true;
  }


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
  
      const bearerSplit = rawToken.split(' ');
    
      if (bearerSplit.length !== 2) {
        throw new BadRequestException('토큰 포맷이 잘못되었습니다.');
      }
    
      const [bearer, token] = bearerSplit;
      if (bearer.toLowerCase() !== 'bearer') {
        throw new BadRequestException('Bearer 토큰이 아닙니다.');
      }
    
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
          secret: this.configService.getOrThrow<string>(
            isRefreshToken
              ? envVariableKeys.refreshTokenSecret
              : envVariableKeys.accessTokenSecret,
          ),
        });

        if (isRefreshToken) {
          if (payload.type !== 'refresh') {
            throw new BadRequestException('Refresh 토큰을 입력해 주세요.!');
          }
        } else {
          if (payload.type !== 'access') {
            throw new BadRequestException('Access 토큰을 입력해 주세요.!');
          }
        }
        return payload;
      } catch (error) {
        //console.log('👺👺👺👺👺');
        throw new UnauthorizedException(
          '유효하지 않은 토큰입니다.' + (error as Error).message,
        );
      }
   
  }
  



  async registerUser(rowToken: string, body?:{username: string, name: string}) {
    const { email, password } = this.parseBasicToken(rowToken);
    
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException('이미 가입한 이메일 입니다.');
    }
    
    const username= body?.username || "";
    const name= body?.name || "";

    const createUserDto =new CreateUserDto();
    createUserDto.email = email;
    createUserDto.password = password;
    createUserDto.username = username;
    createUserDto.name = name;
    await this.userService.create(createUserDto);
    //const result = 
    // console.log("회원 가입 반환값  :",result);
    // return result

  }


  

  async authenticate(email: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다.1');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('잘못된 로그인 정보입니다.2');
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
        expiresIn: isRefreshToken ? '14d' : 30000000,
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
