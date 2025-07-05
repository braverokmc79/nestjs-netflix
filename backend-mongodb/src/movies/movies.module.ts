import { Module } from '@nestjs/common';

import { CommonModule } from 'src/common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './schema/movie.schema';
import { MovieDetail, MovieDetailSchema } from './schema/movie-detail.schema';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { MovieUserLikeSchema } from './schema/movie-user-like.schema';
import { Director, DirectorSchema } from 'src/director/schema/director.schema';
import { Genre } from 'src/genre/entity/genre.entity';
import { GenreSchema } from 'src/genre/schema/genre.schema';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { User } from 'src/users/entity/user.entity';
import { UserSchema } from 'src/users/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Movie.name, schema: MovieSchema },
      { name: MovieDetail.name, schema: MovieDetailSchema },
      { name: MovieUserLike.name, schema: MovieUserLikeSchema },
      { name: Director.name, schema: DirectorSchema },
      { name:Genre.name, schema:GenreSchema},
      {name:User.name, schema:UserSchema},
      
    ]),
    CommonModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
