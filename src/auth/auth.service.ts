import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';



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
    console.log(' basicSplit ', basicSplit);

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    //const [_, token] = basicSplit;
    const token = basicSplit[1];

    console.log(' token ', token);
    //2) 추출한 토큰을 Base64 decoding  해서 이메일과 비밀번호를 나눈다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    console.log(' decoded ', decoded);

    /// "email:password"
    const tokenSplit = decoded.split(':');

    console.log(' tokenSplit ', tokenSplit);

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포멧이 잘못되었습니다.');
    }

    const [email, password] = tokenSplit;

    console.log(' email, password ', email, password);
    return { email, password };
  }

  async registerUser(rowToken: string) {
    const { email, password } = this.parseBasicToken(rowToken);

    const user = await this.usersRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException('이미 가입한 이메일 입니다.');
    }

    const hashRounds = this.configService.get<number>('HASH_ROUNDS') || 10;
    console.log('💋hashRounds ', hashRounds);

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


  async login(token: string) {
    const { email, password } = this.parseBasicToken(token);

    const user = await this.authenticate(email, password);

    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );
    const accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    );

    return {
      refreshToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'refresh',
        },
        {
          secret: refreshTokenSecret,
          expiresIn: '14d',
        },
      ),

      accessToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'access',
        },
        {
          secret: accessTokenSecret,
          expiresIn: 300,
        },
      ),
    };
  }
}
