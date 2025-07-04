import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

import { Director } from 'src/director/schema/director.schema';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';
import { InjectModel } from '@nestjs/mongoose';
import { Movie } from './schema/movie.schema';
import { Model, Types,  } from 'mongoose';
import { MovieDetail } from './schema/movie-detail.schema';
import { Genre } from 'src/genre/schema/genre.schema';
import { MovieUserLike } from './schema/movie-user-like.schema';
import { User } from 'src/users/schema/user.schema';


@Injectable()
export class MoviesService {
  constructor(
     @InjectModel(Movie.name)
    private readonly movieModel: Model<Movie>,
    @InjectModel(MovieDetail.name)
    private readonly movieDetailModel: Model<MovieDetail>,
    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    
    @InjectModel(MovieUserLike.name)
    private readonly movieUserLikeModel: Model<MovieUserLike>,
  
    private readonly commonService: CommonService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.movieModel
      .find()
      .populate({
        path: 'genres',
        model: 'Genre',
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();
    // const data = await this.prisma.movie.findMany({
    //   orderBy: {
    //     createdAt: 'desc'
    //   },
    //   take: 10,
    // })
    // const data = await this.movieRepository.find({
    //   order: {
    //     createdAt: 'DESC',
    //   },
    //   take: 10,
    // });

    await this.cacheManager.set('MOVIE_RECENT', data);

    return data;
  }

  /* istanbul ignore next */
  async getMovies() {
    await this.movieModel.find();
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    await this.movieUserLikeModel.find({ movie: { $in: movieIds }, user: userId });
  }


  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title, cursor, take, order } = dto;

    const orderBy = order.reduce((acc, field) => {
      const [column, direction] = field.split('_');
      if (column === 'id') {
        acc['_id'] = direction.toLowerCase();
      } else {
        acc[column] = direction.toLowerCase();
      }
      return acc;
    }, {});

    // const orderBy = order.map((field) => {
    //   const [column, direction] = field.split('_');
    //   return { [column]: direction.toLocaleLowerCase() }
    // })

    // const movies = await this.prisma.movie.findMany({
    //   where: title ? { title: { contains: title } } : {},
    //   take: take + 1,
    //   skip: cursor ? 1 : 0,
    //   cursor: cursor ? { id: parseInt(cursor) } : undefined,
    //   orderBy,
    //   include: {
    //     genres: true,
    //     director: true,
    //   }
    // })

    const query = this.movieModel
      .find(
        title
          ? {
              title: {
                $regex: title,
              },
              $option: 'i',
            }
          : {},
      )
      .sort(orderBy)
      .limit(take + 1);

    if (cursor) {
      query.lt('_id', new Types.ObjectId(cursor));
    }

    const movies = await query.populate('genres director').exec();

    const hasNextPage = movies.length > take;

    if (hasNextPage) movies.pop();

    const nextCursor = hasNextPage
      ? movies[movies.length - 1].toObject()._id
      : null;

   

    if (userId) {
      const movieIds = movies.map((movie) => movie._id);
   
      const likedMovies =
        movieIds.length < 1
          ? []
          : await this.movieUserLikeModel
              .find({
                movie: {
                  $in: movieIds.map((id) => new Types.ObjectId(id as string)),
                },
                user: new Types.ObjectId(userId.toString()),
              })
              .populate('movie')
              .exec();
   


      // const likedMovieMap: { [key: string]: boolean | null } =
      //   likedMovies.reduce(
      //     (acc, next) => ({
      //       ...acc,
      //       [next.movie._id.toString()]: next.isLike,
      //     }),
      //     {},
      //   );
      
      // return {
      //   data: movies.map((movie) => ({
      //     ...movie.toObject(),
      //     likeStatus: Object.prototype.hasOwnProperty.call(
      //       likedMovieMap,
      //       movie._id,
      //     )
      //       ? likedMovieMap[movie._id.toString()]
      //       : null,
      //   })) as (MovieDocument & {
      //     likeStatus: boolean;
      //   })[],

      //   nextCursor,
      //   hasNextPage,
      // };
   
    }

    return {
      data: movies,
      nextCursor,
      hasNextPage,
    };
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    await this.movieDetailModel.findById(id);
  }  

  async findOne(id: string) {
    const movie = await this.movieModel.findById(id);
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }

