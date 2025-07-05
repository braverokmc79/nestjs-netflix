import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from 'src/users/entity/user.entity';
import { JwtModule  } from '@nestjs/jwt';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/users/schema/user.schema';



@Module({
  imports: [
    //TypeOrmModule.forFeature([User]), 
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({}) ,
    UsersModule,
    CommonModule
  ],

  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService, JwtModule], 
})
export class AuthModule {}



