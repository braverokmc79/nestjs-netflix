import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { Content } from './entity/content.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import {v4} from 'uuid'

@Module({
  imports: [TypeOrmModule.forFeature([Content,Movie, MovieDetail ,Director,Genre]),
    CommonModule,
    MulterModule.register({
      storage: diskStorage({
        /// ...../NEXTJS-NETFLIX/public/movie
        // destination: join(process.cwd(), 'public', "movie"),
        // filename: (req, file, cb) => {
        //   const split = file.originalname.split('.');

        //   let extension = "mp4";
        //   if (split.length > 1) {
        //     extension = split[split.length - 1];
        //   }
          
        //   cb(null, `${v4()}_${Date.now()}.${extension}`);
        // }
      })
    })
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