    return movie;
  }

  // /* istanbul ignore next */
  // async createMovieDetail(qr: QueryRunner, createMovieDto: CreateMovieDto) {
  //   // return qr.manager.createQueryBuilder()
  //   //   .insert()
  //   //   .into(MovieDetail)
  //   //   .values({
  //   //     detail: createMovieDto.detail,
  //   //   })
  //   //   .execute()

  // }

  /* istanbul ignore next */
  // createMovie(
  //   qr: QueryRunner,
  //   createMovieDto: CreateMovieDto,
  //   director: Director,
  //   movieDetailId: number,
  //   userId: number,
  //   movieFolder: string,
  // ) {
    
  // }

  // /* istanbul ignore next */
  // createMovieGenreRelation(qr: QueryRunner, movieId: number, genres: Genre[]) {
    
  // }

  /* istanbul ignore next */
  renameMovieFile(
    tempFolder: string,
    movieFolder: string,
    createMovieDto: CreateMovieDto,
  ) {
    if (this.configService.get<string>(envVariableKeys.env) !== 'prod') {
      return rename(
        join(process.cwd(), tempFolder, createMovieDto.movieFileName),
        join(process.cwd(), movieFolder, createMovieDto.movieFileName),
      );
    } else {
      // return this.commonService.saveMovieToPermanentStorage(
      //   createMovieDto.movieFileName,
      // );

      return this.commonService.saveMovieToPermanentStorage(
        createMovieDto.movieFileName,
      )
    }
  }

  async create(createMovieDto: CreateMovieDto, userId: number) {
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const director = await this.directorModel
        .findById(createMovieDto.directorId)
        .exec();

      if (!director) {
        throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
      }

      const genres = await this.genreModel
        .find({ _id: { $in: createMovieDto.genreIds } })
        .exec();

      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(
          `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
        );
      }

      const movieDetail = await this.movieDetailModel.create(
        [
          {
            detail: createMovieDto.detail,
          },
        ],
        {
          session,
        },
      );

      const movie = await this.movieModel.create(
        [
          {
            title: createMovieDto.title,
            movieFilePath: createMovieDto.movieFileName,
            creator: userId,
            director: director._id,
            genres: genres.map((genre) => genre._id),
            detail: movieDetail[0]._id,
          },
        ],
        {
          session,
        },
      );

      await session.commitTransaction();

      return this.movieModel
        .findById(movie[0]._id)
        .populate('detail')
        .populate('director')
        .populate({
          path: 'genres',
          model: 'Genre',
        })
        .exec();
    } catch (e) {
      await session.abortTransaction();
      console.log(e);
      throw new InternalServerErrorException('트랜잭션 실패');
    } finally {
      session.endSession();
    }
  }


  /* istanbul ignore next */
  // updateMovie(qr: QueryRunner, movieUpdateFields: UpdateMovieDto, id: number) {
  // }

  /* istanbul ignore next */
  // updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {

  // }

  // /* istanbul ignore next */
  // updateMovieGenreRelation(
  //   qr: QueryRunner,
  //   id: number,
  //   newGenres: Genre[],
  //   movie: Movie,
  // ) {

  // }

  async update(id: string, updateMovieDto: UpdateMovieDto) {
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const movie = await this.movieModel
        .findById(id)
        .populate('detail genres')
        .exec();

      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      const movieUpdateParams: {
        title?: string;
        movieFileName?: string;
        director?: Types.ObjectId;
        genres?: Types.ObjectId[];
      } = {
        ...movieRest,
      };

      if (directorId) {
        const director = await this.directorModel.findById(directorId).exec();

        if (!director) {
          throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
        }

        movieUpdateParams.director = director._id as Types.ObjectId;
      }

      if (genreIds) {
        const genres = await this.genreModel
          .find({
            _id: { $in: genreIds },
          })
          .exec();

        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`,
          );
        }

        movieUpdateParams.genres = genres.map(
          (genre) => genre._id,
        ) as Types.ObjectId[];
      }

      if (detail) {
        await this.movieDetailModel
          .findByIdAndUpdate(movie.detail._id, {
            detail,
          })
          .exec();
      }

      await this.movieModel.findByIdAndUpdate(id, movieUpdateParams);

      await session.commitTransaction();

      return this.movieModel
        .findById(id)
        .populate('detail director')
        .populate({
          path: 'genres',
          model: 'Genre',
        })
        .exec();
    } catch (error) {
      
      console.log("e :", error);

      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }


  /* istanbul ignore next */
  deleteMovie(id: number) {
    return this.movieModel.findByIdAndDelete(id);
  }

  async remove(id: string) {
    const movie = await this.movieModel.findById(id).populate('detail').exec();

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }

    await this.movieModel.findByIdAndDelete(id).exec();
    await this.movieDetailModel.findByIdAndDelete(movie.detail._id).exec();

    return id;
  }

  /* istanbul ignore next */
  async getLikedRecord(movieId: number, userId: number) {
    return await this.movieUserLikeModel.findOne({movie: movieId, user: userId});
  }

  async toggleMovieLike(movieId: string, userId: string, isLike: boolean) {
    const movie = await this.movieModel.findById(movieId).exec();

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다!');
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new UnauthorizedException('사용자 정보가 없습니다!');
    }

    const likeRecord = await this.movieUserLikeModel.findOne({
      movie: new Types.ObjectId(movieId),
      user: new Types.ObjectId(userId),
    });

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.movieUserLikeModel.findByIdAndDelete(likeRecord._id);
      } else {
        likeRecord.isLike = isLike;
        likeRecord.save();
      }
    } else {
      await this.movieUserLikeModel.create({
        movie: new Types.ObjectId(movieId),
        user: new Types.ObjectId(userId),
        isLike,
      });
    }

    const result = await this.movieUserLikeModel.findOne({
      movie: new Types.ObjectId(movieId),
      user: new Types.ObjectId(userId),
    });

    return {
      isLike: result && result.isLike,
    };
  }
}
