import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { Content } from './entity/content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Content,Movie, MovieDetail])],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
