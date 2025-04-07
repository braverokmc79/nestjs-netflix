import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { MoviesModule } from './movies/movies.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import * as Joi from 'joi';
import { Content } from './movies/entity/content.entity';
import { Movie } from './movies/entity/movie.entity';
import { MovieDetail } from './movies/entity/movie-detail.entity';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entity/director.entity';
import { GenreModule } from './genre/genre.module';
import { Genre } from './genre/entity/genre.entity';
import { AuthModule } from './auth/auth.module';

import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NESTJS_ENV: Joi.string().valid('dev', 'prod').required(),
        DB_TYPE: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Content, Movie, MovieDetail, Director, Genre, User],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    MoviesModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 미들웨어 설정이 필요한 경우 여기에 작성
    consumer.apply(
       BearerTokenMiddleware, // JWT 토큰 검증 미들웨어
    ).exclude({
      path: 'auth/login', 
      method: RequestMethod.POST,
    }
    ,{
      path: 'auth/register',
      method: RequestMethod.POST
    }
  ).forRoutes('*');


  }
}
