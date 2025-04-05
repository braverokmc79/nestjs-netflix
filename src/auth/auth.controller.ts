import { ClassSerializerInterceptor, Controller, Get, Headers, Post, Request,  UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/users/entities/user.entity';
import type{ Request as ExpressRequest } from 'express';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerUser(@Headers('authorization') token: string) {
    return this.authService.registerUser(token);
  }

  @Post('login')
  loginUser(@Headers('authorization') token: string) {
    return this.authService.login(token);
  }

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

  @UseGuards(JwtAuthGuard)
  @Get('private')
  private(@Request() req: ExpressRequest) {
    const user = req.user as User;
    return user;
  }



}
