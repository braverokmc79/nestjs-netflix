import { Body, ClassSerializerInterceptor, Controller, Get, Headers, Post, Request,  UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/users/entities/user.entity';
import type{ Request as ExpressRequest } from 'express';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard} from './strategy/jwt.strategy';
import { Public } from './decorator/public.decorator';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  registerUser(@Headers('authorization') token: string,
    @Body() body :{username: string, name: string}
  ) {
    console.log('body', body);
    return this.authService.registerUser(token, body);
  }

  @Public()
  @Post('login')
  loginUser(@Headers('authorization') token: string) {
    console.log('*** token', token);
    return this.authService.login(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Request() req : ExpressRequest) {
    const user = req.user as User;
    return {      
      accessToken: await this.authService.issueToken(user, false),
    };
  }

  /**
   * 
   * @param req 
   JSON 형식으로 요청을 보낼 때는 아래와 같이 요청을 보낸다.
   {
      "username":"user1@gmail.com",
      "password":"1111"
    }
   * @returns 
   */
  //@UseGuards(AuthGuard('local'))
  @UseGuards(LocalAuthGuard)
  @Post('login/passport')
  async loginUserPassport(@Request() req: ExpressRequest) {
    const user = req.user as User;
    return {
      refreshToken: await this.authService.issueToken(user, true),
      accessToken: await this.authService.issueToken(user, false),
    };
  }

  /**
    Bearer Token 형식으로 요청을 보낼 때는 아래와 같이 요청을 보낸다.
   Authorization: Bearer {accessToken}
   */
  @UseGuards(JwtAuthGuard)
  @Get('private')
  private(@Request() req: ExpressRequest) {
    const user = req.user as User;
    return user;
  }
}
