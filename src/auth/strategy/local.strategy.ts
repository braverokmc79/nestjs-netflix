import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { User } from "src/users/entities/user.entity"; // 실제 User 타입 위치로 조정하세요

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class LocalAuthGuard extends AuthGuard('local') {}

@Injectable()
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    // passport-local은 기본적으로 username, password를 받습니다.
    // 우리는 email로 로그인할 것이므로 설정을 바꿔야 함
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.authService.authenticate(email, password);
    if (!user) {
      throw new UnauthorizedException('로그인 정보가 올바르지 않습니다.');
    }
    return user;
  }
}
