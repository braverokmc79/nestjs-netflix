import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { Content } from './entity/content.entity';
import { Director } from 'src/director/entity/director.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Content,Movie, MovieDetail ,Director])],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
