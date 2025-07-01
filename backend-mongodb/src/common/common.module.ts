import {Module} from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from 'src/movies/entity/movie.entity';
import { TasksService } from './tasks.service';
import { DefaultLogger } from './logger/default.logger';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaService } from './prisma.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        /// ......./Netflix/public/movie
        /// process.cwd() + '/public' + '/movie'
        /// process.cwd() + '\public' + '\movie'
        destination: join(process.cwd(), 'public', 'temp'),
        filename: (req, file, cb) => {
          const split = file.originalname.split('.');

          let extension = 'mp4';

          if (split.length > 1) {
            extension = split[split.length - 1];
          }

          cb(null, `${uuidv4() ?? ''}_${Date.now()}.${extension}`);
        },
      }),
    }),

    TypeOrmModule.forFeature([Movie]),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          username: configService.get<string>('REDIS_USERNAME'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    BullModule.registerQueue({
      name: 'thumbnail-generation',
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService, TasksService, DefaultLogger, PrismaService],
  exports: [CommonService, PrismaService],
})
export class CommonModule {}