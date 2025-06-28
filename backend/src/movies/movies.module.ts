import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import {  MoviesController } from './movies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { Content } from './entity/content.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { CommonModule } from 'src/common/common.module';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { User } from 'src/users/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Content,
      Movie,
      MovieDetail,
      Director,
      Genre,
      User,
      MovieUserLike,
      CommonModule,
    ]),
    CommonModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
