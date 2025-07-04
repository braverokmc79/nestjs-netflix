import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from './entity/user.entity';
import { CommonModule } from 'src/common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schema/user.schema';




@Module({
  imports: [
    //TypeOrmModule.forFeature([User]),

    MongooseModule.forFeature([
      {
        name: 'User',
        schema: UserSchema,
      },
    ]),
    CommonModule,

  ],

  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
