import {  MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { MoviesModule } from './movies/movies.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';

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
import { User } from './users/entity/user.entity';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.guard';
import { RbacGuard } from './auth/guard/rbac.guard';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { QueryFailedExceptionFilter } from './common/filter/query-failed.filter';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MovieUserLike } from './movies/entity/movie-user-like.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottleInterceptor } from './common/interceptor/throttle.interceptor';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston/dist/winston.module';
import * as winston from 'winston';
import * as dayjs from 'dayjs';
import * as weekday from 'dayjs/plugin/weekday';
import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import { envVariableKeys } from './common/const/env.const';
import { ChatModule } from './chat/chat.module';
import { Chat } from './chat/entity/chat.entity';
import { ChatRoom } from './chat/entity/chat-room.entity';
import { HealthModule } from './health/health.module';
import { WorkerModule } from './work/worker.module';
import { TransformableInfo } from 'logform';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.test.env' : '.env',
      validationSchema: Joi.object({
        NESTJS_ENV: Joi.string().valid('test', 'dev', 'prod').required(),
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
        // prisma
        // url: configService.get<string>(envVariableKeys.dbUrl),
        // type: configService.get<string>(envVariableKeys.dbType) as 'postgres',


        //typeorm
        type: configService.get<string>('DB_TYPE') as 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),


        entities: [
          Content,
          Movie,
          MovieDetail,
          MovieUserLike,
          Director,
          Genre,
          User,
          Chat,
          ChatRoom,
        ],

        //synchronize는 TypeORM이 애플리케이션 실행 시 DB 스키마를 자동으로 동기화할지를 설정하는 옵션입니다
        synchronize:
          configService.get<string>(envVariableKeys.env) === 'prod'
            ? false
            : true,
        // ...(configService.get<string>(envVariableKeys.env) ==='prod' && {
        //   ssl: {
        //     // SSL 연결을 사용하되, 서버의 SSL 인증서가 "신뢰할 수 없더라도" 연결을 허용하겠다
        //     //인증서가 자체 서명(self-signed) 이거나 신뢰할 수 없는 기관(CA)에서 발급되었을 경우에도
        //     // rejectUnauthorized: false로 설정하면 연결을 막지 않고 허용합니다.
        //     rejectUnauthorized: false
        //   }
        //  }),

        // ssl:{
        //   rejectUnauthorized: false
        // }
      }),
      inject: [ConfigService],
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public/',
    }),
    CacheModule.register({
      ttl: 10000, //10초
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    /** 🎈 winston 로그 설정  */
    WinstonModule.forRoot({
      level: 'silly', // error:0, warn:1, info:2, http:3, verbose:4, debug:5, silly:6
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize({ all: true }),
            winston.format.simple(),
            winston.format.printf((info) => {
              dayjs.extend(weekday);
              dayjs.extend(customParseFormat);
              const formattedTime = dayjs(String(info.timestamp)).format(
                'YYYY-MM-DD HH:mm:ss (ddd)',
              );
              return `[${info.level}] [${String(formattedTime)}] [${String(info.context)}] : ${String(info.message)}`;
            }),
          ),
        }),
        new winston.transports.File({
          level: 'error',
          dirname: join(process.cwd(), 'logs'),
          filename: 'logs.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf((info) => {
              
              dayjs.extend(weekday);
              dayjs.extend(customParseFormat);
              const formattedTime = dayjs(String(info.timestamp)).format(
                'YYYY-MM-DD HH:mm:ss (ddd)',
              );
              return `[${info.level}] [${String(formattedTime)}] [${String(info.context)}] : ${String(info.message)}`;
            }),
          ),
        }),
      ],
    }),

    MoviesModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UsersModule,
    ChatModule,
    HealthModule,
    ConditionalModule.registerWhen(
      WorkerModule,
      (env: NodeJS.ProcessEnv) => env['TYPE'] === 'worker',
    ),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },

    // {
    //   provide: APP_FILTER,
    //   useClass: ForbiddenExceptionFilter,
    // },

    {
      provide: APP_FILTER,
      useClass: QueryFailedExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ThrottleInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 미들웨어 설정이 필요한 경우 여기에 작성
    consumer
      .apply(
        BearerTokenMiddleware, // JWT 토큰 검증 미들웨어
      )
      .exclude(
        {
          path: 'auth/login',
          method: RequestMethod.POST,
          version: '1',
        },
        {
          path: 'auth/register',
          method: RequestMethod.POST,
          version: '1',
        },
        { path: 'health', method: RequestMethod.GET }, // ✅ 헬스 체크 라우트 추가
      )
      .forRoutes('*');
  }
}
